/* eslint-disable max-len */
import { Injectable } from '@angular/core';
import { MAX_GAME_DURATION, MAX_MARGIN, MAX_POINTS, MIN_GAME_DURATION, MIN_MARGIN, MIN_POINTS } from '@app/constants';
import { Choice } from '@app/interfaces/choice/choice';
import { ErrorsGame } from '@app/interfaces/errors/errors-game';
import { ErrorsQuestion } from '@app/interfaces/errors/errors-question';
import { GameDetails } from '@app/interfaces/gameDetails/game-details';
import { Question } from '@app/interfaces/question/question';

@Injectable({
    providedIn: 'root',
})
export class ValidateFormService {
    private gamesDetailsList: GameDetails[] = [new GameDetails()];
    private gameDetails: GameDetails = new GameDetails();

    set gamesList(games: GameDetails[]) {
        this.gamesDetailsList = games;
    }

    set currentGame(game: GameDetails) {
        this.gameDetails = game;
    }

    verifyTitleGame(): string {
        const verifyTitle = this.gamesDetailsList.find((i) => i.game.title.trim() === this.gameDetails.game.title.trim());
        if (!this.gameDetails.game.title.trim()) return '*Nom requis./Name required.\n';
        if (verifyTitle) {
            if (this.gameDetails.game.$schema !== this.gameDetails.game.title.replace(/\s+/g, '') + '.json') {
                return '* Ce nom existe déjà./This name already exists.\n';
            }
        }
        return '';
    }

    verifyDescriptionGame(): string {
        if (!this.gameDetails.game.description.trim()) return '* Description requise./Description required.\n';
        return '';
    }

    verifyDurationGame(): string {
        if (
            this.gameDetails.game.duration === null ||
            this.gameDetails.game.duration < MIN_GAME_DURATION ||
            this.gameDetails.game.duration > MAX_GAME_DURATION
        ) {
            return '* Durée requise/Duration required. [10-60]\n';
        }
        return '';
    }

    verifyAllQuestions(): ErrorsQuestion[] {
        const errors: ErrorsQuestion[] = [];
        for (const [i, question] of this.gameDetails.game.questions.entries()) {
            errors.push(new ErrorsQuestion());
            errors[i].textError = this.verifyQuestionValue(question);
            errors[i].pointsError = this.verifyQuestionPoints(question);
            errors[i].typeError = this.verifyQuestionType(question);
            if (this.gameDetails.game.questions[i].type === 'QCM') {
                errors[i].lengthError = this.verifyLengthGame(question);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                errors[i].choicesError = this.verifyChoiceValue(this.gameDetails.game.questions[i].choices!);
            }
        }
        return errors;
    }

    verifyAllGameInputs(verifyTitle: boolean = true): ErrorsGame {
        const errorsGame: ErrorsGame = new ErrorsGame();
        if (verifyTitle) errorsGame.titleError = this.verifyTitleGame();
        errorsGame.descriptionError = this.verifyDescriptionGame();
        errorsGame.durationError = this.verifyDurationGame();
        if (this.gameDetails.game.questions.length < 1) errorsGame.lengthError = '* Au moins une question./At least one question.\n';
        errorsGame.questionErrors = this.verifyAllQuestions();
        return errorsGame;
    }

    private verifyLengthGame(question: Question): string {
        let errors = '';
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        if (question.choices!.length < 2) errors = '* Au moins deux solutions./At least two solutions.\n';
        return errors;
    }

    private verifyQuestionValue(question: Question): string {
        if (!question.text || !question.text.trim().includes('?')) return "* Une question valide contient un '?'./A valid question contains a '?'.\n";
        return '';
    }

    private verifyQuestionPoints(question: Question): string {
        if (question.points === null) return '* Sélectionnez un nombre de points./Select a number of points.\n';
        else if (question.points < MIN_POINTS || question.points > MAX_POINTS || question.points % MIN_POINTS !== 0) {
            return '* Sélectionnez un nombre de points./Select a number of points.\n';
        }
        return '';
    }

    private verifyQuestionType(question: Question): string {
        if (!question.type) return '* Selectionnez un type de question/Select a type of question.\n';
        if (question.type === 'QCM') return this.verifyQCM(question);
        if (question.type === 'QRE') return this.verifyQRE(question);
        return '';
    }

    private verifyChoiceValue(choices: Choice[]): string {
        for (const choice of choices) {
            if (!choice.text || !choice.text.trim().length) return '* Vos solutions ne peuvent pas être vides./Your solutions cannot be empty.\n';
        }
        return '';
    }

    private verifyQCM(question: Question): string {
        let isOneChecked = false;
        let areAllChecked = true;
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        for (const choice of question.choices!) {
            if (choice.isCorrect) isOneChecked = true;
            else areAllChecked = false;
        }
        if (!isOneChecked || areAllChecked) return '* Au moins une bonne et une mauvaise solution./At least one good and one bad solution.\n';
        return '';
    }
    private verifyQRE(question: Question): string {
        const goodAnswer = question.qre?.goodAnswer;
        if (goodAnswer === undefined || isNaN(goodAnswer) || goodAnswer === null) {
            return '* Entrez une valeur comme bonne solution./Enter a value as the correct solution.\n';
        }
        if (this.verifyBound(question) !== '') return this.verifyBound(question);
        if (this.verifyMargin(question) !== '') return this.verifyMargin(question);
        return '';
    }

    private verifyBound(question: Question): string {
        const lowerBound = question.qre?.lowerBound;
        const upperBound = question.qre?.upperBound;
        const goodAnswer = question.qre?.goodAnswer;

        if (lowerBound === undefined || upperBound === undefined || lowerBound === null || upperBound === null) {
            return '* Entrez une valeur pour la borne inférieure et supérieure./Enter a value for the lower and upper bound.\n';
        }
        if (lowerBound >= upperBound) {
            return '* La borne supérieure doit être plus grande que votre borne inférieure./The upper bound must be larger than your lower bound.\n';
        }
        if (
            goodAnswer === undefined ||
            upperBound === undefined ||
            lowerBound === undefined ||
            goodAnswer <= lowerBound ||
            goodAnswer >= upperBound
        ) {
            return "* Entrez une bonne solution qui se situe exclusivement dans l'interval./Enter a correct solution that is exclusively within the range.\n";
        }
        return '';
    }

    private verifyMargin(question: Question): string {
        const toleranceMargin = question.qre?.margin;
        if (toleranceMargin === undefined || toleranceMargin === null || toleranceMargin < MIN_MARGIN || toleranceMargin > MAX_MARGIN) {
            return '* Entrez une valeur pour la marge de tolérance./Enter a value for the tolerance margin. [0%-25%]\n';
        }
        return '';
    }
}
