/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Component, ElementRef, OnDestroy, OnInit, QueryList, ViewChild, ViewChildren, inject } from '@angular/core';
import { Router } from '@angular/router';
import { QuestionFormComponent } from '@app/components/question-form/question-form.component';
import { NEW_ID, TO_ADMIN, TO_HOME } from '@app/constants';
import { Choice } from '@app/interfaces/choice/choice';
import { Game } from '@app/interfaces/game/game';
import { GameDetails } from '@app/interfaces/gameDetails/game-details';
import { Question } from '@app/interfaces/question/question';
import { User } from '@app/interfaces/user/user';
import { AuthService } from '@app/services/authentification/auth.service';
import { DialogsService } from '@app/services/dialog/dialogs.service';
import { ExportService } from '@app/services/export/export.service';
import { GameDataService } from '@app/services/games/game-data.service';
import { IdGeneratorService } from '@app/services/id/id-generator.service';
import { SharedIdService } from '@app/services/id/shared-id.service';
import { ImageService } from '@app/services/Image/image.service';
import { LangueService } from '@app/services/langues/langue.service';
import { SoundService } from '@app/services/sound/sound.service';
import { ThemeService } from '@app/services/themes/theme.service';
import { ValidateFormService } from '@app/services/verification/validate-form.service';
import { lastValueFrom } from 'rxjs';
import { CANCEL, DESCRIPTION, DURATION, DURATIONHELP, NAME, QUESTIONHELP, SAVE, TITLE } from './constants';
import { EvaluationService } from '@app/services/evaluation/evaluation.service';

@Component({
    selector: 'app-create-game',
    templateUrl: './create-game.component.html',
    styleUrls: ['./create-game.component.scss'],
})
export class CreateGameComponent implements OnInit, OnDestroy {
    @ViewChild(QuestionFormComponent) childComponent: QuestionFormComponent;
    @ViewChildren('requiredInput') requiredInputList: QueryList<ElementRef>;
    gameDetails: GameDetails;
    errorMessageTitle: string | null = '';
    errorMessageDescription: string | null = '';
    errorMessageDuration: string | null = '';
    currentUser: User | null;
    backgroundImage: string = '';
    titleLabel: string = '';
    nameLabel: string = '';
    descriptionLabel: string = '';
    durationLabel: string = '';
    durationHelpLabel: string = '';
    questionHelpLabel: string = '';
    saveLabel: string = '';
    cancelLabel: string = '';
    language: string = '';
    private allGames: GameDetails[] = [];
    private currentGameId: number | undefined = SharedIdService.id;
    private areQuestionsValid: boolean = false;
    private router: Router = inject(Router);
    private dialogs: DialogsService = inject(DialogsService);
    private soundService: SoundService = inject(SoundService);
    private exportService: ExportService = inject(ExportService);
    private gameDataService: GameDataService = inject(GameDataService);
    private validationService: ValidateFormService = inject(ValidateFormService);
    private imageService: ImageService = inject(ImageService);
    private authentificationService: AuthService = inject(AuthService);
    private themeService: ThemeService = inject(ThemeService);
    private languageService: LangueService = inject(LangueService);
    private evaluationService: EvaluationService = inject(EvaluationService);

    async ngOnInit(): Promise<void> {
        this.currentUser = await this.authentificationService.getCurrentUser();
        if (this.currentUser) {
            this.themeService.currentTheme(this.currentUser).subscribe((theme) => {
                this.backgroundImage = `url(${theme})`;
            });
            this.languageService.currentLanguage(this.currentUser).subscribe((language) => {
                this.language = language;
                this.updatedLabelLanguage(language);
            });
        }
        this.gameDataService.getData().subscribe((games) => {
            this.allGames = games;
            IdGeneratorService.initialize(games);
        });
        this.gameDataService.getGameById(Number(this.currentGameId)).subscribe((game) => {
            if (this.currentGameId === NEW_ID) {
                this.loadNewGame();
            } else if (this.currentGameId !== undefined) {
                this.loadCurrentGame(game);
            } else {
                this.router.navigate([TO_HOME]);
            }
        });
    }

    updatedLabelLanguage(language: string): void {
        this.titleLabel = TITLE[language];
        this.nameLabel = NAME[language];
        this.descriptionLabel = DESCRIPTION[language];
        this.durationLabel = DURATION[language];
        this.durationHelpLabel = DURATIONHELP[language];
        this.questionHelpLabel = QUESTIONHELP[language];
        this.saveLabel = SAVE[language];
        this.cancelLabel = CANCEL[language];
    }

    changeFocus(event: Event, element: HTMLElement) {
        event.preventDefault();
        const index = this.requiredInputList.toArray().findIndex((input) => input.nativeElement === element);
        if (index !== this.requiredInputList.toArray().length - 1) {
            this.requiredInputList.toArray()[index + 1].nativeElement.focus();
            return;
        }
        this.childComponent.requiredInputList.toArray()[0].nativeElement.focus();
    }

    loadNewGame(): void {
        this.gameDetails = new GameDetails();
        this.gameDetails.game = new Game();
        this.gameDetails.game.questions = [new Question()];
        this.gameDetails.game.questions[0].choices![0] = new Choice();
        this.gameDetails.game.questions[0].choices![1] = new Choice();
        this.gameDetails.id = IdGeneratorService.getNextGameId();
    }

    loadCurrentGame(gameData: GameDetails): void {
        if (gameData !== undefined) this.gameDetails = gameData;
    }

    ngOnDestroy(): void {
        SharedIdService.id = undefined;
    }

    verifyGameInput(): boolean {
        this.validationService.gamesList = this.allGames;
        this.validationService.currentGame = this.gameDetails;
        this.errorMessageTitle = this.validationService.verifyTitleGame();
        this.errorMessageDescription = this.validationService.verifyDescriptionGame();
        this.errorMessageDuration = this.validationService.verifyDurationGame();
        this.childComponent.sendAreQuestionsValid();
        const isGameValid = !this.errorMessageTitle && !this.errorMessageDescription && !this.errorMessageDuration && this.areQuestionsValid;
        return isGameValid;
    }

    async saveDataGame(): Promise<void> {
        this.clickedButton();
        if (!this.verifyGameInput()) return;
        this.gameDetails.game.lastModification = new Date();
        this.gameDetails.game.$schema = this.gameDetails.game.title.replace(/\s+/g, '') + '.json';
        await this.uploadQuestionImages();

        const gameData = await lastValueFrom(this.gameDataService.getGameById(this.gameDetails.id));

        if (gameData !== null) {
            await lastValueFrom(this.gameDataService.modifyGame(this.gameDetails));
            await this.evaluationService.evaluateNewGameAdded(this.gameDetails.game.title, this.evaluationService.gameName);
        } else {
            const game = this.exportService.deleteMongoIds(this.gameDetails);
            await lastValueFrom(this.gameDataService.addGame(game));
            await this.evaluationService.evaluateNewGameAdded(game.game.title);
        }
        this.router.navigate([TO_ADMIN]);
        this.ngOnInit();
    }

    async uploadQuestionImages(): Promise<void> {
        const uploadPromises = this.gameDetails.game.questions.map(async (question) => {
            if (question.imageFiles !== undefined) {
                const imageFile = await this.imageService.compressImage(question.imageFiles);
                return await this.imageService.uploadImage(imageFile).then((imageUrl) => {
                    question.imageUrl![0] = imageUrl;
                });
            }
            return Promise.resolve();
        });
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        return Promise.all(uploadPromises).then(() => {});
    }

    validateQuestions($event: boolean) {
        this.areQuestionsValid = $event;
    }

    cancel(): void {
        this.clickedButton();
        if (this.language === 'fra') {
            this.dialogs.openRedirectionDialog('Voulez-vous vraiment annuler? Vos modifications seront perdues.', './admin');
        } else {
            this.dialogs.openRedirectionDialog('Do you really want to cancel? Your changes will be lost.', './admin');
        }
    }

    clickedButton(): void {
        this.soundService.buttonClick();
    }
}
