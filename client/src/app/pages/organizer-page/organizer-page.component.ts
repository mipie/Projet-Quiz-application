/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MAX_PANIC_TIME_QCM, MAX_PANIC_TIME_QRL } from '@app/constants';
import { Question } from '@app/interfaces/question/question';
import { User } from '@app/interfaces/user/user';
import { AuthService } from '@app/services/authentification/auth.service';
import { ChannelsService } from '@app/services/channels/channels.service';
import { GameChannelsService } from '@app/services/channels/game-channels.service';
import { DialogsService } from '@app/services/dialog/dialogs.service';
import { HistogramService } from '@app/services/histogram/histogram.service';
import { SharedIdService } from '@app/services/id/shared-id.service';
import { LangueService } from '@app/services/langues/langue.service';
import { MatchDataService } from '@app/services/matches/match-data.service';
import { CurrentGameService } from '@app/services/room-game/current-game.service';
import { RoomService } from '@app/services/room-game/room.service';
import { SocketsService } from '@app/services/sockets/sockets.service';
import { SoundService } from '@app/services/sound/sound.service';
import { ThemeService } from '@app/services/themes/theme.service';
import { ALLPLAYERSFINISHED, COUNTDOWNFINISH, EVALUATEQRL, NEXTQUESTION, PRESENTRESULT, QTEANSWER, QUIT, TIMELEFT } from './constants';

@Component({
    selector: 'app-organizer-page',
    templateUrl: './organizer-page.component.html',
    styleUrls: ['./organizer-page.component.scss'],
})
export class OrganizerPageComponent implements OnInit {
    disable: boolean = true;
    isPaused: boolean = false;
    isPanicMode: boolean = false;
    answers: { playerName: string; answer: string }[] = [];
    showAnswers: boolean = false;
    time: number | null;
    isAllFinish: boolean = false;
    isNext: boolean = false;
    isShowResult: boolean = false;
    currentUser: User | null;
    backgroundImage: string = '';
    evaluateQRL: string = '';
    qteAnswer: string = '';
    countdownFinish: string = '';
    allPlayersFinish: string = '';
    nextQuestion: string = '';
    presentResult: string = '';
    timeLeft: string = '';
    isChatMinimized = false;
    isChatWindow = false;
    quit: string = '';
    isInitialized = false;
    roomService: RoomService = inject(RoomService);
    private dialogs: DialogsService = inject(DialogsService);
    private histogramService: HistogramService = inject(HistogramService);
    private soundService: SoundService = inject(SoundService);
    private matchService: MatchDataService = inject(MatchDataService);
    private socketService: SocketsService = inject(SocketsService);
    private router: Router = inject(Router);
    private currentGameService: CurrentGameService = inject(CurrentGameService);
    private authentificationService: AuthService = inject(AuthService);
    private themeService: ThemeService = inject(ThemeService);
    private languageService: LangueService = inject(LangueService);
    private gameChannelsService: GameChannelsService = inject(GameChannelsService);
    private channelsService: ChannelsService = inject(ChannelsService);

    get question(): Question {
        return this.currentGameService.question;
    }

    get questionIndex(): number {
        return this.currentGameService.questionIndex;
    }

    get isLast(): boolean {
        return this.currentGameService.isLast;
    }

    get isQCM(): boolean {
        return this.currentGameService.isQCM;
    }

    get isQRL(): boolean {
        return this.currentGameService.isQRL;
    }

    get isQRE(): boolean {
        return this.currentGameService.isQRE;
    }

    async ngOnInit(): Promise<void> {
        this.currentUser = await this.authentificationService.getCurrentUser();
        this.channelsService.isResults = false;
        this.channelsService.roomCode = this.roomService.code;
        this.channelsService.isOrganisator = true;
        this.channelsService.inGame = true;
        if ((window as any).electron) {
            (window as any).electron.setData({
                isResults: this.channelsService.isResults,
                roomCode: this.channelsService.roomCode,
                isOrganisator: this.channelsService.isOrganisator,
                inGame: this.channelsService.inGame,
            });
            (window as any).electron.watchSize((data: any) => {
                this.onChatMinimized(data.isMinimize);
                this.onWindowChange(data.isMaximise);
            });
        }
        if (this.currentUser) {
            this.themeService.currentTheme(this.currentUser).subscribe((theme) => {
                this.backgroundImage = `url(${theme})`;
            });
            this.languageService.currentLanguage(this.currentUser).subscribe((language) => {
                this.updatedLabelLanguage(language);
            });
        }
        if (SharedIdService.id === undefined) this.router.navigate(['createPlay']);
        else this.currentGameService.loadCurrentQuestion();
        this.getAllOpenEndedAnswers();
        this.allPlayerFinish();
        this.allPlayersGaveUp();
        this.getTime();
        this.socketService.send('startedGame');
        this.socketService.send('didAllGiveUp');
        setTimeout(() => {
            this.isInitialized = true;
        }, 100);
    }

    onChatMinimized(isMinimized: boolean) {
        this.isChatMinimized = isMinimized;
    }

    onWindowChange(isWindow: boolean) {
        this.isChatWindow = isWindow;
    }

    async quitGame(): Promise<void> {
        if (await this.dialogs.openGiveUp()) {
            this.gameChannelsService.deleteGameChannel(this.roomService.code);
            this.socketService.send('quitGame');
            this.router.navigate(['home']);
            this.socketService.disconnect();
        }
    }

    updatedLabelLanguage(language: string): void {
        this.quit = QUIT[language];
        this.evaluateQRL = EVALUATEQRL[language];
        this.qteAnswer = QTEANSWER[language];
        this.countdownFinish = COUNTDOWNFINISH[language];
        this.allPlayersFinish = ALLPLAYERSFINISHED[language];
        this.nextQuestion = NEXTQUESTION[language];
        this.presentResult = PRESENTRESULT[language];
        this.timeLeft = TIMELEFT[language];
    }

    activatePanicMode(): void {
        if (this.isPanicQCM() || this.isPanicQRL() || this.isPanicQRE()) {
            this.isPanicMode = true;
            this.socketService.send('panicTimer', this.time);
            this.soundService.playAudio();
        }
    }

    isPanicQCM(): boolean {
        return this.isQCM && this.isTimeValue(MAX_PANIC_TIME_QCM);
    }

    isPanicQRL(): boolean {
        return this.isQRL && this.isTimeValue(MAX_PANIC_TIME_QRL);
    }

    isPanicQRE(): boolean {
        return this.isQRE && this.isTimeValue(MAX_PANIC_TIME_QCM);
    }

    isTimeValue(valueTime: number): boolean {
        return this.time !== null && this.time <= valueTime && this.isNext === false;
    }

    togglePausePlay(): void {
        this.isPaused = !this.isPaused;
        this.socketService.send('pauseTimer', this.isPaused);
    }

    timerNextQuestion() {
        this.disable = true;
        this.currentGameService.disable = true;
        this.isAllFinish = false;
        this.isNext = true;
        this.currentGameService.timerNextQuestion();
    }

    usersToResult(): void {
        if (this.roomService.isHost && !this.currentGameService.isGameDone) {
            this.matchService.addMatch(MatchDataService.currentMatch).subscribe();
            this.currentGameService.isGameDone = true;
        }
        this.socketService.send('resultEndingGame');
        this.router.navigate(['result']);
    }

    evaluateQRLAnswer(index: number, score: number): void {
        const { playerName, answer } = this.answers[index];
        const roomCode = this.roomService.code;
        if (answer === '(Aucune réponse)') this.autoevaluateEmptyAnswers(score);
        else {
            this.histogramService.sumGrade(score);
            this.socketService.send('answerEvaluated', { playersName: playerName, room: roomCode, grade: score });
            this.answers.splice(index, 1);
        }
        if (this.answers.length === 0) this.showQuestionResults();
    }

    autoevaluateEmptyAnswers(score: number): void {
        const emptyAnswers = this.answers.filter((answerObj) => answerObj.answer === '(Aucune réponse)');
        const roomCode = this.roomService.code;

        emptyAnswers.forEach((answerObj) => {
            this.histogramService.sumGrade(score);
            const name = answerObj.playerName;
            this.socketService.send('answerEvaluated', { playersName: name, room: roomCode, grade: score });
        });

        this.answers = this.answers.filter((answerObj) => answerObj.answer !== '(Aucune réponse)');
    }

    buttonClick() {
        this.soundService.buttonClick();
    }

    private getTime() {
        this.socketService.on('timer', (data: { time: number; pauseState: boolean; panicState: boolean }) => {
            this.time = data.time ? data.time : 0;
            if (this.time === 0 && this.isNext) {
                this.time = null;
                this.isNext = false;
                this.setNextQuestion();
            } else if (this.time === 0 && !this.isAllFinish && !this.isShowResult) {
                this.isAllFinish = true;
                this.soundService.stop();
                if (this.isQCM) this.showQuestionResults();
                if (this.isQRE) this.showQuestionResults();
            }
        });
    }

    private setNextQuestion() {
        this.currentGameService.setNextQuestion();
        this.isAllFinish = false;
        this.isShowResult = false;
        this.isNext = false;
        this.isPaused = false;
        this.isPanicMode = false;
    }

    private allPlayerFinish() {
        this.socketService.on('allFinish', () => {
            this.isAllFinish = true;
            this.socketService.send('pauseTimer', true);
            if (this.isQCM) this.showQuestionResults();
            if (this.isQRE) this.showQuestionResults();
            else this.socketService.send('stopWaiting');
        });
    }

    private showQuestionResults() {
        this.isShowResult = true;
        this.disable = false;
        this.currentGameService.disable = false;
        this.currentGameService.showResultQuestion();
    }

    private allPlayersGaveUp() {
        this.socketService.on('allGaveUp', async () => {
            this.gameChannelsService.deleteGameChannel(this.roomService.code);
            await this.dialogs.openRedirectHome('Tous les joueurs ont abandonné la partie.', 'Au revoir!');
            this.socketService.send('quitGame');
        });
    }

    private getAllOpenEndedAnswers(): void {
        this.socketService.on('newOpenEndedAnswer', (data: { playerName: string; answer: string }) => {
            if (this.isQRL) {
                this.answers.push(data);
                this.answers.sort((a, b) => {
                    return a.playerName.localeCompare(b.playerName);
                });
            }
        });
    }
}
