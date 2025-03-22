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
export class ExperienceService {
    private fireStore: AngularFirestore = inject(AngularFirestore);
    private exp: number = 0;
    private lvl: number = 0;

    get xpValue(): number {
        return this.exp;
    }

    get lvlValue(): number {
        return this.lvl;
    }

    set lvlValue(value: number) {
        this.lvl = value;
    }

    set xpValue(value: number) {
        this.exp = value;
    }

    async updateExperienceValues(players: Player[]): Promise<void> {
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
                let userXp = userData.experience;
                if (winners.includes(player)) {
                    userXp += 40;
                } else {
                    userXp += 20;
                }
                await this.fireStore
                    .collection<User>('users')
                    .doc(userDocuments?.id)
                    .update({ experience: userXp });
            }
        }
    }

    gainLevel(xp: number): void {
        this.lvlValue = Math.floor(xp / 100);
        this.exp = xp % 100;
    }

    resetLevel(): void {
        this.lvlValue = 1;
        this.xpValue = 0;
    }

    updateXpGained(currentUser: User): Observable<number> {
        return this.fireStore
            .collection<User>('users')
            .doc(currentUser.uid)
            .valueChanges()
            .pipe(
                map((user) => {
                    if (user?.experience) {
                        return user.experience;
                    } else {
                        return 0;
                    }
                }),
            );
    }
}
