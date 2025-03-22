import { ErrorsQuestion } from './errors-question';
import { ErrorsGame } from './errors-game';

describe('Interface: ErrorsGame', () => {
    let service: ErrorsGame;
    let mockQuestionError: ErrorsQuestion;

    beforeEach(() => {
        service = new ErrorsGame();
        mockQuestionError = {
            textError: '',
            typeError: '',
            pointsError: '',
            choicesError: '',
            lengthError: '',
        };
    });

    it('should create an instance', () => {
        expect(service).toBeTruthy();
    });

    it('should initially have no errors', () => {
        expect(service.verifyIfGameContainsErrors()).toBeFalse();
    });

    it('should report error if titleError is set', () => {
        service.titleError = 'Title is required';
        expect(service.verifyIfGameContainsErrors()).toBeTrue();
    });

    it('should report no question errors if questionErrors array is empty', () => {
        expect(service.verifyIfQuestionsContainsErrors()).toBeFalse();
    });

    it('should report question errors if any question has errors', () => {
        mockQuestionError.textError = 'Question text is required';
        service.questionErrors.push(mockQuestionError);
        expect(service.verifyIfQuestionsContainsErrors()).toBeTrue();
    });

    it('should return false when there are no errors in questions', () => {
        service.questionErrors.push(new ErrorsQuestion());
        expect(service.verifyIfQuestionsContainsErrors()).toBeFalse();
    });

    it('should return true when there is a textError in any question', () => {
        service.questionErrors.push(new ErrorsQuestion());
        service.questionErrors[0].textError = 'Error in question text';
        expect(service.verifyIfQuestionsContainsErrors()).toBeTrue();
    });
});
