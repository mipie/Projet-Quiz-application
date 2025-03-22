/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Choice } from '@app/interfaces/choice/choice';
import { Question } from './question';
import { IdGeneratorService } from '@app/services/id/id-generator.service';

describe('Interface: Question', () => {
    let service: Question;

    beforeEach(() => {
        IdGeneratorService.resetInstance();
    });

    it('should be created an filled by default', () => {
        service = new Question();
        expect(service).toBeTruthy();
        expect(service.id).toEqual(0);
        expect(service.text).toEqual('');
        expect(service.type).toEqual('');
        expect(service.points).toEqual(0);
        expect(service.choices!.length).toEqual(0);
    });

    it('should be created from another QCM question', () => {
        const question = new Question({
            id: 0,
            text: 'text?',
            type: 'QCM',
            points: 50,
            choices: [new Choice()],
        });

        spyOn(IdGeneratorService, 'getNextChoiceId').and.returnValue(question.choices![0].id!);
        spyOn(IdGeneratorService, 'getNextQuestionId').and.returnValue(question.id!);

        service = new Question(question);
        expect(service).toEqual(question);
    });

    it('should be created from another QRL question', () => {
        const question = new Question({
            id: 0,
            text: 'text?',
            type: 'QRL',
            points: 50,
            choices: undefined as unknown as Choice[],
        });

        spyOn(IdGeneratorService, 'getNextQuestionId').and.returnValue(question.id!);

        service = new Question(question);
        expect(service).toEqual(question);
    });
});
