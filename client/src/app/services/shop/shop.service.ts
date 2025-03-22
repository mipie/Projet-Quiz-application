/* eslint-disable @typescript-eslint/no-magic-numbers */
/* eslint-disable deprecation/deprecation */
import { inject, Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { User } from '@app/interfaces/user/user';
import { firstValueFrom, map, Observable } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class ShopService {
    private listAvatarUrl: string[] = [];
    private listThemeUrl: string[] = [];
    private isInitializedAvatars: boolean = false;
    private isInitializedThemes: boolean = false;
    private storage: AngularFireStorage = inject(AngularFireStorage);
    private fireStore: AngularFirestore = inject(AngularFirestore);

    get avatarUrl(): string[] {
        return this.listAvatarUrl;
    }

    get themeUrl(): string[] {
        return this.listThemeUrl;
    }

    async loadAvatarsCreation(): Promise<void> {
        const avatarsFolderRef = this.storage.ref('shop/avatars');
        const listResult = await firstValueFrom(avatarsFolderRef.listAll());

        if (!this.isInitializedAvatars) {
            for (const item of listResult.items) {
                const downloadURL = await item.getDownloadURL();
                this.listAvatarUrl.push(downloadURL);
            }
        }
        this.isInitializedAvatars = true;
    }

    async loadThemesCreation(): Promise<void> {
        const themesFolderRef = this.storage.ref('shop/themes');
        const listResult = await firstValueFrom(themesFolderRef.listAll());

        if (!this.isInitializedThemes) {
            for (const item of listResult.items) {
                const downloadURL = await item.getDownloadURL();
                this.listThemeUrl.push(downloadURL);
            }
        }
        this.isInitializedThemes = true;
    }

    async buyAvatar(currentUser: User, avatarItemSelected: string, priceItem: number): Promise<void> {
        const documentUser = this.fireStore.collection<User>('users').doc(currentUser.uid);
        const refDocument = await documentUser.get().toPromise();

        if (refDocument?.exists) {
            const newItemAvatar = avatarItemSelected;
            const newWallet = currentUser.wallet - priceItem;
            currentUser.avatar.availableAvatars.push(newItemAvatar);
            await documentUser.update({ avatar: currentUser.avatar, wallet: newWallet });
        }
    }

    async buyTheme(currentUser: User, themeItemSelected: string, priceItem: number): Promise<void> {
        const documentUser = this.fireStore.collection<User>('users').doc(currentUser.uid);
        const refDocument = await documentUser.get().toPromise();

        if (refDocument?.exists) {
            const newItemTheme = themeItemSelected;
            const newWallet = currentUser.wallet - priceItem;
            currentUser.theme.availableThemes.push(newItemTheme);
            await documentUser.update({ theme: currentUser.theme, wallet: newWallet });
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
