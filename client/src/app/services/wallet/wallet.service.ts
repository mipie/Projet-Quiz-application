/* eslint-disable unicorn/prefer-switch */
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
export class WalletService {
    private fireStore: AngularFirestore = inject(AngularFirestore);

    async updateRewardsValues(players: Player[], roomPrice: number): Promise<void> {
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
                let userWallet = userData.wallet;

                if (roomPrice === 0) {
                    if (winners.includes(player)) {
                        userWallet += 30;
                    } else {
                        userWallet += 10;
                    }
                } else {
                    const totalPriceFee = roomPrice * players.length;
                    const losers = remainingPlayers.filter((loser) => !winners.includes(loser));
                    let playerFee = 0;
                    if (winners.some((winner) => winner.name === player.name)) {
                        playerFee = (totalPriceFee * (2 / 3)) / winners.length;
                        userWallet += Number(playerFee.toFixed(0));
                    } else {
                        playerFee = (totalPriceFee * (1 / 3)) / losers.length;
                        userWallet += Number(playerFee.toFixed(0));
                    }
                }

                await this.fireStore
                    .collection<User>('users')
                    .doc(userDocument?.id)
                    .update({ wallet: userWallet });
            }
        }
    }

    async payEnterRoom(currentUser: User, gamePrice: number): Promise<void> {
        const documentCurrentUser = this.fireStore.collection<User>('users').doc(currentUser.uid);
        const refDocument = await documentCurrentUser.get().toPromise();

        if (refDocument?.exists) {
            const userData = refDocument?.data() as User;
            const userWallet = userData.wallet;
            const newUserWallet = userWallet - gamePrice;

            await documentCurrentUser.update({ wallet: newUserWallet });
        }
    }

    currentWallet(currentUser: User): Observable<number> {
        return this.fireStore
            .collection<User>('users')
            .doc(currentUser.uid)
            .valueChanges()
            .pipe(
                map((user) => {
                    if (user?.wallet) {
                        return user.wallet;
                    } else {
                        return 0;
                    }
                }),
            );
    }
}
