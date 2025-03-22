import { TestBed } from '@angular/core/testing';
import { IdGeneratorService } from './id-generator.service';
import { NEW_ID } from '@app/constants';

describe('Service: IdGenerator', () => {
    let service: IdGeneratorService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [IdGeneratorService, { provide: 'startId', useValue: 1 }],
        });
        service = TestBed.inject(IdGeneratorService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should reset instance', () => {
        IdGeneratorService.resetInstance();
        expect(IdGeneratorService.instanceSingleton).toBeUndefined();
    });

    it('should initialize idGenerator singleton from nothing', () => {
        IdGeneratorService.resetInstance();
        IdGeneratorService.initialize();
        expect(IdGeneratorService.instanceSingleton).toBeTruthy();
        expect(IdGeneratorService.gameIdSingleton).toEqual(0);
        expect(IdGeneratorService.questionIdSingleton).toEqual(NEW_ID);
        expect(IdGeneratorService.choiceIdSingleton).toEqual(NEW_ID);
    });

    it('should initialize idGenerator singleton from games list', () => {
        IdGeneratorService.resetInstance();
        const games = [
            {
                id: 1,
                isVisible: true,
                isChecked: false,
                game: {
                    $schema: 'Game1.json',
                    title: 'Game1',
                    description: "Si le test marche, c'est magnifique.",
                    duration: 30,
                    lastModification: new Date('2023-09-11T20:20:39+00:00'),
                    questions: [
                        {
                            type: 'QCM',
                            text: 'Quelle est la première question?',
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
                            id: 1,
                        },
                    ],
                },
            },
        ];
        IdGeneratorService.initialize(games);
        expect(IdGeneratorService.instanceSingleton).toBeTruthy();
        expect(IdGeneratorService.gameIdSingleton).toEqual(1);
    });

    it('should return game id plus one', () => {
        expect(IdGeneratorService.gameIdSingleton).toEqual(1);
        IdGeneratorService.getNextGameId();
        expect(IdGeneratorService.gameIdSingleton).toEqual(2);
    });

    it('should return question id plus one', () => {
        expect(IdGeneratorService.questionIdSingleton).toEqual(NEW_ID);
        IdGeneratorService.getNextQuestionId();
        expect(IdGeneratorService.questionIdSingleton).toEqual(0);
    });

    it('should return choice id plus one', () => {
        expect(IdGeneratorService.choiceIdSingleton).toEqual(NEW_ID);
        IdGeneratorService.getNextChoiceId();
        expect(IdGeneratorService.choiceIdSingleton).toEqual(0);
    });
});
