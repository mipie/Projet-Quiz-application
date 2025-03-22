import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TO_HOME } from '@app/constants';
import { Question } from '@app/interfaces/question/question';
import { DialogsService } from '@app/services/dialog/dialogs.service';
import { LangueService } from '@app/services/langues/langue.service';
import { CurrentGameService } from '@app/services/room-game/current-game.service';
import { SocketsService } from '@app/services/sockets/sockets.service';
// import { SoundService } from '@app/services/sound/sound.service';
import { ObserverService } from '@app/services/observer/observer-service.service';
import { RoomService } from '@app/services/room-game/room.service';
import { ThemeService } from '@app/services/themes/theme.service';
import { ALLPLAYERSFINISHED, COUNTDOWNFINISH, EVALUATEQRL, NEXTQUESTION, PRESENTRESULT, QTEANSWER, QUIT, TIMELEFT } from './constants';
import { User } from '@app/interfaces/user/user';
import { AuthService } from '@app/services/authentification/auth.service';
import { GameChannelsService } from '@app/services/channels/game-channels.service';
import { ChannelsService } from '@app/services/channels/channels.service';

@Component({
    selector: 'app-observer-org',
    templateUrl: './observer-org.component.html',
    styleUrls: ['./observer-org.component.scss'],
})
export class ObserverOrgComponent implements OnInit {
    disable: boolean = true;
    isPaused: boolean = false;
    isPanicMode: boolean = false;
    isNext: boolean = false;
    time: number = 0;
    answers: { playerName: string; answer: string }[] = [];
    isAllFinish: boolean = false;
    backgroundImage: string = '';
    language: string = '';
    evaluateQRL: string = '';
    qteAnswer: string = '';
    countdownFinish: string = '';
    allPlayersFinish: string = '';
    nextQuestion: string = '';
    presentResult: string = '';
    timeLeft: string = '';
    quit: string = ''; 
    isChatMinimized = false;
    isChatWindow = false;
    isInitialized = false;
    currentUser: User | null;
    // private soundService: SoundService = inject(SoundService);
    private authentificationSerivce: AuthService = inject(AuthService);
    private gameChannelsService: GameChannelsService = inject(GameChannelsService);
    private socketService: SocketsService = inject(SocketsService);
    private currentGameService: CurrentGameService = inject(CurrentGameService);
    private themeService: ThemeService = inject(ThemeService);
    private languageService: LangueService = inject(LangueService);
    private dialogService: DialogsService = inject(DialogsService);
    private router: Router = inject(Router);
    private roomService: RoomService = inject(RoomService);
    private observerService: ObserverService = inject(ObserverService);
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
        this.backgroundImage = `url(${this.themeService.theme}`;
        this.language = this.languageService.language;
        this.channelsService.isResults = false;
        this.channelsService.roomCode = this.roomService.code;
        this.channelsService.isOrganisator = this.roomService.isHost;
        this.channelsService.inGame = true;
        this.channelsService.currentChannel = '*************' + this.roomService.code;
        this.updatedLabelLanguage(this.language);
        this.setObservedState();
        this.socketService.send('timerGame', this.roomService.code);
        this.getTime();
        this.waitNextQuestion();
        this.allPlayerFinish();
        this.getAllOpenEndedAnswers();
        this.waitTimerQuestion();
        this.orgGiveGrade();
        this.currentUser = await this.authentificationSerivce.getCurrentUser();
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

    async quitGame(): Promise<void> {
        if (await this.dialogService.openGiveUp(this.quit)) {
            this.gameChannelsService.quitGameChannel(this.roomService.code, this.currentUser);
            this.socketService.send('quitObserved');
            this.router.navigate([TO_HOME]);
        }
    }

    private waitNextQuestion() {
        this.socketService.on('showNextQuestion', () => {
            this.isNext = false;
            this.isAllFinish = false;
            this.disable = true;
            this.currentGameService.disable = true;
            if (this.observerService.isOrg) this.currentGameService.setNextQuestion();
            this.currentGameService.verifyIsLast();
        });
    }

    private waitTimerQuestion() {
        this.socketService.on('timerShowQuestion', () => {
            this.disable = true;
            this.currentGameService.disable = true;
            this.isPaused = false;
            this.isPanicMode = false;
            this.isNext = true;
            this.isAllFinish = false;
        });
    }

    private getTime() {
        this.socketService.on('timer', (data: { time: number; pauseState: boolean; panicState: boolean }) => {
            this.time = data.time ? data.time : 0;
            if (!this.isAllFinish) this.isPaused = data.pauseState;
            if (this.time != 0) this.isPanicMode = data.panicState;
            if (this.time === 0 && !this.isAllFinish) {
                this.isAllFinish = true;
                this.disable = false;
                this.currentGameService.disable = false;
                this.isNext = false;
                if (this.isQRL) {
                    this.disable = true;
                    this.currentGameService.disable = true;
                }
            }
        });
    }

    private allPlayerFinish() {
        this.socketService.on('allFinish', () => {
            this.isAllFinish = true;
            if (!this.isQRL) {
                this.disable = false;
                this.currentGameService.disable = false;
            }
            this.isNext = false;
        });
    }

    private orgGiveGrade() {
        this.socketService.on('orgGiveGrade', (name) => {
            const index = this.answers.findIndex(player => player.playerName === name);
            if (index !== -1) {
                this.answers.splice(index, 1);
            }
            if (this.answers.length === 0) {
                this.disable = false;
                this.currentGameService.disable = false;
            }
        })
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

    private setObservedState(): void {
        this.socketService.on(
            'setObserver',
            (data: {
                questionIndex: number;
                isAllFinish: boolean;
                disable: boolean;
                isNext: boolean;
                answers: {
                    playerName: string;
                    answer: string;
                }[];
            }) => {
                this.currentGameService.setQuestionIndex(data.questionIndex);
                this.isAllFinish = data.isAllFinish;
                this.disable = data.disable;
                this.currentGameService.disable = this.disable;
                this.isNext = data.isNext;
                this.answers = data.answers;
            },
        );
    }
}
