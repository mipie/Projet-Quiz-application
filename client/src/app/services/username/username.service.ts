/* eslint-disable deprecation/deprecation */
import { inject, Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { ChannelInfo, Message } from '@app/interfaces/channel/channel';
import { User } from '@app/interfaces/user/user';
import { map, Observable } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class UsernameService {
    private fireStore: AngularFirestore = inject(AngularFirestore);

    async changeUserUsername(currentUser: User, username: string): Promise<void> {
        const documentUser = this.fireStore.collection<User>('users').doc(currentUser.uid);
        const refDocument = await documentUser.get().toPromise();

        if (refDocument?.exists) {
            const newUsername = username;
            await documentUser.update({ username: newUsername });

            const snapshot = await this.fireStore.collection<User>('users').get().toPromise();
            if (!snapshot) {
                return;
            }

            const matchingDocsRequests = snapshot.docs.filter(
                (doc) => doc.data().requests?.some((request: { uid: string }) => request.uid === currentUser.uid),
            );

            const matchingDocsFriends = snapshot.docs.filter((doc) =>
                doc.data().friends.some((friend: { uid: string }) => friend.uid === currentUser.uid),
            );

            for (const requestsDoc of matchingDocsRequests) {
                const userData = requestsDoc.data();
                const updatedRequests = userData.requests.map((request: { uid: string; username: string }) => {
                    if (request.uid === currentUser.uid) {
                        return { ...request, username: newUsername };
                    }
                    return request;
                });
                await this.fireStore.collection('users').doc(requestsDoc.id).update({ requests: updatedRequests });
            }

            for (const friendsDoc of matchingDocsFriends) {
                const userData = friendsDoc.data();
                const updatedFriends = userData.friends.map((friend: { uid: string; username: string }) => {
                    if (friend.uid === currentUser.uid) {
                        return { ...friend, username: newUsername };
                    }
                    return friend;
                });
                await this.fireStore.collection('users').doc(friendsDoc.id).update({ friends: updatedFriends });
            }
        }
    }

    async changeUserUsernameMessage(currentUsername: string, currentUser: User): Promise<void> {
        const snapshot = await this.fireStore.collection<ChannelInfo>('channels').get().toPromise();

        if (!snapshot) {
            return;
        }

        const matchingDocs = snapshot.docs.filter((doc) => doc.data().messages.some((msg: Message) => msg.username === currentUser.username));

        for (const doc of matchingDocs) {
            const data = doc.data();
            const updatedMessages = data.messages.map((msg: Message) => {
                if (msg.username === currentUser.username) {
                    return { ...msg, username: currentUsername };
                }
                return msg;
            });
            await this.fireStore.collection('channels').doc(doc.id).update({ messages: updatedMessages });
        }
    }

    getAllUsers(): Observable<User[]> {
        return this.fireStore
            .collection<User>('users')
            .valueChanges()
            .pipe(
                map((users) => {
                    return users;
                }),
            );
    }

    username(currentUser: User): Observable<string> {
        return this.fireStore
            .collection<User>('users')
            .doc(currentUser.uid)
            .valueChanges()
            .pipe(
                map((user) => {
                    if (user?.username) {
                        return user.username;
                    } else {
                        return '';
                    }
                }),
            );
    }
}
