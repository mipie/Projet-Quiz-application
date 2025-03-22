/* eslint-disable deprecation/deprecation */
import { inject, Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { Theme, User } from '@app/interfaces/user/user';
import { firstValueFrom, map, Observable } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class ThemeService {
    theme: string = '';
    private listThemeUrl: string[] = [];
    private storage: AngularFireStorage = inject(AngularFireStorage);
    private fireStore: AngularFirestore = inject(AngularFirestore);

    get themeUrls(): string[] {
        return this.listThemeUrl;
    }

    async loadThemesCreation(): Promise<void> {
        const themesFolderRef = this.storage.ref('themes');
        const listResult = await firstValueFrom(themesFolderRef.listAll());

        for (const item of listResult.items) {
            const downloadURL = await item.getDownloadURL();
            this.listThemeUrl.push(downloadURL);
        }
    }

    async changeUserTheme(theme: Theme, currentUser: User): Promise<void> {
        const documentUser = this.fireStore.collection<User>('users').doc(currentUser.uid);
        const refDocument = await documentUser.get().toPromise();

        if (refDocument?.exists) {
            const newTheme = theme;
            await documentUser.update({ theme: newTheme });
        }
    }

    currentTheme(currentUser: User): Observable<string> {
        return this.fireStore
            .collection<User>('users')
            .doc(currentUser.uid)
            .valueChanges()
            .pipe(
                map((user) => {
                    if (user?.theme) {
                        this.theme = user.theme.currentTheme;
                        return user.theme.currentTheme;
                    } else {
                        return '';
                    }
                }),
            );
    }

    themeList(currentUser: User): Observable<string[]> {
        return this.fireStore
            .collection<User>('users')
            .doc(currentUser.uid)
            .valueChanges()
            .pipe(
                map((user) => {
                    if (user?.theme) {
                        return user.theme.availableThemes;
                    } else {
                        return [];
                    }
                }),
            );
    }
}
