import { IdGeneratorService } from '@app/services/id/id-generator.service';
import { Choice } from './choice';

describe('Interface: Choice', () => {
    let service: Choice;

    beforeEach(() => {
        IdGeneratorService.resetInstance();
    });

    it('should be created an filled by default', () => {
        service = new Choice();
        expect(service).toBeTruthy();
        expect(service.id).toEqual(0);
        expect(service.text).toEqual('');
        expect(service.isCorrect).toBeFalse();
    });

    it('should be created from another choice', () => {
        const choice = new Choice({ id: 0, text: 'text', isCorrect: true });

        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        spyOn(IdGeneratorService, 'getNextChoiceId').and.returnValue(choice.id!);

        service = new Choice(choice);
        expect(service).toEqual(choice);
    });
});
