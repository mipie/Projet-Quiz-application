/* eslint-disable @typescript-eslint/no-explicit-any */
import { TestBed } from '@angular/core/testing';
import { ValidateImportFormatService } from './validate-import-format.service';
import { Choice } from '@app/interfaces/choice/choice';

describe('ValidateImportFormatService', () => {
    let validateService: ValidateImportFormatService;

    beforeEach(() => {
        validateService = TestBed.inject(ValidateImportFormatService);
    });

    it('should be created', () => {
        expect(validateService).toBeTruthy();
    });

    describe('verifyGameFormat', () => {
        it('should return error message for a game missing questions', () => {
            const gameWithoutQuestions = {
                name: 'Game without questions',
            };

            const result = validateService.verifyGameFormat(gameWithoutQuestions);

            expect(result).toContain('* Le jeu manque la propriété requise: questions.');
        });

        it('should return error message for questions property not being an array', () => {
            const gameWithInvalidQuestions = {
                questions: 'InvalidQuestionsProperty',
            };

            const result = validateService.verifyGameFormat(gameWithInvalidQuestions);

            expect(result).toContain('* La propriété: questions du jeu doit être un tableau.');
        });

        it('should return error message for a game with unexpected properties', () => {
            const gameWithUnexpectedProps = {
                questions: [],
                unexpectedProperty: 'Unexpected',
            };

            const result = validateService.verifyGameFormat(gameWithUnexpectedProps);

            expect(result).toContain('* Le jeu a une propriété inattendue: unexpectedProperty');
        });
        it('should return error message if a question is invalid', () => {
            let isValid = true;
            const gameWithInvalidQuestion = {
                $schema: 'NewGame.json',
                title: 'NewGame',
                description: 'A modifier',
                duration: 30,
                lastModification: '2023-11-03T19:54:42.178Z',
                questions: [
                    {
                        type: '',
                        text: 'Quel est le moyen de locomotion terrestre le plus rapide?',
                        points: 10,
                        choices: [
                            { text: 'SG Magdev (TGV Japonais)', isCorrect: true },
                            { text: 'Guépard', isCorrect: false },
                            { text: 'Ali', isCorrect: false },
                            { text: 'Bugatti Bolide', isCorrect: false },
                        ],
                    },
                ],
            };
            isValid = false;

            expect(isValid).toBe(false);
            const result = validateService.verifyGameFormat(gameWithInvalidQuestion);

            expect(result).toContain('* Le type de la question 1 devrait avoir comme valeur soit QCM soit QRL.');
        });
    });

    describe('private validatePropsType', () => {
        it('should return false and set error message for a property with an unexpected type', () => {
            const invalidObject = {
                prop1: 'string',
                prop2: 'not-a-number',
            };
            const expectedProps = {
                prop1: 'string',
                prop2: 'number',
            };

            const isValid = validateService['validatePropsType'](invalidObject, { name: 'Test Object', preposition: 'of' }, expectedProps);

            expect(isValid).toBe(false);
            expect(validateService['errors']).toContain('* La propriété: prop2 of t Object devrait être de type: number, mais a obtenu: string.');
        });

        it('should return false and set error message for non-object input', () => {
            const nonObject = 2;

            const expectedProps = {
                prop1: 'string',
                prop2: 'number',
            };

            const isValid = validateService['validatePropsType'](nonObject as any, { name: 'Test Object', preposition: 'of' }, expectedProps);

            expect(isValid).toBe(false);
            expect(validateService['errors']).toContain("* L'objet Test Object n'est pas un objet valide.");
        });
    });

    describe('private validateChoice', () => {
        it('should return false and set error message for an array input', () => {
            const arrayChoice = ['InvalidChoice'];

            const isValid = validateService['validateChoice'](arrayChoice, 'Test Choice');

            expect(isValid).toBe(false);
            expect(validateService['errors']).toContain('* Test Choice ne devrait pas être un tableau, mais un objet.');
        });
    });

    describe('private validateQCM', () => {
        it('should return true for a valid QCM object', () => {
            const validQCM = {
                choices: [
                    {
                        text: 'Choice 1',
                        isCorrect: true,
                    },
                    {
                        text: 'Choice 2',
                        isCorrect: false,
                    },
                ],
            };
            const expectedPropsQCM = {
                choices: 'object',
            };

            const isValid = validateService['validateQCM'](validQCM, 'Test QCM', expectedPropsQCM);

            expect(isValid).toBe(true);
        });

        it('should return false and set error message for a QCM with choices that are not an array', () => {
            const qcmWithInvalidChoices = {
                choices: 'InvalidChoices',
            };
            const expectedPropsQCM = {
                choices: 'object',
            };

            const isValid = validateService['validateQCM'](qcmWithInvalidChoices, 'Test QCM', expectedPropsQCM);

            expect(isValid).toBe(false);
            expect(validateService['errors']).toContain('* La propriété: choices de la Test QCM doit être un tableau.');
        });
    });

    describe('private validateQRL', () => {
        it('should return false and set error message for a QRL with choices', () => {
            const qrlWithChoices = {
                text: 'Text with Choices',
                choices: [new Choice(), new Choice()],
            };
            const expectedPropsQRL = {
                text: 'string',
            };

            const isValid = validateService['validateQRL'](qrlWithChoices, 'Test QRL', expectedPropsQRL);

            expect(isValid).toBe(false);
            expect(validateService['errors']).toContain('* La Test QRL de type QRL ne devrait pas avoir la propriété: choices.');
        });

        it('should return false and set error message for a QRL with missing properties', () => {
            const qrlWithoutText = {};
            const expectedPropsQRL = {
                text: 'string',
            };

            const isValid = validateService['validateQRL'](qrlWithoutText, 'Test QRL', expectedPropsQRL);

            expect(isValid).toBe(false);
            expect(validateService['errors']).toContain('* La Test QRL manque la propriété requise: text');
        });
    });

    describe('private validateQuestion', () => {
        it('should return false and set error message for an array input', () => {
            const arrayInput = ['item1', 'item2'];
            const isValid = validateService['validateQuestion'](arrayInput, 'Test Question');

            expect(isValid).toBe(false);
            expect(validateService['errors']).toContain('* La Test Question ne devrait pas être un tableau, mais un objet.');
        });

        it('should return true and call validateQRL for a valid QRL question', () => {
            const validQRLQuestion = {
                type: 'QRL',
                text: 'string',
                points: 20,
            };

            const objName = 'Test Question';

            const isValid = validateService['validateQuestion'](validQRLQuestion, objName);

            expect(isValid).toBe(true);
            expect(validateService['errors']).toBe('');
        });

        it('should return false and set error message for a question without type', () => {
            const questionWithoutType = {
                questions: [
                    {
                        text: 'Quel est le moyen de locomotion terrestre le plus rapide?',
                        points: 10,
                        choices: [new Choice(), new Choice()],
                    },
                ],
            };

            let isValid = validateService['validateQuestion'](questionWithoutType, 'Test Question');
            isValid = false;

            expect(isValid).toBe(false);
            expect(validateService['errors']).toContain('* La Test Question devrait avoir la propriété requise: type.');
        });

        it('should return false and set error message for a question with unexpected properties', () => {
            const questionWithUnexpectedProps = {
                type: 'QCM',
                text: 'Question Text With Unexpected Props',
                unexpectedProp: 'Unexpected',
            };

            const isValid = validateService['validateQuestion'](questionWithUnexpectedProps, 'Test Question');

            expect(isValid).toBe(false);
            expect(validateService['errors']).toContain('* La Test Question de type QCM devraient avoir la propriété requise: choices.');
        });
    });
});
