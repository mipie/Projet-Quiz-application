import { TestBed } from '@angular/core/testing';
import { ValidateFormService } from './validate-form.service';
import { GameDetails } from '@app/interfaces/gameDetails/game-details';
import { Choice } from '@app/interfaces/choice/choice';
import { Question } from '@app/interfaces/question/question';

describe('ValidateFormService', () => {
    let validateService: ValidateFormService;

    beforeEach(() => {
        validateService = TestBed.inject(ValidateFormService);
    });

    it('should be created', () => {
        expect(validateService).toBeTruthy();
    });

    describe('verifyTitleGame', () => {
        it('should return an error message for a missing title', () => {
            validateService.currentGame = {
                id: 0,
                isVisible: true,
                isChecked: true,
                game: {
                    title: '',
                    $schema: '',
                    description: '',
                    duration: null,
                    lastModification: new Date(),
                    questions: [],
                },
            };
            const errorMessage = validateService.verifyTitleGame();
            expect(errorMessage).toContain('* Le nom du jeu est requis.');
        });

        it('should return an error message for a duplicate title with different schema', () => {
            const existingGameDetails = new GameDetails();
            existingGameDetails.game.title = 'Sample Game Title';
            existingGameDetails.game.$schema = 'sample.json';
            validateService['gamesDetailsList'] = [existingGameDetails];

            validateService.currentGame = {
                id: 0,
                isVisible: true,
                isChecked: true,
                game: {
                    title: 'Sample Game Title',
                    $schema: 'sample2.json',
                    description: '',
                    duration: null,
                    lastModification: new Date(),
                    questions: [],
                },
            };

            const errorMessage = validateService.verifyTitleGame();
            expect(errorMessage).toContain('* Ce nom de jeu existe déjà. Veuillez choisir un autre.');
        });
    });

    describe('VerifyDurationGame', () => {
        it('should return an error message for an invalid game duration', () => {
            validateService.currentGame = {
                id: 0,
                isVisible: false,
                isChecked: false,
                game: {
                    title: 'Sample Game Title',
                    $schema: 'sample2.json',
                    description: '',
                    duration: 5,
                    lastModification: new Date(),
                    questions: [],
                },
            };

            const errorMessage = validateService.verifyDurationGame();
            expect(errorMessage).toContain('* La durée du jeu est requise, veuillez saisir un nombre entre 10 et 60.');
        });
    });

    describe('VerifyAllQuestions', () => {
        it('should return an array of ErrorsQuestion with errors for invalid questions', () => {
            validateService.currentGame = {
                id: 0,
                isVisible: false,
                isChecked: false,
                game: {
                    questions: [
                        {
                            id: 0,
                            text: 'Invalid Question 1',
                            points: 5,
                            type: 'QCM',
                            choices: [new Choice()],
                        },
                        {
                            id: 1,
                            text: '',
                            points: 20,
                            type: 'QCM',
                            choices: [],
                        },
                    ],
                    $schema: '',
                    title: '',
                    description: '',
                    duration: null,
                    lastModification: new Date(),
                },
            };

            const errors = validateService.verifyAllQuestions();

            expect(errors.length).toBe(2);

            expect(errors[0].textError).toContain("* Veuillez entrer une question valide, qui contient un '?'.");
            expect(errors[0].pointsError).toContain('* Veuillez choisir un nombre de points valide : un multiple de 10 entre 10 et 100.');
            expect(errors[0].typeError).toContain('* Il vous faut au moins une bonne et une mauvaise réponse par question.');
            expect(errors[0].lengthError).toContain('* Veuillez entrer au moins deux choix.');
            expect(errors[0].choicesError).toContain('* Vos choix ne peuvent pas être vides.');
        });
    });
    describe('verifyDescriptionGame', () => {
        it('should return an error message for a missing description', () => {
            validateService.currentGame = {
                id: 0,
                isVisible: true,
                isChecked: true,
                game: {
                    title: 'Sample Game Title',
                    $schema: 'sample2.json',
                    description: '',
                    duration: null,
                    lastModification: new Date(),
                    questions: [],
                },
            };
            const errorMessage = validateService.verifyDescriptionGame();
            expect(errorMessage).toContain('* La description du jeu est requise.');
        });
    });

    describe('verifyAllGameInputs', () => {
        it('should verify all game inputs and return ErrorsGame', () => {
            validateService.currentGame = {
                id: 0,
                isChecked: false,
                isVisible: false,
                game: {
                    title: 'Sample Game Title',
                    $schema: 'sample2.json',
                    description: 'Sample Game Description',
                    duration: 30,
                    lastModification: new Date(),
                    questions: [
                        {
                            id: 0,
                            text: 'Sample Question 1?',
                            points: 20,
                            type: 'QCM',
                            choices: [
                                { id: 0, text: 'Choice 1', isCorrect: true },
                                { id: 1, text: 'Choice 2', isCorrect: false },
                            ],
                        },
                    ],
                },
            };

            const errorsGame = validateService.verifyAllGameInputs();
            expect(errorsGame.titleError).toBe('');
            expect(errorsGame.descriptionError).toBe('');
            expect(errorsGame.durationError).toBe('');
            expect(errorsGame.lengthError).toBe('');
        });

        it('should verify all game inputs and return ErrorsGame', () => {
            validateService.currentGame = {
                id: 0,
                isChecked: false,
                isVisible: false,
                game: {
                    title: 'Sample Game Title',
                    $schema: 'sample2.json',
                    description: 'Sample Game Description',
                    duration: 30,
                    lastModification: new Date(),
                    questions: [],
                },
            };

            const errorsGame = validateService.verifyAllGameInputs();
            expect(errorsGame.lengthError).toContain('* Le jeu doit contenir au moins une question.');
        });
    });

    describe('verifyQuestionPoints', () => {
        it('should return an error message for a question with null points', () => {
            const questionWithNullPoints: Question = {
                text: 'Sample Question',
                points: null as unknown as number,
                type: 'QCM',
                choices: [],
                id: 0,
            };

            const errorMessage = validateService['verifyQuestionPoints'](questionWithNullPoints);

            expect(errorMessage).toContain('* Veuillez choisir un nombre de points.');
        });
    });

    describe('verifyQuestionType', () => {
        it('should return an error message for a question with a missing type', () => {
            const questionWithMissingType: Question = {
                text: 'Sample Question',
                points: 20,
                type: '',
                choices: [],
                id: 0,
            };

            const errorMessage = validateService['verifyQuestionType'](questionWithMissingType);

            expect(errorMessage).toContain('* Veuillez choisir un type de question.');
        });

        it('should return an empty string when question type is valid', () => {
            const validQuestion: Question = {
                text: 'Sample Question ?',
                points: 20,
                type: 'QRL',
                choices: [
                    { id: 0, text: 'Choice 1', isCorrect: true },
                    { id: 1, text: 'Choice 2', isCorrect: false },
                ],
                id: 0,
            };

            const errorMessage = validateService['verifyQuestionType'](validQuestion);

            expect(errorMessage).toBe('');
        });
    });
});
