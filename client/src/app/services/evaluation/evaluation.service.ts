/* eslint-disable @typescript-eslint/no-magic-numbers */
/* eslint-disable deprecation/deprecation */
import { inject, Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Evaluation, Game, User } from '@app/interfaces/user/user';
import { Observable, take } from 'rxjs';
import { GameDataService } from '../games/game-data.service';

@Injectable({
    providedIn: 'root',
})
export class EvaluationService {
    gameName: string = '';
    currentUser: User | null = null;
    games: Game[] = [];
    tab: string[] = [];
    averageRating: number = 0;
    isOrganizer: boolean = false;
    private fireStore: AngularFirestore = inject(AngularFirestore);
    private gameDataService: GameDataService = inject(GameDataService);

    async setEvaluation(currentUser: User | null): Promise<void> {
        if (currentUser) {
            const docRef = this.fireStore.collection<Evaluation>('evaluation').doc('EvaluationDoc');
            const doc = await docRef.get().toPromise();

            if (!doc?.exists) {
                await docRef.set({
                    games: [
                        {
                            gameName: this.gameName,
                            averageRating: this.averageRating,
                            uid: [],
                        },
                    ],
                });
            }
        }
    }

    getEvaluation(): Observable<Evaluation | undefined> {
        return this.fireStore.collection<Evaluation>('evaluation').doc('EvaluationDoc').valueChanges();
    }

    async changeGamesEvaluation(currentUser: User, gameEvaluated: Game): Promise<void> {
        const docRef = this.fireStore.collection<Evaluation>('evaluation').doc('EvaluationDoc');
        const doc = await docRef.get().toPromise();

        if (!doc?.exists) {
            return;
        }

        const data = doc.data();
        const games = data?.games;

        const updatedGames = games?.map((game) => {
            if (game.gameName === gameEvaluated.gameName && !game.uid.includes(currentUser.uid)) {
                return {
                    ...game,
                    averageRating: gameEvaluated.averageRating,
                    uid: [...game.uid, currentUser.uid],
                };
            }
            return game;
        });

        await docRef.update({ games: updatedGames });
    }

    async evaluateNewGameAdded(newGameName: string, oldGameName?: string): Promise<void> {
        const docRef = this.fireStore.collection<Evaluation>('evaluation').doc('EvaluationDoc');
        const doc = await docRef.get().toPromise();

        if (!doc?.exists) {
            return;
        }

        const data = doc.data();
        const allGames = data?.games;

        if (oldGameName) {
            const existingGameIndex = allGames?.findIndex((game) => game.gameName === oldGameName);
            if (allGames && existingGameIndex && existingGameIndex !== -1) {
                allGames[existingGameIndex].gameName = newGameName;
            }
        }

        const existingGame = allGames?.find((game: Game) => game.gameName === newGameName);
        if (!existingGame) {
            allGames?.push({
                gameName: newGameName,
                averageRating: 0,
                uid: [],
            });
        }

        await docRef.update({ games: allGames });
    }

    async removedGamesEvaluation(nameGameRemoved: string): Promise<void> {
        const docRef = this.fireStore.collection<Evaluation>('evaluation').doc('EvaluationDoc');
        const doc = await docRef.get().toPromise();

        if (!doc?.exists) {
            return;
        }

        const data = doc.data();
        const allGames = data?.games;

        if (allGames) {
            const updatedGames = allGames.filter((game) => game.gameName !== nameGameRemoved);
            if (updatedGames.length !== allGames.length) {
                await docRef.update({ games: updatedGames });
            }
        }
    }

    async getGamesNames(): Promise<void> {
        this.gameDataService
            .getData()
            .pipe(take(1))
            .subscribe(async (games) => {
                await this.removedGamesEvaluation('');
                for (const game of games) {
                    await this.evaluateNewGameAdded(game.game.title);
                }
            });
    }
}
