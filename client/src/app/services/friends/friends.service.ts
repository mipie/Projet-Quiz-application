/* eslint-disable deprecation/deprecation */
import { inject, Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { User, UserInfo } from '@app/interfaces/user/user';
import { map, Observable, switchMap } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class FriendsService {
    private fireStore: AngularFirestore = inject(AngularFirestore);

    filterByUsers(searchInput: string, currentUser: User): Observable<User[]> {
        return this.fireStore
            .collection<User>('users')
            .doc(currentUser.uid)
            .valueChanges()
            .pipe(
                switchMap((currentUserData) => {
                    const friendsList = currentUserData?.friends || [];
                    const requestsList = currentUserData?.requests || [];
                    return this.fireStore
                        .collection<User>('users')
                        .valueChanges()
                        .pipe(
                            map((doc) => {
                                const filteredUsers = doc.filter(
                                    (user) =>
                                        currentUser.uid !== user.uid &&
                                        !friendsList.some((friend) => friend.uid === user.uid) &&
                                        !requestsList.some((request) => request.uid === user.uid),
                                );
                                const matchedUsers = filteredUsers.filter((user) =>
                                    user.username.toLowerCase().startsWith(searchInput.toLowerCase()),
                                );
                                return matchedUsers;
                            }),
                        );
                }),
            );
    }

    async requestFriend(user: User, currentUser: User): Promise<void> {
        const documentUser = this.fireStore.collection<User>('users', (ref) => ref.where('uid', '==', user.uid));
        const refDocument = await documentUser.get().toPromise();
        if (!refDocument?.empty) {
            const userDocument = refDocument?.docs[0];
            const userData = userDocument?.data() as User;
            let existingRequests = userData.requests || [];

            const isRequestAlreadySend = existingRequests.some((request) => request.uid === currentUser.uid);
            if (!isRequestAlreadySend) {
                existingRequests.push({ username: currentUser.username, uid: currentUser.uid });
            } else if (isRequestAlreadySend) {
                existingRequests = existingRequests.filter((request) => request.uid !== currentUser.uid);
            }

            await this.fireStore
                .collection<User>('users')
                .doc(userDocument?.id)
                .update({
                    requests: existingRequests,
                });
        }
    }

    async acceptRequest(friend: UserInfo, currentUser: User): Promise<void> {
        const documentCurrentUser = this.fireStore.collection<User>('users').doc(currentUser.uid);
        const refDocument = await documentCurrentUser.get().toPromise();

        if (refDocument?.exists) {
            const newFriend = { username: friend.username, uid: friend.uid };
            const requestsList = refDocument.data()?.requests || [];
            const friendsList = refDocument.data()?.friends || [];

            const updatedRequestList = requestsList?.filter((requests) => requests.uid !== friend.uid);
            const updatedFriendList = [...friendsList, newFriend];
            await documentCurrentUser.update({ requests: updatedRequestList, friends: updatedFriendList });
        }

        const documentFriendUser = this.fireStore.collection<User>('users').doc(friend.uid);
        const refFriendUser = await documentFriendUser.get().toPromise();
        if (refFriendUser?.exists) {
            const newFriend = { username: currentUser.username, uid: currentUser.uid };
            const friendsList = refFriendUser.data()?.friends || [];
            const updatedFriendList = [...friendsList, newFriend];
            await documentFriendUser.update({ friends: updatedFriendList });
        }
    }

    async refuseRequest(friend: UserInfo, currentUser: User): Promise<void> {
        const documentUser = this.fireStore.collection<User>('users').doc(currentUser.uid);
        const refDocument = await documentUser.get().toPromise();

        if (refDocument?.exists) {
            const requestsList = refDocument.data()?.requests || [];
            const updatedRequestList = requestsList?.filter((requests) => requests.uid !== friend.uid);
            await documentUser.update({ requests: updatedRequestList });
        }
    }

    async deleteFriend(friend: UserInfo, currentUser: User): Promise<void> {
        const documentUser = this.fireStore.collection<User>('users').doc(currentUser.uid);
        const refDocumentUser = await documentUser.get().toPromise();

        if (refDocumentUser?.exists) {
            const friendsList = refDocumentUser.data()?.friends || [];
            const updatedFriendList = friendsList?.filter((friends) => friends.uid !== friend.uid);
            await documentUser.update({ friends: updatedFriendList });
        }

        const documentFriendUser = this.fireStore.collection<User>('users').doc(friend.uid);
        const refFriendUser = await documentFriendUser.get().toPromise();

        if (refFriendUser?.exists) {
            const friendsList = refFriendUser.data()?.friends || [];
            const updatedFriendList = friendsList?.filter((friends) => friends.uid !== currentUser.uid);
            await documentFriendUser.update({ friends: updatedFriendList });
        }
    }

    requestsList(currentUser: User): Observable<UserInfo[]> {
        return this.fireStore
            .collection<User>('users')
            .doc(currentUser.uid)
            .valueChanges()
            .pipe(
                map((user) => {
                    if (user?.requests) {
                        return user.requests;
                    } else {
                        return [];
                    }
                }),
            );
    }

    friendsList(currentUser: User): Observable<UserInfo[]> {
        return this.fireStore
            .collection<User>('users')
            .doc(currentUser.uid)
            .valueChanges()
            .pipe(
                map((user) => {
                    if (user?.friends) {
                        return user.friends;
                    } else {
                        return [];
                    }
                }),
            );
    }
}
