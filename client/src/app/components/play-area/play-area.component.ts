/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable max-lines */
/* eslint-disable @typescript-eslint/no-magic-numbers */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Component, HostListener, OnDestroy, OnInit, inject } from '@angular/core';
import { Timestamp } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { DEFAULT_BONUS, DEFAULT_INTERVAL, DIVISOR, INTERACTION_INTERVAL, MAX_TEXT_COUNT } from '@app/constants';
import { Question } from '@app/interfaces/question/question';
import { User } from '@app/interfaces/user/user';
import { AuthService } from '@app/services/authentification/auth.service';
import { ChannelsService } from '@app/services/channels/channels.service';
import { GameChannelsService } from '@app/services/channels/game-channels.service';
import { DialogsService } from '@app/services/dialog/dialogs.service';
import { GamePlayService } from '@app/services/games/game-play.service';
import { LangueService } from '@app/services/langues/langue.service';
import { MatchDataService } from '@app/services/matches/match-data.service';
import { RankingService } from '@app/services/ranking/ranking.service';
import { CurrentGameService } from '@app/services/room-game/current-game.service';
import { RoomService } from '@app/services/room-game/room.service';
import { SocketsService } from '@app/services/sockets/sockets.service';
import { SoundService } from '@app/services/sound/sound.service';
import { StatisticsService } from '@app/services/statistics/statistics.service';
import { ThemeService } from '@app/services/themes/theme.service';
import {
    BONUS,
    CONFIRM,
    FIRSTBONUS,
    MARGIN,
    ORGANISEREVALUATE,
    ORGANISERNEXT,
    PANICMODE,
    PAUSE,
    QRLPLACEHOLDER,
    QUIT,
    SELECTEDVALUE,
    WAITOTHERS,
} from './constants';

@Component({
    selector: 'app-play-area',
    templateUrl: './play-area.component.html',
    styleUrls: ['./play-area.component.scss'],
})
export class PlayAreaComponent implements OnInit, OnDestroy {
    abandonTime: number;
    gameName: string = '';
    isChatMinimized = false;
    isChatWindow = false;
    currentUser: User | null;
    backgroundImage: string = '';
    isShowResult: boolean = false;
    isWaitingOrganizer: boolean = false;
    isWaiting: boolean = false;
    selectedchoices: boolean[] = [];
    longAnswer: string = '';
    remainingTextCount: number = MAX_TEXT_COUNT;
    totalPoints: number = 0;
    disable: boolean;
    needBonus: boolean;
    quit: string = '';
    rightAnswer: boolean;
    answersGrade: number = 0;
    isPanicMode: boolean = false;
    isPaused: boolean = false;
    timer: number | null;
    isNext: boolean = false;
    sliderValue: number;
    answerInMarginBoundary: boolean;
    nbGoodAnswers: number = 0;
    qrlPlaceholder: string = '';
    selectedValue: string = '';
    margin: string = '';
    confirm: string = '';
    pause: string = '';
    panicMode: string = '';
    waitOthers: string = '';
    organiserEvaluate: string = '';
    organiserNext: string = '';
    firstBonus: string = '';
    bonus: string = '';
    isInitialized = false;
    roomService: RoomService = inject(RoomService);
    private lastInteractionTime: number = 0;
    private interactif: boolean = false;
    private timeInterval: ReturnType<typeof setInterval>;
    private choicesIndex: number;
    private router: Router = inject(Router);
    private gamePlayService: GamePlayService = inject(GamePlayService);
    private soundService: SoundService = inject(SoundService);
    private currentGameService: CurrentGameService = inject(CurrentGameService);
    private socketService: SocketsService = inject(SocketsService);
    private authentificationSerivce: AuthService = inject(AuthService);
    private themeService: ThemeService = inject(ThemeService);
    private languageService: LangueService = inject(LangueService);
    private gameChannelsService: GameChannelsService = inject(GameChannelsService);
    private dialogs: DialogsService = inject(DialogsService);
    private channelsService: ChannelsService = inject(ChannelsService);
    private statisticService: StatisticsService = inject(StatisticsService);
    private rankingService: RankingService = inject(RankingService);

    get question(): Question {
        return this.currentGameService.question;
    }

    get questionIndex(): number {
        return this.currentGameService.questionIndex;
    }

    get isQRL(): boolean {
        return this.question.type === 'QRL';
    }

    get isQCM(): boolean {
        return this.question.type === 'QCM';
    }

    get isQRE(): boolean {
        return this.question.type === 'QRE';
    }

    @HostListener('document:keydown', ['$event'])
    onKeydown(event: KeyboardEvent) {
        const targetElement = event.target as HTMLElement;
        if (targetElement && !this.disable) {
            this.gamePlayService.onKeydownNumber(event, this.selectedchoices, this.choicesIndex);
            if (targetElement.id !== 'message-input' && this.isQCM && this.isQRE && event.key === 'Enter') this.finishQuestion();
        }
    }

    @HostListener('window:keydown', ['$event'])
    handleKeyDown(event: KeyboardEvent) {
        if ((event.key === 'ArrowLeft' || event.key === 'ArrowRight' || event.key === 'ArrowUp' || event.key === 'ArrowDown') && this.isQRE) {
            this.onSelectedSlider(event);
        }
    }

    async ngOnInit(): Promise<void> {
        this.gameName = MatchDataService.currentMatch.title;
        this.channelsService.isResults = false;
        this.channelsService.roomCode = this.roomService.code;
        this.channelsService.isOrganisator = this.roomService.isHost;
        this.channelsService.inGame = true;
        if (!this.currentGameService.gameExist || !this.roomService.activeGame) this.router.navigate(['home']);
        else this.loadCurrentQuestion();
        this.sliderValue = this.question.qre?.lowerBound!;
        this.getTime();
        this.isFirst();
        this.waitTimerQuestion();
        this.waitNextQuestion();
        this.waitShowQuestion();
        this.stopWaiting();
        this.soundService.playAudio();
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
        this.currentUser = await this.authentificationSerivce.getCurrentUser();
        if (this.currentUser) {
            this.themeService.currentTheme(this.currentUser).subscribe((theme) => {
                this.backgroundImage = `url(${theme})`;
            });
            this.languageService.currentLanguage(this.currentUser).subscribe((language) => {
                this.updatedLabelLanguage(language);
            });
        }

        this.timeInterval = setInterval(() => {
            if (this.interactif) {
                this.lastInteractionTime++;
                if (this.lastInteractionTime === INTERACTION_INTERVAL) {
                    this.socketService.send('interactif', false);
                    this.interactif = false;
                    this.lastInteractionTime = 0;
                }
            }
        }, DEFAULT_INTERVAL);
        setTimeout(() => {
            this.isInitialized = true;
        }, 100);
    }

    ngOnDestroy(): void {
        this.roomService.activeGame = false;
        this.currentGameService.resetGame();
        clearInterval(this.timeInterval);
    }

    updatedLabelLanguage(language: string): void {
        this.quit = QUIT[language];
        this.qrlPlaceholder = QRLPLACEHOLDER[language];
        this.selectedValue = SELECTEDVALUE[language];
        this.margin = MARGIN[language];
        this.confirm = CONFIRM[language];
        this.pause = PAUSE[language];
        this.panicMode = PANICMODE[language];
        this.waitOthers = WAITOTHERS[language];
        this.organiserEvaluate = ORGANISEREVALUATE[language];
        this.organiserNext = ORGANISERNEXT[language];
        this.firstBonus = FIRSTBONUS[language];
        this.bonus = BONUS[language];
    }

    onSelected(index: number): void {
        this.selectedchoices[index] = !this.selectedchoices[index];
        this.socketService.send('setChoice', index + 1);
    }

    onSelectedSlider(event?: KeyboardEvent) {
        const delay = 100;
        setTimeout(() => {
            const lowerMargins = this.gamePlayService.calculateMargin(this.question, false);
            const upperMargins = this.gamePlayService.calculateMargin(this.question, true);
            const data = { value: this.sliderValue, lowerMargin: lowerMargins, upperMargin: upperMargins, goodAnswer: this.question.qre?.goodAnswer };
            if (event) {
                this.socketService.send('setQreValue', data);
            } else {
                this.socketService.send('setQreValue', data);
            }
        }, delay);
    }

    finishQuestion() {
        if (!this.validateAnswer() || this.disable) return;
        if (this.isQRL) {
            this.socketService.send('isFinish', this.longAnswer.trim());
        } else if (this.isQCM) {
            this.socketService.send('isFinish');
            this.questionResult();
        } else if (this.isQRE) {
            this.socketService.send('isFinish');
            this.questionResultQre();
            this.otherQREResult();
        }
        this.disable = true;
        this.socketService.on('waitPlayer', () => {
            this.isWaiting = true;
        });
    }

    sendAnswer() {
        if (this.longAnswer.trim() === '') this.longAnswer = '(Aucune réponse)';
        this.socketService.send('answerSend', this.longAnswer.trim());
    }

    valueChange(value: string) {
        this.remainingTextCount = MAX_TEXT_COUNT - value.length;
        this.socketService.send('interactif', true);
        // jai add ligne 249 //
        this.socketService.send('userAnswer', value);
        this.interactif = true;
        this.lastInteractionTime = 0;
    }

    marginValue(value: number): number {
        return Math.round((value / DIVISOR) * (this.question.qre?.upperBound! - this.question.qre?.lowerBound!));
    }

    onChatMinimized(isMinimized: boolean) {
        this.isChatMinimized = isMinimized;
    }

    onWindowChange(isWindow: boolean) {
        this.isChatWindow = isWindow;
    }

    async quitGame(): Promise<void> {
        if (await this.dialogs.openGiveUp()) {
            this.gameChannelsService.quitGameChannel(this.roomService.code, this.currentUser);
            this.socketService.send('giveUp');
            this.abandonTime = Timestamp.now().seconds;
            const timePlayed = this.abandonTime - this.currentGameService.startTime;
            this.statisticService.updateStatisticsAbandon(this.currentUser, this.gameName, timePlayed, this.nbGoodAnswers);
            if (this.roomService.gameMode === 'fa-trophy') {
                this.rankingService.changePlayerRankingAbandon(this.currentUser);
            }
            this.router.navigate(['home']);
            this.socketService.disconnect();
        }
    }

    private validateAnswer(): boolean {
        let shouldReturn = this.isQRL && this.longAnswer.trim() !== '' && this.timer !== 0;
        shouldReturn ||= this.isQCM && this.verifyQCMAnswers();
        shouldReturn ||= this.isQRE;
        return shouldReturn;
    }

    private verifyQCMAnswers(): boolean {
        return this.gamePlayService.isConfirmAnswerSelected(this.selectedchoices, this.choicesIndex, this.timer);
    }

    private loadCurrentQuestion(): void {
        this.isNext = false;
        this.timer = this.currentGameService.time;
        this.needBonus = false;
        this.currentGameService.loadCurrentQuestion();
        this.sliderValue = this.question.qre?.lowerBound!;
        this.choicesIndex = this.question.choices ? this.question.choices.length : 0;
        for (let i = 0; i < this.choicesIndex; i++) {
            this.selectedchoices[i] = false;
        }
        this.longAnswer = '';
        this.disable = false;
    }

    private questionResult() {
        this.rightAnswer = this.gamePlayService.rightAnswer(this.selectedchoices, this.choicesIndex, this.question.choices);
        if (this.rightAnswer) this.socketService.send('playerFirst');
    }
    private questionResultQre() {
        this.rightAnswer = this.gamePlayService.rightAnswerQre(this.question, this.sliderValue);
        if (this.rightAnswer) this.socketService.send('exactAnswer');
    }

    private otherQREResult() {
        this.answerInMarginBoundary = this.gamePlayService.answerWithinMarginBoundary(this.question, this.sliderValue);
    }

    private showResult() {
        this.interactif = false;
        this.lastInteractionTime = 0;
        this.disable = true;
        this.isShowResult = true;
        if (this.isQCM) {
            this.questionResult();
            if (this.rightAnswer) {
                this.totalPoints += this.needBonus ? this.question.points * DEFAULT_BONUS : this.question.points;
                this.nbGoodAnswers++;
            }
        } else if (this.isQRL) {
            if (this.answersGrade === 100) {
                this.nbGoodAnswers++;
            }
            const cent = 100;
            this.totalPoints += this.question.points * (this.answersGrade / cent);
        } else if (this.isQRE) {
            this.questionResultQre();
            this.otherQREResult();
            if (this.rightAnswer) {
                this.totalPoints += this.question.points * DEFAULT_BONUS;
                this.nbGoodAnswers++;
            } else if (this.answerInMarginBoundary) {
                this.totalPoints += this.question.points;
            }
        }

        this.socketService.send('scorePlayer', this.totalPoints);
        this.socketService.send('nbGoodAnswersPlayer', this.nbGoodAnswers);
    }

    private setNextQuestion() {
        this.isShowResult = false;
        this.isNext = false;
        this.currentGameService.questionIndex += 1;
        this.loadCurrentQuestion();
    }

    private waitShowQuestion() {
        this.socketService.on('answersGrade', (grade: number) => {
            this.answersGrade = grade;
        });
        this.socketService.on('showQuestion', () => {
            this.isPaused = false;
            this.showResult();
            this.isWaiting = false;
            this.isWaitingOrganizer = true;
        });
    }

    private waitTimerQuestion() {
        this.socketService.on('timerShowQuestion', () => {
            this.isNext = true;
            this.isWaitingOrganizer = false;
        });
    }

    private waitNextQuestion() {
        this.socketService.on('showNextQuestion', () => {
            this.setNextQuestion();
        });
    }

    private stopWaiting() {
        this.socketService.on('stopWaiting', () => {
            this.isWaiting = false;
        });
    }

    private isFirst() {
        this.socketService.on('isBonus', () => {
            this.needBonus = true;
        });
    }

    private getTime() {
        this.socketService.on('timer', (data: { time: number; pauseState: boolean; panicState: boolean }) => {
            this.isPaused = data.pauseState;
            this.isPanicMode = data.panicState;
            this.timer = data.time;

            if (data.time === 0 && !this.isNext) {
                this.isPanicMode = false;
                this.soundService.stop();
                if (!this.isWaiting && this.isQRL && !this.disable) this.sendAnswer();
                this.disable = true;
                this.interactif = false;
                this.lastInteractionTime = 0;
            }
        });
    }
}
