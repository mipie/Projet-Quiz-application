import { Injectable, inject } from '@angular/core';
import { Timestamp } from '@angular/fire/firestore';
import { MAX_GAME_DURATION } from '@app/constants';
import { Game } from '@app/interfaces/game/game';
import { Question } from '@app/interfaces/question/question';
import { HistogramService } from '@app/services/histogram/histogram.service';
import { SocketsService } from '@app/services/sockets/sockets.service';
import { BehaviorSubject } from 'rxjs';
import { RoomService } from './room.service';

@Injectable({
    providedIn: 'root',
})
export class CurrentGameService {
    choicesSubject = new BehaviorSubject<Question>({} as Question);
    questionIndex: number;
    question: Question;
    isGameDone: boolean = false;
    startTime: number;
    questionsList: Question[];
    previousPage: string;
    previousTitleGame: string | undefined;
    disable: boolean = true;
    private game: Game | undefined;
    private isEnding: boolean;
    private timeValue: number | null;
    private roomCode: string;
    private roomService: RoomService = inject(RoomService);
    private socketService: SocketsService = inject(SocketsService);
    private histogramService: HistogramService = inject(HistogramService);

    get time(): number | null {
        return this.timeValue;
    }

    get isLast(): boolean {
        return this.isEnding;
    }

    get gameExist(): boolean {
        return this.game !== undefined;
    }

    get title(): string {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        return this.gameExist ? this.game!.title : '';
    }

    get isQCM(): boolean {
        return this.question.type === 'QCM';
    }

    get isQRL(): boolean {
        return this.question.type === 'QRL';
    }

    get isQRE(): boolean {
        return this.question.type === 'QRE';
    }

    setGame(game: Game) {
        this.isGameDone = false;
        this.game = game;
        this.questionIndex = 0;
        this.questionsList = this.game.questions;
        this.timeValue = MAX_GAME_DURATION;
        if (this.questionsList[0].type === 'QCM') this.timeValue = this.game.duration;
        if (this.questionsList[0].type === 'QRE') this.timeValue = this.game.duration;
        this.roomCode = this.roomService.code;
        this.isEnding = false;
    }

    setQuestionIndex(questionIndex: number) {
        this.questionIndex = questionIndex;
        this.question = this.questionsList[this.questionIndex];
        this.choicesSubject.next(this.question);
        if (this.question === this.questionsList[this.questionsList.length - 1]) this.isEnding = true;
    }

    verifyIsLast() {
        if (this.question === this.questionsList[this.questionsList.length - 1]) this.isEnding = true;
    }

    loadCurrentQuestion() {
        if (this.questionIndex === 0) {
            this.startTime = Timestamp.now().seconds;
        }
        this.question = this.questionsList[this.questionIndex];
        this.choicesSubject.next(this.question);
        if (this.roomService.isHost) {
            if (this.isQRL) this.socketService.send('sumInteractions');
            this.socketService.send('startTimer', { startValue: this.timeValue, roomName: this.roomCode });
        }
    }

    async setNextQuestion() {
        if (this.roomService.isHost) this.socketService.send('nextQuestion');
        this.questionIndex++;
        this.timeValue = MAX_GAME_DURATION;
        if (this.questionsList[this.questionIndex].type === 'QCM') {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            this.timeValue = this.game!.duration;
        }
        if (this.questionsList[this.questionIndex].type === 'QRE') {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            this.timeValue = this.game!.duration;
        }
        this.loadCurrentQuestion();
    }

    timerNextQuestion() {
        this.socketService.send('startTimer', { startValue: 3, roomName: this.roomCode });
        this.socketService.send('timerNextQuestion');
    }

    showResultQuestion() {
        this.socketService.send('showResult');
        if (this.isQCM) this.histogramService.sendHistogram();
        else if (this.isQRL) this.histogramService.sendGradeCount();
        else if (this.isQRE) this.histogramService.sendHistogram();
        if (this.question === this.questionsList[this.questionsList.length - 1]) this.isEnding = true;
    }

    showResultQuestionObserver() {
        this.socketService.send('showResult');
        if (this.question === this.questionsList[this.questionsList.length - 1]) this.isEnding = true;
    }

    nextHistogram() {
        this.questionIndex++;
        this.question = this.questionsList[this.questionIndex];
    }

    previousHistogram() {
        this.questionIndex--;
        this.question = this.questionsList[this.questionIndex];
    }

    firstHistogram() {
        this.questionIndex = 0;
        this.question = this.questionsList[this.questionIndex];
    }

    resetGame() {
        this.game = undefined;
    }
}
