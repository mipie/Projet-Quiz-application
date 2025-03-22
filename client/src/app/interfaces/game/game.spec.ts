import { Question } from '@app/interfaces/question/question';
import { Game } from './game';
import { IdGeneratorService } from '@app/services/id/id-generator.service';

describe('Interface: Game', () => {
    let service: Game;

    it('should be created an filled by default', () => {
        service = new Game();
        expect(service).toBeTruthy();
        expect(service.$schema).toEqual('');
        expect(service.title).toEqual('');
        expect(service.description).toEqual('');
        expect(service.duration).toEqual(null);
        expect(service.lastModification).not.toBeNull();
        expect(service.questions.length).toEqual(0);
    });

    it('should be created from another game', () => {
        IdGeneratorService.resetInstance();
        const game = new Game({
            $schema: 'title.json',
            title: 'title',
            description: 'description',
            duration: 30,
            lastModification: new Date('2023-10-01T03:46:57+00:00'),
            questions: [new Question()],
        });

        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        spyOn(IdGeneratorService, 'getNextQuestionId').and.returnValue(game.questions[0].id!);

        service = new Game(game);
        expect(service).toEqual(game);
    });
});
