/* eslint-disable deprecation/deprecation */
import { inject, Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { User } from '@app/interfaces/user/user';
import { map, Observable } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class LangueService {
    language: string = '';
    private fireStore: AngularFirestore = inject(AngularFirestore);

    async changeUserLanguage(language: string, currentUser: User): Promise<void> {
        const documentUser = this.fireStore.collection<User>('users').doc(currentUser.uid);
        const refDocument = await documentUser.get().toPromise();

        if (refDocument?.exists) {
            const newLanguage = language;
            await documentUser.update({ language: newLanguage });
        }
    }

    currentLanguage(currentUser: User): Observable<string> {
        return this.fireStore
            .collection<User>('users')
            .doc(currentUser.uid)
            .valueChanges()
            .pipe(
                map((user) => {
                    if (user?.language) {
                        this.language = user.language;
                        return user.language;
                    } else {
                        return '';
                    }
                }),
            );
    }
}
