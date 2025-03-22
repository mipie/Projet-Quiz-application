import { Inject, Injectable } from '@angular/core';
import { GameDetails } from '@app/interfaces/gameDetails/game-details';

@Injectable({
    providedIn: 'root',
})
export class IdGeneratorService {
    private static instance: IdGeneratorService | undefined;
    private static gameId: number;
    private static questionId: number;
    private static choiceId: number;

    private constructor(@Inject(Number) @Inject('startId') public startId: number) {
        IdGeneratorService.gameId = startId;
        IdGeneratorService.questionId = -1;
        IdGeneratorService.choiceId = -1;
    }

    static get instanceSingleton(): IdGeneratorService | undefined {
        return IdGeneratorService.instance;
    }

    static get gameIdSingleton(): number {
        return IdGeneratorService.gameId;
    }

    static get questionIdSingleton(): number {
        return IdGeneratorService.questionId;
    }

    static get choiceIdSingleton(): number {
        return IdGeneratorService.choiceId;
    }

    static resetInstance(): void {
        IdGeneratorService.instance = undefined;
    }

    static initialize(games?: GameDetails[]): void {
        if (!IdGeneratorService.instance) {
            if (games === undefined) {
                IdGeneratorService.instance = new IdGeneratorService(0);
            } else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                IdGeneratorService.instance = new IdGeneratorService(games[games.length - 1].id!);
            }
        }
    }

    static getNextGameId(): number {
        IdGeneratorService.gameId += 1;
        return IdGeneratorService.gameId;
    }

    static getNextQuestionId(): number {
        IdGeneratorService.questionId += 1;
        return IdGeneratorService.questionId;
    }

    static getNextChoiceId(): number {
        IdGeneratorService.choiceId += 1;
        return IdGeneratorService.choiceId;
    }
}
