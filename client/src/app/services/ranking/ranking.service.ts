/* eslint-disable @typescript-eslint/no-magic-numbers */
/* eslint-disable deprecation/deprecation */
import { inject, Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Player } from '@app/interfaces/player/player';
import { User } from '@app/interfaces/user/user';
import { map, Observable } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class RankingService {
    private accessRankedGames: boolean;
    private fireStore: AngularFirestore = inject(AngularFirestore);

    get accessRanked(): boolean {
        return this.accessRankedGames;
    }

    set accessRanked(access: boolean) {
        this.accessRankedGames = access;
    }

    async changePlayerRanking(players: Player[]): Promise<void> {
        const remainingPlayers = players.filter((player) => !player.isSurrender);
        remainingPlayers.sort((a, b) => b.score - a.score);

        const maxScore = remainingPlayers[0].score;
        const winners = remainingPlayers.filter((player) => player.score === maxScore);

        for (const player of remainingPlayers) {
            const playerFound = this.fireStore.collection<User>('users', (ref) => ref.where('username', '==', player.name));
            const querySnapshot = await playerFound.get().toPromise();

            if (!querySnapshot?.empty) {
                const userDocuments = querySnapshot?.docs[0];
                const userData = userDocuments?.data() as User;
                let rankedW = userData.rankingW;
                let rankedL = userData.rankingL;
                let rankedD = userData.rankingD;
                let userRankingPoints = userData.rankingPoints;
                if (winners.includes(player)) {
                    if (winners.length === 1) {
                        userRankingPoints += 10;
                        rankedW++;
                    } else {
                        rankedD++;
                    }
                } else {
                    if (userRankingPoints >= 10) {
                        userRankingPoints -= 10;
                    }
                    rankedL++;
                }
                await this.fireStore
                    .collection<User>('users')
                    .doc(userDocuments?.id)
                    .update({ rankingPoints: userRankingPoints, rankingW: rankedW, rankingL: rankedL, rankingD: rankedD });
            }
        }
    }

    async changePlayerRankingAbandon(currentUser: User | null): Promise<void> {
        const playerFound = this.fireStore.collection<User>('users', (ref) => ref.where('username', '==', currentUser?.username));
        const querySnapshot = await playerFound.get().toPromise();

        if (!querySnapshot?.empty) {
            const userDocuments = querySnapshot?.docs[0];
            const userData = userDocuments?.data() as User;
            let rankedL = userData.rankingL;
            let userRankingPoints = userData.rankingPoints;

            if (userRankingPoints >= 10) {
                userRankingPoints -= 10;
            }
            rankedL++;

            await this.fireStore
                .collection<User>('users')
                .doc(userDocuments?.id)
                .update({ rankingPoints: userRankingPoints, rankingL: rankedL });
        }
    }

    currentRankingPoints(currentUser: User): Observable<number> {
        return this.fireStore
            .collection<User>('users')
            .doc(currentUser.uid)
            .valueChanges()
            .pipe(
                map((user) => {
                    if (user?.rankingPoints) {
                        return user.rankingPoints;
                    } else {
                        return 0;
                    }
                }),
            );
    }

    currentOrderRanked(): Observable<User[]> {
        return this.fireStore
            .collection<User>('users')
            .valueChanges()
            .pipe(
                map((users) => {
                    return users.sort((a, b) => {
                        if (b.rankingPoints !== a.rankingPoints) {
                            return b.rankingPoints - a.rankingPoints;
                        } else if (b.rankingW !== a.rankingW) {
                            return b.rankingW - a.rankingW;
                        } else if (b.rankingD !== a.rankingD) {
                            return b.rankingD - a.rankingD;
                        } else {
                            return a.rankingL - b.rankingL;
                        }
                    });
                }),
            );
    }
}
