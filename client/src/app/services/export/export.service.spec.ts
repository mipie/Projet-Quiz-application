/* eslint-disable @typescript-eslint/no-explicit-any */
import { TestBed } from '@angular/core/testing';
import { Game } from '@app/interfaces/game/game';
import { GameDetails } from '@app/interfaces/gameDetails/game-details';
import { ExportService } from './export.service';

describe('ExportService', () => {
    let service: ExportService;
    const gameDetails: GameDetails = new GameDetails();

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [ExportService],
        });
        service = TestBed.inject(ExportService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should export game details as a JSON file with correct file name and use Blob and URL to create and revoke object URL for download', () => {
        const anchor = { nativeElement: document.createElement('a') };
        gameDetails.game = new Game();
        gameDetails.game.$schema = 'game.json';

        spyOn(anchor.nativeElement, 'click').and.stub();
        const revokeObjectURLSpy = spyOn(window.URL, 'revokeObjectURL');

        service.exportGame(anchor, gameDetails);

        expect(anchor.nativeElement.href).toContain('blob:');
        expect(anchor.nativeElement.download).toBe('game.json');
        expect(revokeObjectURLSpy).toHaveBeenCalled();
    });

    it('should delete the _id properties from the input object and its nested objects', () => {
        const gameData = {
            _id: '2134',
            isVisible: true,
            isChecked: true,
            game: {
                _id: '345',
                $schema: 'Jeupourlestests.json',
                title: 'Jeupourlestests',
                description: "Si le test marche, c'est magnifique.",
                duration: 30,
                lastModification: new Date('2023-09-11T20:20:39+00:00'),
                questions: [
                    {
                        _id: '123',
                        type: 'QCM',
                        text: 'Quelle est la premiÃ¨re question?',
                        points: 10,
                        choices: [
                            {
                                _id: '314',
                                text: 'Choice1',
                                isCorrect: true,
                            },
                            {
                                _id: '4093',
                                text: 'Choice2',
                                isCorrect: false,
                            },
                        ],
                    },
                    {
                        _id: '234',
                        type: 'QRL',
                        text: 'Quelle est la deuxième question?',
                        points: 10,
                        choices: [],
                    },
                ],
            },
        };
        const expectedGameData = {
            isVisible: true,
            isChecked: true,
            game: {
                $schema: 'Jeupourlestests.json',
                title: 'Jeupourlestests',
                description: "Si le test marche, c'est magnifique.",
                duration: 30,
                lastModification: new Date('2023-09-11T20:20:39+00:00'),
                questions: [
                    {
                        type: 'QCM',
                        text: 'Quelle est la premiÃ¨re question?',
                        points: 10,
                        choices: [
                            {
                                text: 'Choice1',
                                isCorrect: true,
                            },
                            {
                                text: 'Choice2',
                                isCorrect: false,
                            },
                        ],
                    },
                    {
                        type: 'QRL',
                        text: 'Quelle est la deuxième question?',
                        points: 10,
                    },
                ],
            },
        };

        const result = (service as any)['deleteMongoIds'](gameData);
        expect(result).toEqual(expectedGameData);
    });

    it('should delete the id properties from the input object and its nested objects', () => {
        const gameData = {
            id: 2,
            isVisible: true,
            isChecked: true,
            game: {
                $schema: 'Jeupourlestests.json',
                title: 'Jeupourlestests',
                description: "Si le test marche, c'est magnifique.",
                duration: 30,
                lastModification: new Date('2023-09-11T20:20:39+00:00'),
                questions: [
                    {
                        id: 1,
                        type: 'QCM',
                        text: 'Quelle est la premiÃ¨re question?',
                        points: 10,
                        choices: [
                            {
                                text: 'Choice1',
                                isCorrect: true,
                                id: 111111,
                            },
                            {
                                text: 'Choice2',
                                isCorrect: false,
                                id: 222222,
                            },
                        ],
                    },
                ],
            },
        };
        const expectedGameData = {
            isVisible: true,
            isChecked: true,
            game: {
                $schema: 'Jeupourlestests.json',
                title: 'Jeupourlestests',
                description: "Si le test marche, c'est magnifique.",
                duration: 30,
                lastModification: new Date('2023-09-11T20:20:39+00:00'),
                questions: [
                    {
                        type: 'QCM',
                        text: 'Quelle est la premiÃ¨re question?',
                        points: 10,
                        choices: [
                            {
                                text: 'Choice1',
                                isCorrect: true,
                            },
                            {
                                text: 'Choice2',
                                isCorrect: false,
                            },
                        ],
                    },
                ],
            },
        };

        const result = (service as any)['deleteIds'](gameData);
        expect(result).toEqual(expectedGameData);
    });
});
