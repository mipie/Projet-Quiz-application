/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable deprecation/deprecation */
import { inject, Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { getDownloadURL, ref, uploadBytes } from '@angular/fire/storage';
import { ChannelInfo, Message } from '@app/interfaces/channel/channel';
import { Avatar, User } from '@app/interfaces/user/user';
import { first, firstValueFrom, map, Observable } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class AvatarService {
    private listAvatarUrl: string[] = [];
    private isInitialized: boolean = false;
    private storage: AngularFireStorage = inject(AngularFireStorage);
    private fireStore: AngularFirestore = inject(AngularFirestore);

    get avatarUrls(): string[] {
        return this.listAvatarUrl;
    }

    async loadAvatarsCreation(): Promise<void> {
        if (!this.isInitialized) {
            const avatarsFolderRef = this.storage.ref('avatars');
            const listResult = await firstValueFrom(avatarsFolderRef.listAll());
            let count = 0;
            for (const item of listResult.items) {
                if (count < 2) {
                    const downloadURL = await item.getDownloadURL();
                    this.listAvatarUrl.push(downloadURL);
                }
                count++;
            }
            this.isInitialized = true;
        }
    }

    async uploadAvatar(file: File): Promise<string> {
        const storageRef = ref(this.storage.storage, `avatarsUploaded/${file.name}`);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        return url;
    }

    async changeUserAvatar(avatar: Avatar | undefined, currentUser: User): Promise<void> {
        const documentUser = this.fireStore.collection<User>('users').doc(currentUser.uid);
        const refDocument = await documentUser.get().toPromise();

        if (refDocument?.exists) {
            const newAvatar = avatar;
            await documentUser.update({ avatar: newAvatar });
        }
    }

    async changeUserAvatarMessage(avatar: Avatar | undefined, currentUser: User): Promise<void> {
        const snapshot = await this.fireStore.collection<ChannelInfo>('channels').get().toPromise();

        if (!snapshot) {
            return;
        }

        const matchingDocs = snapshot.docs.filter((doc) => doc.data().messages.some((msg: Message) => msg.username === currentUser.username));

        for (const doc of matchingDocs) {
            const data = doc.data();
            const updatedMessages = data.messages.map((msg: Message) => {
                if (msg.username === currentUser.username) {
                    return { ...msg, avatar: avatar?.currentAvatar };
                }
                return msg;
            });
            await this.fireStore.collection('channels').doc(doc.id).update({ messages: updatedMessages });
        }
    }
    avatarByUsername(username: string): Observable<string> {
        return this.fireStore
            .collection<User>('users', (ref) => ref.where('username', '==', username))
            .valueChanges()
            .pipe(
                map((users) => {
                    if (users && users.length > 0) {
                        const user = users[0];
                        return user.avatar.currentAvatar;
                    }
                    return '';
                }),
                first(),
            );
    }

    avatarList(currentUser: User): Observable<string[]> {
        return this.fireStore
            .collection<User>('users')
            .doc(currentUser.uid)
            .valueChanges()
            .pipe(
                map((user) => {
                    if (user?.avatar) {
                        return user.avatar.availableAvatars;
                    } else {
                        return [];
                    }
                }),
            );
    }

    updateAvatar(currentUser: User): Observable<string> {
        return this.fireStore
            .collection<User>('users')
            .doc(currentUser.uid)
            .valueChanges()
            .pipe(
                map((user) => {
                    if (user?.avatar) {
                        return user.avatar.currentAvatar;
                    } else {
                        return '';
                    }
                }),
            );
    }
}
