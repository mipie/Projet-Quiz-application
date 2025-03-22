/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable max-len */
/* eslint-disable unicorn/prefer-switch */
import { Injectable } from '@angular/core';
import { CHOICES_PROPERTIES, GAMES_PROPERTIES, QUESTION_PROPERTIES } from '@app/constants';

@Injectable({
    providedIn: 'root',
})
export class ValidateImportFormatService {
    private errors: string = '';

    verifyGameFormat(obj: object): string {
        this.errors = '';

        if (!('questions' in obj)) {
            this.errors += '* Le jeu manque la propriété requise: questions.';
            return this.errors;
        }

        if (!Array.isArray(obj.questions)) {
            this.errors += '* La propriété: questions du jeu doit être un tableau.';
            return this.errors;
        }

        if (!this.validateObject(obj, { name: 'Le jeu', preposition: 'du' }, GAMES_PROPERTIES)) return this.errors;

        for (let i = 0; i < obj.questions.length; i++) {
            this.validateQuestion(obj.questions[i], `question ${i + 1}`);
        }

        return this.errors;
    }

    private validateObject(obj: object, objInfo: { name: string; preposition: string }, expectedProps: Record<string, string>): boolean {
        if (this.hasUnwantedProps(obj, objInfo.name, expectedProps)) return false;
        if (this.hasMissingProps(obj, objInfo.name, expectedProps)) return false;
        return this.validatePropsType(obj, objInfo, expectedProps);
    }

    private hasUnwantedProps(obj: object, objName: string, expectedProps: Record<string, string>): boolean {
        let hasUnwanted = false;
        const actualProps = Object.keys(obj);
        for (const prop of actualProps) {
            if (!(prop in expectedProps)) {
                this.errors += `* ${objName} a une propriété inattendue: ${prop}\n`;
                hasUnwanted = true;
            }
        }
        return hasUnwanted;
    }

    private hasMissingProps(obj: object, objName: string, expectedProps: Record<string, string>): boolean {
        let hasMissing = false;
        for (const expectedProp of Object.keys(expectedProps)) {
            if (!(expectedProp in obj)) {
                this.errors += `* ${objName} manque la propriété requise: ${expectedProp}\n`;
                hasMissing = true;
            }
        }
        return hasMissing;
    }

    private validatePropsType(obj: object, objInfo: { name: string; preposition: string }, expectedProps: Record<string, string>): boolean {
        let isValid = true;
        if (typeof obj === 'object' && obj !== null) {
            for (const [expectedProp, expectedType] of Object.entries(expectedProps)) {
                const actualType = typeof (obj as Record<string, unknown>)[expectedProp];

                if (expectedProp === 'imageUrl') {
                    const actualValue = (obj as Record<string, unknown>)[expectedProp];
                    if (!Array.isArray(actualValue)) {
                        isValid = false;
                        this.errors += `* La propriété: ${expectedProp} ${objInfo.preposition} ${objInfo.name.slice(
                            3,
                        )} devrait être un tableau, mais a obtenu: ${actualType}.\n`;
                    }
                } else if (actualType !== expectedType) {
                    isValid = false;
                    this.errors += `* La propriété: ${expectedProp} ${objInfo.preposition} ${objInfo.name.slice(3)}`;
                    this.errors += ` devrait être de type: ${expectedType}, mais a obtenu: ${actualType}.\n`;
                }
            }
        } else {
            this.errors += `* L'objet ${objInfo.name} n'est pas un objet valide.\n`;
            isValid = false;
        }
        return isValid;
    }

    private validateChoice(obj: object, objName: string): boolean {
        if (Array.isArray(obj)) {
            this.errors += `* ${objName} ne devrait pas être un tableau, mais un objet.`;
            return false;
        }

        return this.validateObject(obj, { name: objName, preposition: 'du' }, CHOICES_PROPERTIES);
    }

    private validateQCM(obj: object, objName: string, expectedPropsQCM: Record<string, string>): boolean {
        if (!('choices' in obj)) {
            this.errors += `* La ${objName} de type QCM devraient avoir la propriété requise: choices.\n`;
            return false;
        }

        let isValid = true;
        if (Array.isArray(obj.choices)) {
            for (let i = 0; i < obj.choices.length; i++) {
                isValid &&= this.validateChoice(obj.choices[i], `Le Choix ${i + 1} de la ${objName}`);
            }
        } else {
            this.errors += `* La propriété: choices de la ${objName} doit être un tableau.`;
            return false;
        }

        expectedPropsQCM.choices = 'object';
        isValid &&= this.validateObject(obj, { name: `La ${objName}`, preposition: 'de la' }, expectedPropsQCM);
        delete expectedPropsQCM.choices;

        return isValid;
    }

    private validateQRL(obj: object, objName: string, expectedPropsQRL: Record<string, string>): boolean {
        if ('choices' in obj) {
            this.errors += `* La ${objName} de type QRL ne devrait pas avoir la propriété: choices.\n`;
            return false;
        }

        if (!this.validateObject(obj, { name: `La ${objName}`, preposition: 'de la' }, expectedPropsQRL)) return false;
        return true;
    }

    private validateQRE(obj: any, objName: string): boolean {
        if ('choices' in obj) {
            this.errors += `* La ${objName} de type QRE ne devrait pas avoir la propriété: choices.\n`;
            return false;
        }

        if (!('qre' in obj)) {
            this.errors += `* La ${objName} de type QRE doit contenir la propriété 'qre'.\n`;
            return false;
        }

        const qre = (obj as any).qre;
        const requiredQREProps = ['lowerBound', 'goodAnswer', 'margin', 'upperBound'];
        for (const prop of requiredQREProps) {
            if (!(prop in qre)) {
                this.errors += `* La propriété ${prop} est requise dans qre pour la ${objName}.\n`;
                return false;
            }
        }
        const qrePropsTypes = {
            lowerBound: 'number',
            goodAnswer: 'number',
            margin: 'number',
            upperBound: 'number',
        };
        for (const [prop, expectedType] of Object.entries(qrePropsTypes)) {
            const actualType = typeof qre[prop];
            if (actualType !== expectedType) {
                this.errors += `* La propriété ${prop} dans qre de la ${objName} devrait être de type ${expectedType}, mais a obtenu ${actualType}.\n`;
                return false;
            }
        }

        return true;
    }

    private validateQuestion(obj: any, objName: string): boolean {
        if (Array.isArray(obj)) {
            this.errors += `* La ${objName} ne devrait pas être un tableau, mais un objet.`;
            return false;
        }

        if (obj.type === 'QCM') {
            return this.validateQCM(obj, objName, QUESTION_PROPERTIES);
        } else if (obj.type === 'QRL') {
            return this.validateQRL(obj, objName, QUESTION_PROPERTIES);
        } else if (obj.type === 'QRE') {
            return this.validateQRE(obj, objName);
        } else {
            this.errors += `* Le type de la ${objName} devrait avoir comme valeur soit QCM soit QRL ou QRE.\n`;
            return false;
        }
    }
}
