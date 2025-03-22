/* eslint-disable max-params */
/* eslint-disable deprecation/deprecation */
import { inject, Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Timestamp } from '@angular/fire/firestore';
import { Player } from '@app/interfaces/player/player';
import { GamesHistoric, Statistics, User } from '@app/interfaces/user/user';
import { CurrentGameService } from '@app/services/room-game/current-game.service';
import { map, Observable } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class StatisticsService {
    private fireStore: AngularFirestore = inject(AngularFirestore);
    private currentGameService: CurrentGameService = inject(CurrentGameService);

    async updateStatistics(players: Player[], name: string, timePlayed: number): Promise<void> {
        const remainingPlayers = players.filter((player) => !player.isSurrender);
        remainingPlayers.sort((a, b) => b.score - a.score);

        const maxScore = remainingPlayers[0].score;
        const winners = remainingPlayers.filter((player) => player.score === maxScore);

        for (const player of remainingPlayers) {
            const documentUser = this.fireStore.collection<User>('users', (ref) => ref.where('username', '==', player.name));
            const refDocument = await documentUser.get().toPromise();

            if (!refDocument?.empty) {
                const userDocument = refDocument?.docs[0];
                const userData = userDocument?.data() as User;
                const userStatistics = userData.statistics;
                const userGamesHistoric = userData.gamesHistoric;
                const time = Timestamp.now();

                if (winners.includes(player)) {
                    userStatistics.gamesW++;
                    userGamesHistoric.push({ gameName: name, date: time, isWinner: true });
                } else {
                    userStatistics.gamesL++;
                    userGamesHistoric.push({ gameName: name, date: time, isWinner: false });
                }
                userStatistics.gamesP++;

                await this.fireStore
                    .collection<User>('users')
                    .doc(userDocument?.id)
                    .update({ statistics: userStatistics, gamesHistoric: userGamesHistoric });

                let newTime = userStatistics.averageTimePerGame * (userStatistics.gamesP - 1);
                newTime += timePlayed;
                userStatistics.averageTimePerGame = newTime / userStatistics.gamesP;

                const ratioGoodAnswers = player.nbGoodAnswersPlayer / this.currentGameService.questionsList.length;
                userStatistics.averageGoodAnsPerGame = (userStatistics.averageGoodAnsPerGame + ratioGoodAnswers) / userStatistics.gamesP;

                await this.fireStore
                    .collection<User>('users')
                    .doc(userDocument?.id)
                    .update({ statistics: userStatistics });
            }
        }
    }

    async updateStatisticsAbandon(currentUser: User | null, name: string, timePlayed: number, nbGoodAnswers: number): Promise<void> {
        const documentUser = this.fireStore.collection<User>('users', (ref) => ref.where('username', '==', currentUser?.username));
        const refDocument = await documentUser.get().toPromise();

        if (!refDocument?.empty) {
            const userDocument = refDocument?.docs[0];
            const userData = userDocument?.data() as User;
            const userStatistics = userData.statistics;
            const userGamesHistoric = userData.gamesHistoric;
            const time = Timestamp.now();

            userStatistics.gamesP++;
            userStatistics.gamesL++;
            userGamesHistoric.push({ gameName: name, date: time, isWinner: false });

            await this.fireStore
                .collection<User>('users')
                .doc(userDocument?.id)
                .update({ statistics: userStatistics, gamesHistoric: userGamesHistoric });

            let newTime = userStatistics.averageTimePerGame * (userStatistics.gamesP - 1);
            newTime += timePlayed;
            userStatistics.averageTimePerGame = newTime / userStatistics.gamesP;

            const ratioGoodAnswers = nbGoodAnswers / this.currentGameService.questionsList.length;
            userStatistics.averageGoodAnsPerGame = (userStatistics.averageGoodAnsPerGame + ratioGoodAnswers) / userStatistics.gamesP;

            await this.fireStore
                .collection<User>('users')
                .doc(userDocument?.id)
                .update({ statistics: userStatistics });
        }
    }

    currentStatistics(currentUser: User): Observable<Statistics> {
        return this.fireStore
            .collection<User>('users')
            .doc(currentUser.uid)
            .valueChanges()
            .pipe(
                map((user) => {
                    if (user?.statistics) {
                        return user.statistics;
                    } else {
                        return { gamesP: 0, gamesW: 0, gamesL: 0, averageGoodAnsPerGame: 0, averageTimePerGame: 0 };
                    }
                }),
            );
    }

    currentGamesHistoric(currentUser: User): Observable<GamesHistoric[]> {
        return this.fireStore
            .collection<User>('users')
            .doc(currentUser.uid)
            .valueChanges()
            .pipe(
                map((user) => {
                    if (user?.gamesHistoric) {
                        return user.gamesHistoric;
                    } else {
                        return [];
                    }
                }),
            );
    }
}
