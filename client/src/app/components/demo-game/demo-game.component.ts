/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Component, ElementRef, HostListener, OnDestroy, OnInit, QueryList, ViewChildren, inject } from '@angular/core';
import { Router } from '@angular/router';
import { DEFAULT_BONUS, DEFAULT_INTERVAL, MAX_GAME_DURATION, MAX_TEXT_COUNT, WAIT_TIME } from '@app/constants';
import { Choice } from '@app/interfaces/choice/choice';
import { Game } from '@app/interfaces/game/game';
import { Question } from '@app/interfaces/question/question';
import { User } from '@app/interfaces/user/user';
import { AuthService } from '@app/services/authentification/auth.service';
import { DialogsService } from '@app/services/dialog/dialogs.service';
import { GameDataService } from '@app/services/games/game-data.service';
import { GamePlayService } from '@app/services/games/game-play.service';
import { SharedIdService } from '@app/services/id/shared-id.service';
import { LangueService } from '@app/services/langues/langue.service';
import { SoundService } from '@app/services/sound/sound.service';
import { ThemeService } from '@app/services/themes/theme.service';
import { TimeService } from '@app/services/timer/time.service';
import { BehaviorSubject } from 'rxjs';
import { ABANDONBUTTON, BONUSPOINT, CONFIRMBUTTON, POINTSQRL, QRLPLACEHOLDER } from './constants';

@Component({
    selector: 'app-demo-game',
    templateUrl: './demo-game.component.html',
    styleUrls: ['./demo-game.component.scss'],
})
export class DemoGameComponent implements OnInit, OnDestroy {
    @ViewChildren('answer') elements: QueryList<ElementRef<HTMLElement>>;
    currentUser: User | null;
    backgroundImage: string = '';
    questionIndex: number;
    pointQuestion: number;
    textQuestion: string;
    choice: Choice[];
    selectedChoice: boolean[] = [];
    pointJoueur: number;
    disable: boolean;
    needBonus: boolean;
    showResults: boolean;
    rightAnswer: boolean;
    needPointsQRL: boolean;
    longAnswer: string = '';
    remainingTextCount: number = MAX_TEXT_COUNT;
    abandonLabel: string = '';
    qrlPlaceholderLabel: string = '';
    confirmLabel: string = '';
    bonusLabel: string = '';
    pointsLabel: string = '';
    private timer: number;
    private game: Game;
    private timeInterval: ReturnType<typeof setInterval>;
    private choicesIndex: number;
    private question: Question;
    private questionsList: Question[];
    private router: Router = inject(Router);
    private gamePlayService: GamePlayService = inject(GamePlayService);
    private gameDataService: GameDataService = inject(GameDataService);
    private dialogs: DialogsService = inject(DialogsService);
    private readonly timeService: TimeService = inject(TimeService);
    private soundService: SoundService = inject(SoundService);
    private authentificationSerivce: AuthService = inject(AuthService);
    private themeService: ThemeService = inject(ThemeService);
    private languageService: LangueService = inject(LangueService);

    constructor() {
        this.stopTimer();
    }

    get time(): number {
        return this.timeService.time;
    }

    get isQCM(): boolean {
        return this.question.type === 'QCM';
    }

    get isQRL(): boolean {
        return this.question.type === 'QRL';
    }

    @HostListener('document:keydown', ['$event'])
    onKeydown(event: KeyboardEvent) {
        const targetElement = event.target as HTMLElement;
        if (targetElement) {
            this.gamePlayService.onKeydownNumber(event, this.selectedChoice, this.choicesIndex);
            if (targetElement.id !== 'message-input' && event.key === 'Enter' && !this.disable) {
                this.confirmAnswer();
            }
        }
    }

    async ngOnInit(): Promise<void> {
        this.currentUser = await this.authentificationSerivce.getCurrentUser();
        if (this.currentUser) {
            this.themeService.currentTheme(this.currentUser).subscribe((theme) => {
                this.backgroundImage = `url(${theme})`;
            });
            this.languageService.currentLanguage(this.currentUser).subscribe((language) => {
                this.updatedLabelLanguage(language);
            });
        }
        if (SharedIdService.id !== undefined) {
            this.gameDataService.getGameById(SharedIdService.id).subscribe((response) => {
                const dataSubject = new BehaviorSubject<Game>(response.game);
                this.game = dataSubject.getValue();
                this.initializeGame();
            });
        } else {
            this.router.navigate(['home']);
        }
        this.timeInterval = setInterval(() => {
            this.timerFinish();
        }, DEFAULT_INTERVAL);
    }

    ngOnDestroy(): void {
        clearInterval(this.timeInterval);
        SharedIdService.id = undefined;
    }

    updatedLabelLanguage(language: string): void {
        this.abandonLabel = ABANDONBUTTON[language];
        this.qrlPlaceholderLabel = QRLPLACEHOLDER[language];
        this.confirmLabel = CONFIRMBUTTON[language];
        this.bonusLabel = BONUSPOINT[language];
        this.pointsLabel = POINTSQRL[language];
    }

    onSelected(index: number): void {
        this.selectedChoice[index] = !this.selectedChoice[index];
    }

    valueChange(value: string) {
        this.remainingTextCount = MAX_TEXT_COUNT - value.length;
    }

    buttonClick(): void {
        this.soundService.buttonClick();
    }

    async openAbandonDialog(): Promise<void> {
        if (await this.dialogs.openGiveUp()) this.router.navigate(['createPlay']);
    }

    async confirmAnswer(): Promise<void> {
        if (this.isQCM && !this.gamePlayService.isConfirmAnswerSelected(this.selectedChoice, this.choicesIndex, this.timeService.time)) return;
        if (this.isQRL) {
            if (this.longAnswer.trim() === '') return;
            this.needPointsQRL = true;
            this.pointJoueur += this.question.points;
        } else {
            this.showResults = true;
            this.rightAnswer = this.gamePlayService.rightAnswer(this.selectedChoice, this.choicesIndex, this.question.choices);
            if (this.rightAnswer) {
                this.needBonus = true;
                this.pointJoueur += this.question.points * DEFAULT_BONUS;
            }
        }
        this.stopTimer();
        this.disable = true;
        await this.wait(WAIT_TIME);
        if (this.question === this.questionsList[this.questionsList.length - 1]) {
            this.router.navigate(['createPlay']);
            return;
        }
        this.questionIndex += 1;
        this.loadCurrentQuestion();
    }

    async wait(ms: number) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    private timerFinish(): void {
        if (this.time === 0 && !this.disable) this.confirmAnswer();
    }

    private startTimer(): void {
        this.timeService.startTimer(this.timer);
    }

    private stopTimer(): void {
        this.timeService.stopTimer();
    }

    private initializeGame(): void {
        this.questionIndex = 0;
        this.selectedChoice = [];
        this.pointJoueur = 0;
        this.questionsList = this.game.questions;
        if (this.game.duration) this.timer = this.game.duration;
        this.loadCurrentQuestion();
    }

    private loadCurrentQuestion(): void {
        this.showResults = false;
        this.needBonus = false;
        this.disable = false;
        this.needPointsQRL = false;
        this.longAnswer = '';
        this.remainingTextCount = MAX_TEXT_COUNT;
        this.question = this.questionsList[this.questionIndex];
        this.pointQuestion = this.question.points;
        this.textQuestion = this.question.text;
        this.choice = this.question.choices ? this.question.choices : [];
        this.choicesIndex = this.question.choices ? this.question.choices.length : 0;
        for (let i = 0; i < this.choicesIndex; i++) {
            this.selectedChoice[i] = false;
        }
        this.timer = this.isQRL ? MAX_GAME_DURATION : this.game.duration!;
        this.startTimer();
    }
}
