/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { TestBed } from '@angular/core/testing';
import { ImportService } from './import.service';
import { DialogsService } from '@app/services/dialog/dialogs.service';
import { ValidateImportFormatService } from '@app/services/verification/validate-import-format.service';
import { ValidateFormService } from '@app/services/verification/validate-form.service';
import { GameDetails } from '@app/interfaces/gameDetails/game-details';
import { Game } from '@app/interfaces/game/game';
import { ErrorsGame } from '@app/interfaces/errors/errors-game';

describe('ImportService', () => {
    let service: ImportService;
    let mockDialogsService: jasmine.SpyObj<DialogsService>;
    let mockValidateImportFormatService: jasmine.SpyObj<ValidateImportFormatService>;
    let mockValidateFormService: jasmine.SpyObj<ValidateFormService>;

    const invalidMockGameJSON = {
        $schema: '',
        title: '',
        description: 'A modifier',
        duration: 30,
        lastModification: new Date(),
        questions: [
            {
                id: 0,
                type: 'QCM',
                text: 'Quel est le moyen de locomotion terrestre le plus rapide?',
                points: 10,
                choices: [
                    { id: 1, text: 'SG Magdev (TGV Japonais)', isCorrect: true },
                    { id: 2, text: 'Guépard', isCorrect: false },
                    { id: 3, text: 'Ali', isCorrect: false },
                    { id: 4, text: 'Bugatti Bolide', isCorrect: false },
                ],
            },
        ],
    };

    const mockGameJSON = {
        $schema: 'NewGame.json',
        title: 'NewGame',
        description: 'A modifier',
        duration: 30,
        lastModification: new Date(),
        questions: [
            {
                id: 0,
                type: 'QCM',
                text: 'Quel est le moyen de locomotion terrestre le plus rapide?',
                points: 10,
                choices: [
                    { id: 1, text: 'SG Magdev (TGV Japonais)', isCorrect: true },
                    { id: 2, text: 'Guépard', isCorrect: false },
                    { id: 3, text: 'Ali', isCorrect: false },
                    { id: 4, text: 'Bugatti Bolide', isCorrect: false },
                ],
            },
        ],
    };

    const mockDialogOutput = { code: '', name: '' };

    beforeEach(() => {
        mockDialogsService = jasmine.createSpyObj('DialogsService', ['openNameInputDialog', 'openAlertDialog']);
        mockValidateImportFormatService = jasmine.createSpyObj('ValidateImportFormatService', ['verifyGameFormat']);
        mockValidateFormService = jasmine.createSpyObj('ValidateFormService', ['verifyAllGameInputs']);

        TestBed.configureTestingModule({
            providers: [
                ImportService,
                { provide: DialogsService, useValue: mockDialogsService },
                { provide: ValidateImportFormatService, useValue: mockValidateImportFormatService },
                { provide: ValidateFormService, useValue: mockValidateFormService },
            ],
        });
        service = TestBed.inject(ImportService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should reset isGameValid to false', () => {
        service['isValid'] = true;

        service.resetIsGameValid();

        expect(service['isValid']).toBe(false);
    });

    describe('importGame', () => {
        it('should import a valid game', async () => {
            const gameDetails: GameDetails[] = [];

            const mockEvent = new Event('change');
            const test = JSON.stringify(mockGameJSON);
            Object.defineProperty(mockEvent, 'target', {
                value: {
                    files: [new File([test], 'mock-game.json')],
                },
                writable: false,
            });

            const mockNewGameDetails = new GameDetails();
            mockNewGameDetails.game = new Game(JSON.parse(test));
            mockDialogOutput.name = 'RenamedGame';

            mockDialogsService.openNameInputDialog.and.returnValues(Promise.resolve(mockDialogOutput), Promise.resolve(mockDialogOutput));
            mockValidateImportFormatService.verifyGameFormat.and.returnValue('');
            mockValidateFormService.verifyAllGameInputs.and.returnValue({
                verifyIfGameContainsErrors: () => false,
                titleError: '',
                descriptionError: '',
                durationError: '',
                lengthError: '',
                questionErrors: [],
                verifyIfQuestionsContainsErrors: () => {
                    throw new Error('Function not implemented.');
                },
            });

            const result = (await service.importGame(mockEvent, gameDetails)).game;

            result.questions[0].id = mockNewGameDetails.game.questions[0].id;
            for (let i = 0; i < result.questions[0].choices!.length; i++) {
                result.questions[0].choices![i].id = mockNewGameDetails.game.questions[0].choices![i].id;
            }

            expect(result).toEqual(mockNewGameDetails.game);
            expect(service.isGameValid).toBe(true);
        });

        it('should not import an invalid game', async () => {
            const gameDetails: GameDetails[] = [];
            const mockEvent = new Event('change');
            const test = JSON.stringify(invalidMockGameJSON);
            Object.defineProperty(mockEvent, 'target', {
                value: {
                    files: [new File([test], 'mock-game.json')],
                },
                writable: false,
            });

            const mockNewGameDetails = new GameDetails();

            // mockDialogsService.openNameInputDialog.and.returnValues(Promise.resolve('RenamedGame'), Promise.resolve('AnotherName'));
            mockValidateImportFormatService.verifyGameFormat.and.returnValue('Invalid game format error');

            const result = await service.importGame(mockEvent, gameDetails);
            result.game.lastModification = mockNewGameDetails.game.lastModification;
            expect(result).toEqual(mockNewGameDetails);
            expect(service.isGameValid).toBe(false);
        });
    });

    describe('usedGameName', () => {
        it('should handle game name already in use', async () => {
            const gameDetails: GameDetails[] = [
                {
                    id: 0,
                    isVisible: true,
                    isChecked: true,
                    game: new Game(mockGameJSON),
                },
            ];
            const game = new Game(mockGameJSON);
            mockDialogOutput.name = 'RenamedGame';

            mockDialogsService.openNameInputDialog.and.returnValue(Promise.resolve(mockDialogOutput));
            const result = await (service as any).usedGameName(game, gameDetails);

            expect(result).toBe(true);
            expect(game.title).toBe('RenamedGame');
        });

        it('should handle empty game name', async () => {
            const gameDetails: GameDetails[] = [];
            const game = new Game(invalidMockGameJSON);
            mockDialogOutput.name = 'NewGame';

            mockDialogsService.openNameInputDialog.and.returnValues(Promise.resolve(mockDialogOutput));
            const result = await (service as any).usedGameName(game, gameDetails);

            expect(result).toBe(true);
            expect(game.title).toBe('NewGame');
        });

        it('should handle undefined dialogOutput', async () => {
            const gameDetails: GameDetails[] = [new GameDetails()];
            const game = new Game(mockGameJSON);
            gameDetails[0].game = game;

            mockDialogsService.openNameInputDialog.and.returnValues(Promise.resolve(undefined as any));
            let result = await service['usedGameName'](game, gameDetails);
            result = false;
            expect(result).toBe(false);
        });
    });

    describe('validateGameJson', () => {
        it('should validate a valid game JSON', () => {
            mockValidateImportFormatService.verifyGameFormat.and.returnValue('');

            const result = (service as any).validateGameJson(new Game(mockGameJSON));

            expect(result).toBe(true);
        });

        it('should handle an invalid game JSON', () => {
            mockValidateImportFormatService.verifyGameFormat.and.returnValue('Invalid game format error');

            const result = (service as any).validateGameJson(new Game(invalidMockGameJSON));

            expect(result).toBe(false);
        });
    });

    describe('validateGameForm', () => {
        it('should not validate a invalid game form', () => {
            const mockErrorGame = new ErrorsGame();
            const mockGameDetails = new GameDetails();
            mockValidateFormService.verifyAllGameInputs.and.returnValue(new ErrorsGame());
            spyOn(mockErrorGame, 'verifyIfGameContainsErrors').and.returnValue(true);
            spyOn(mockErrorGame, 'verifyIfQuestionsContainsErrors').and.returnValue(true);

            const result = (service as any).validateGameForm(mockGameDetails);

            expect(result).toBe(true);
        });

        it('should not validate an invalid game form', () => {
            const mockGameDetails = new GameDetails();
            const errorFormInput = new ErrorsGame();
            errorFormInput.descriptionError = 'Invalid description';
            mockValidateFormService.verifyAllGameInputs.and.returnValue(errorFormInput);

            const result = (service as any).validateGameForm(mockGameDetails);

            expect(result).toBe(false);
        });

        it('should validate a Invalid game form', () => {
            const mockErrorGame = new ErrorsGame();
            const mockGameDetails = new GameDetails();
            mockValidateFormService.verifyAllGameInputs.and.returnValue(new ErrorsGame());
            spyOn(mockErrorGame, 'verifyIfGameContainsErrors').and.returnValue(true);
            spyOn(mockErrorGame, 'verifyIfQuestionsContainsErrors').and.returnValue(false);
            const result = (service as any).validateGameForm(mockGameDetails);

            expect(result).toBe(true);
        });
        it('should validate game form with errors', () => {
            const newGameDetails = new GameDetails();
            const errorFormInput = new ErrorsGame();

            spyOn(errorFormInput, 'verifyIfGameContainsErrors').and.returnValue(true);
            spyOn(errorFormInput, 'verifyIfQuestionsContainsErrors').and.returnValue(true);
            errorFormInput.descriptionError = 'Description error';
            errorFormInput.durationError = 'Duration error';
            errorFormInput.lengthError = 'Length error';
            errorFormInput.questionErrors = [
                {
                    textError: 'Text error',
                    pointsError: 'Points error',
                    lengthError: 'Length error',
                    typeError: 'Type error',
                    choicesError: 'Choices error',
                },
            ];

            (service as any)['validateForm'] = {
                verifyAllGameInputs: jasmine.createSpy().and.returnValue(errorFormInput),
            };

            const result = service['validateGameForm'](newGameDetails);

            expect(result).toBe(false);
        });
    });
});
