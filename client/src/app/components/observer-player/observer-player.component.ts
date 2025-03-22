import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
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
} from '@app/components/play-area/constants';
import { DIVISOR, MAX_TEXT_COUNT, TO_HOME } from '@app/constants';
import { Question } from '@app/interfaces/question/question';
import { User } from '@app/interfaces/user/user';
import { AuthService } from '@app/services/authentification/auth.service';
import { ChannelsService } from '@app/services/channels/channels.service';
import { GameChannelsService } from '@app/services/channels/game-channels.service';
import { DialogsService } from '@app/services/dialog/dialogs.service';
import { LangueService } from '@app/services/langues/langue.service';
import { ObserverService } from '@app/services/observer/observer-service.service';
import { CurrentGameService } from '@app/services/room-game/current-game.service';
import { RoomService } from '@app/services/room-game/room.service';
import { SocketsService } from '@app/services/sockets/sockets.service';
import { ThemeService } from '@app/services/themes/theme.service';

@Component({
  selector: 'app-observer-player',
  templateUrl: './observer-player.component.html',
  styleUrls: ['./observer-player.component.scss']
})
export class ObserverPlayerComponent implements OnInit {
  backgroundImage: string = '';
  language: string = '';
  isChatMinimized = false;
  isChatWindow = false;
  isInitialized = false;

  rightAnswer: boolean;
  remainingTextCount: number = MAX_TEXT_COUNT;
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
  quit: string = '';

  timer: number = 0;
  disable: boolean = false;
  isNext: boolean = false;
  isPaused: boolean = false;
  isPanicMode: boolean = false;
  totalPoints: number = 0;
  needBonus: boolean = false;
  sliderValue: number = 0;
  gainedPoints: number = 0;
  isShowResult: boolean = false;
  answersGrade: number = 0;
  isWaitingOrganizer: boolean = false;
  isWaiting: boolean = false;
  selectedChoices: boolean[] = [];
  longAnswer: string = '';
  currentUser: User | null;

  // private soundService: SoundService = inject(SoundService);
  private socketService: SocketsService = inject(SocketsService);
  private currentGameService: CurrentGameService = inject(CurrentGameService);
  private themeService: ThemeService = inject(ThemeService);
  private languageService: LangueService = inject(LangueService);
  private dialogService: DialogsService = inject(DialogsService);
  private router: Router = inject(Router);
  // private channelsService: ChannelsService = inject(ChannelsService);
  private roomService: RoomService = inject(RoomService);
  observerService: ObserverService = inject(ObserverService);
  private channelsService: ChannelsService = inject(ChannelsService);
  private authentificationSerivce: AuthService = inject(AuthService);
  private gameChannelsService: GameChannelsService = inject(GameChannelsService);


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
    this.currentUser = await this.authentificationSerivce.getCurrentUser();
    this.updatedLabelLanguage(this.language);
    this.setObservedState();
    this.getTime();
    this.socketService.send('timerGame', this.roomService.code);
    this.waitNextQuestion();
    this.waitTimerQuestion();
    this.showQuestion();
    this.playerFinish();
    this.obsScore();
    this.isBonusOrg();
    this.selectValueObs();
    this.pointGrade();
    this.waitPlayer();
    this.stopWaiting();
    this.playerChoice();
    this.answerObs();
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

  marginValue(value: number): number {
    return Math.round((value / DIVISOR) * (this.question.qre?.upperBound! - this.question.qre?.lowerBound!));
  }

  async quitGame(): Promise<void> {
    if (await this.dialogService.openGiveUp()) {
      this.gameChannelsService.quitGameChannel(this.roomService.code, this.currentUser);
      this.socketService.send('quitObserved');
      this.router.navigate([TO_HOME]);
    }
  }

  private getTime() {
    this.socketService.on('timer', (data: { time: number; pauseState: boolean; panicState: boolean }) => {
      this.timer = data.time ? data.time : 0;
      if (!this.isShowResult) this.isPaused = data.pauseState;
      if (this.timer != 0) this.isPanicMode = data.panicState;
      if (this.timer == 0 && this.isNext) this.isNext = false;
      else if (this.timer == 0 && !this.isNext) {
        this.isPanicMode = false;
        this.disable = true;
      }
    });
  }

  private waitNextQuestion() {
    this.socketService.on('showNextQuestion', () => {
      if (!this.observerService.isOrg) this.currentGameService.setNextQuestion();
      this.needBonus = false;
      this.isShowResult = false;
      const choicesIndex = this.question.choices ? this.question.choices.length : 0;
      for (let i = 0; i < choicesIndex; i++) {
        this.selectedChoices[i] = false;
      }
      this.gainedPoints = 0;
      this.longAnswer = '';
      this.isNext = false;
      this.disable = false;
    });
  }

  private waitTimerQuestion() {
    this.socketService.on('timerShowQuestion', () => {
      this.isNext = true;
      this.isWaitingOrganizer = false;
    });
  }

  private showQuestion() {
    this.socketService.on('showQuestion', () => {
      this.isWaiting = false;
      this.isWaitingOrganizer = true;
      this.isShowResult = true;
      this.disable = true;
      this.isPaused = false;
      if (this.gainedPoints >= this.question.points) this.rightAnswer = true;
      else this.rightAnswer = false;
    });
  }

  private playerFinish() {
    this.socketService.on('playerFinish', () => {
      this.disable = true;
    });
  }

  private obsScore() {
    this.socketService.on('obsScore', (score: number) => {
      this.gainedPoints = score - this.totalPoints;
      this.totalPoints = score;
      if (this.gainedPoints >= this.question.points) this.rightAnswer = true;
      else this.rightAnswer = false;
    });
  }

  private isBonusOrg() {
    this.socketService.on('isBonus', () => {
      this.needBonus = true;
    });
  }

  private selectValueObs() {
    this.socketService.on('selectValueObs', (value: number) => {
      this.sliderValue = value;
    });
  }

  private pointGrade() {
    this.socketService.on('answersGrade', (value: number) => {
      this.answersGrade = value;
    });
  }

  private waitPlayer() {
    this.socketService.on('waitPlayer', () => {
      this.isWaiting = true;
    });
  }

  private stopWaiting() {
    this.socketService.on('stopWaiting', () => {
      this.isWaiting = false;
    });
  }

  private playerChoice() {
    this.socketService.on('playerChoice', (choice: number) => {
      this.selectedChoices[choice] = !this.selectedChoices[choice];
    });
  }

  private answerObs() {
    this.socketService.on('answerObs', (answer: string) => {
      this.longAnswer = answer;
    });
  }

  private setObservedState(): void {
    this.socketService.on(
      'setObsPlayer',
      (data: {
        questionIndex: number;
        disable: boolean;
        isNext: boolean;
        score: number;
        needBonus: boolean;
        selectedValue: number;
        gainedPoints: number;
        isShowResult: boolean;
        pointGrade: number;
        isWaiting: boolean;
        isWaitingOrg: boolean;
        selectedChoices: number[];
        answer: string;
      }) => {
        this.currentGameService.setQuestionIndex(data.questionIndex);
        this.disable = data.disable;
        this.isNext = data.isNext;
        this.totalPoints = data.score;
        this.needBonus = data.needBonus;
        this.sliderValue = data.selectedValue;
        this.gainedPoints = data.gainedPoints ? data.gainedPoints : 0;
        this.isShowResult = data.isShowResult;
        this.answersGrade = data.pointGrade;
        this.isWaiting = data.isWaiting;
        this.isWaitingOrganizer = data.isWaitingOrg;
        const choicesIndex = this.question.choices ? this.question.choices.length : 0;
        for (let i = 0; i < choicesIndex; i++) {
          this.selectedChoices[i] = false;
        }
        for (const value of data.selectedChoices) {
          this.selectedChoices[value] = true;
        }
        this.longAnswer = data.answer;
        if (this.gainedPoints >= this.question.points) this.rightAnswer = true;
        else this.rightAnswer = false;
      },
    );
  }
}
