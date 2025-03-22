import { ErrorsQuestion } from './errors-question';

describe('Interface: ErrorsQuestion', () => {
    let service: ErrorsQuestion;

    beforeEach(() => {
        service = new ErrorsQuestion();
    });

    it('should create an instance', () => {
        expect(service).toBeTruthy();
    });
});
