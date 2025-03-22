import { ErrorsQuestion } from './errors-question';

export class ErrorsGame {
    titleError: string;
    descriptionError: string;
    durationError: string;
    lengthError: string;
    questionErrors: ErrorsQuestion[];

    constructor() {
        this.titleError = '';
        this.descriptionError = '';
        this.durationError = '';
        this.lengthError = '';
        this.questionErrors = [];
    }

    verifyIfGameContainsErrors(): boolean {
        const errors = Boolean(this.titleError || this.descriptionError || this.durationError || this.lengthError);
        const errorsQuestion: boolean = this.verifyIfQuestionsContainsErrors();
        return Boolean(errors || errorsQuestion);
    }

    verifyIfQuestionsContainsErrors(): boolean {
        let errorsQuestion = false;
        for (const questionError of this.questionErrors) {
            errorsQuestion ||= Boolean(
                questionError.textError ||
                    questionError.typeError ||
                    questionError.pointsError ||
                    questionError.choicesError ||
                    questionError.lengthError,
            );
        }
        return errorsQuestion;
    }
}
