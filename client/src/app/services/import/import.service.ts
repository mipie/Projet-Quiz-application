import { Injectable, inject } from '@angular/core';
import { ErrorsGame } from '@app/interfaces/errors/errors-game';
import { Game } from '@app/interfaces/game/game';
import { GameDetails } from '@app/interfaces/gameDetails/game-details';
import { DialogsService } from '@app/services/dialog/dialogs.service';
import { IdGeneratorService } from '@app/services/id/id-generator.service';
import { ValidateFormService } from '@app/services/verification/validate-form.service';
import { ValidateImportFormatService } from '@app/services/verification/validate-import-format.service';

@Injectable({
    providedIn: 'root',
})
export class ImportService {
    private dialogsService: DialogsService = inject(DialogsService);
    private validateImportFormat: ValidateImportFormatService = inject(ValidateImportFormatService);
    private validateForm: ValidateFormService = inject(ValidateFormService);
    private isValid: boolean = false;

    get isGameValid(): boolean {
        return this.isValid;
    }
    resetIsGameValid(): void {
        this.isValid = false;
    }

    async importGame(event: Event, gameDetails: GameDetails[]): Promise<GameDetails> {
        const target = event.target as HTMLInputElement;
        const file = target.files?.[0];
        const fileContent = await file?.text();
        const newGame = JSON.parse(fileContent as string);
        const newGameDetails: GameDetails = new GameDetails();

        if (this.validateGameJson(newGame) && (await this.usedGameName(newGame, gameDetails))) {
            newGameDetails.id = IdGeneratorService.getNextGameId();
            newGameDetails.game = new Game(newGame);
            if (this.validateGameForm(newGameDetails)) this.isValid = true;
        }
        return newGameDetails;
    }

    private async usedGameName(game: Game, games: GameDetails[]): Promise<boolean> {
        let dialogOutput: { code: string; name: string };
        while (!game.title.trim() || games.find((each) => game.title.trim().toLowerCase() === each.game.title.trim().toLowerCase())) {
            if (!game.title.trim()) {
                dialogOutput = await this.dialogsService.openNameInputDialog(
                    'Le nom du jeu ne peut pas être vide, veuillez entrer un nouveau nom:',
                    'Ex.: KAM? PAM!',
                    'Renommer!',
                );
            } else {
                dialogOutput = await this.dialogsService.openNameInputDialog(
                    'Ce nom de jeu est déjà utilisé, veuillez entrer un nouveau nom:',
                    'Ex.: KAM? PAM!',
                    'Renommer!',
                );
            }
            if (dialogOutput === undefined) return false;
            game.title = dialogOutput['name'];
        }
        game.$schema = game.title.replace(/\s+/g, '') + '.json';
        return true;
    }

    private validateGameJson(newGameDetails: Game): boolean {
        const errors: string = this.validateImportFormat.verifyGameFormat(newGameDetails);
        if (errors.length > 1) {
            this.dialogsService.openAlertDialog(
                "************************************************************\
                        <br>Erreur lors de l'importation:<br><br>\
                 ************************************************************<br>" + errors.replace(/\n/g, '<br><br>'),
            );
            return false;
        }

        return true;
    }

    private validateGameForm(newGameDetails: GameDetails): boolean {
        let errors = '';
        this.validateForm.currentGame = newGameDetails;
        const errorFormInput: ErrorsGame = this.validateForm.verifyAllGameInputs(false);
        if (errorFormInput.verifyIfGameContainsErrors()) {
            errors = errorFormInput.descriptionError + errorFormInput.durationError + errorFormInput.lengthError;
            for (let i = 0; i < errorFormInput.questionErrors.length; i++) {
                if (errorFormInput.verifyIfQuestionsContainsErrors()) {
                    errors += `*********** Pour la question ${i + 1}: ***********\n`;
                    errors +=
                        errorFormInput.questionErrors[i].textError +
                        errorFormInput.questionErrors[i].pointsError +
                        errorFormInput.questionErrors[i].lengthError +
                        errorFormInput.questionErrors[i].typeError +
                        errorFormInput.questionErrors[i].choicesError +
                        '************************************************************<br>';
                }
            }
            this.dialogsService.openAlertDialog(
                "************************************************************\
                     <br>Le jeu n'est pas valide:<br><br>\
                ************************************************************<br>" + errors.replace(/\n/g, '<br><br>'),
            );
            return false;
        }
        return true;
    }
}
