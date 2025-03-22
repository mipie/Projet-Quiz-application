/* eslint-disable max-params */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable deprecation/deprecation */
import { inject, Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Router } from '@angular/router';
import { MIN_LENGTH_PASSWORD, TO_HOME, TO_LOGIN, TO_REGISTER } from '@app/constants';
import { ChannelInfo, ChatChannel } from '@app/interfaces/channel/channel';
import { Avatar, GamesHistoric, Statistics, Theme, User, UserInfo } from '@app/interfaces/user/user';
import { AvatarService } from '@app/services/avatars/avatar.service';
import { ChannelsService } from '@app/services/channels/channels.service';
import { ThemeService } from '@app/services/themes/theme.service';
import { Timestamp } from '@firebase/firestore';
import { firstValueFrom } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class AuthService {
    messageError: string = '';
    messageErrorRegister: string = '';
    private currentUser: User;
    private friends: UserInfo[] = [];
    private requests: UserInfo[] = [];
    private avatar: Avatar = { currentAvatar: '', availableAvatars: [] };
    private theme: Theme = { currentTheme: '', availableThemes: [] };
    private statistics: Statistics = { gamesP: 0, gamesW: 0, gamesL: 0, averageGoodAnsPerGame: 0, averageTimePerGame: 0 };
    private gamesHistoric: GamesHistoric[] = [];
    private historic: Timestamp[] = [];
    private fireAuth: AngularFireAuth = inject(AngularFireAuth);
    private fireStore: AngularFirestore = inject(AngularFirestore);
    private fireRealTimeDatabase: AngularFireDatabase = inject(AngularFireDatabase);
    private router: Router = inject(Router);
    private channelsService: ChannelsService = inject(ChannelsService);
    private avatarService: AvatarService = inject(AvatarService);
    private themeService: ThemeService = inject(ThemeService);

    set setMessageErrorRegister(message: string) {
        this.messageErrorRegister = message;
    }

    set setMessageErrorLogin(message: string) {
        this.messageError = message;
    }

    async login(username: string, password: string): Promise<void> {
        this.messageError = '';
        username = username.trim();
        const usernameFound = this.fireStore.collection<User>('users', (ref) => ref.where('username', '==', username));
        const responseDocument = await usernameFound.get().toPromise();
        if (!responseDocument?.empty) {
            const userDoc = responseDocument?.docs[0];
            const userData = userDoc?.data() as User;
            const uid = userData.uid;
            const email = userData.email;

            try {
                const logged = this.fireRealTimeDatabase.object<boolean>(`status/${uid}/logged`).valueChanges();
                const isOnline = await firstValueFrom(logged);

                if (isOnline) {
                    this.messageError = 'Cet utilisateur est déjà connecté sur un autre appareil.';
                    return;
                }

                await this.fireAuth.signInWithEmailAndPassword(email, password);
                await this.fireRealTimeDatabase.object(`status/${uid}/logged`).set(true);
                this.fireRealTimeDatabase.database.ref(`status/${uid}`).onDisconnect().set({ logged: false });

                const newLoginTime = Timestamp.now();
                const existingHistoric = userData.historic || [];
                const updatedHistoric = [...existingHistoric, newLoginTime];
                await this.fireStore.collection('users').doc(uid).update({
                    historic: updatedHistoric,
                });

                await this.fireAuth.setPersistence('session');
                this.router.navigate([TO_HOME]);
            } catch (error) {
                this.messageError = 'Le mot de passe est mauvais.';
            }
        } else {
            this.messageError = 'Le compte est inexistant.';
        }
    }

    async register(username: string, email: string, password: string, avatarDefined: string): Promise<void> {
        this.messageErrorRegister = '';
        username = username.trim();
        email = email.trim();

        this.verificationInfoRegister(username, password, email, avatarDefined);
        try {
            const usernameFound = this.fireStore.collection<User>('users', (ref) => ref.where('username', '==', username));
            const responseDocument = await usernameFound.get().toPromise();

            if (!responseDocument?.empty) {
                this.messageErrorRegister = "Le nom d'utilisateur a déjà été pris. Veuillez en choisir un autre.";
                return;
            }
            const userCredential = await this.fireAuth.createUserWithEmailAndPassword(email, password);
            const uid = userCredential.user?.uid;
            // set historique
            const historicLoginTime = Timestamp.now();
            this.historic.push(historicLoginTime);
            // set avatar
            this.avatar.currentAvatar = avatarDefined;
            this.avatar.availableAvatars = this.avatarService.avatarUrls;
            // set theme
            await this.themeService.loadThemesCreation();
            this.theme.currentTheme = this.themeService.themeUrls[0]; // thème de feu par défaut cest le 0 //
            this.theme.availableThemes = this.themeService.themeUrls;

            // important de mettre le displayName et on ajoutera l'avatar ici, car avec auth on a pas réellement accès au nom venant de la BD //
            await userCredential.user?.updateProfile({
                displayName: username,
            });

            await this.fireStore
                .collection('users')
                .doc(uid)
                .set({
                    username,
                    email,
                    uid,
                    friends: this.friends,
                    requests: this.requests,
                    joinedChannels: [
                        {
                            title: 'KAM? PAF!',
                            lastMessageSeen: null,
                        },
                    ],
                    createdChannels: [],
                    historic: this.historic,
                    avatar: this.avatar,
                    theme: this.theme,
                    language: 'fra',
                    statistics: this.statistics,
                    gamesHistoric: this.gamesHistoric,
                    wallet: 100,
                    experience: 0,
                    rankingPoints: 0,
                    rankingW: 0,
                    rankingL: 0,
                    rankingD: 0,
                });

            const documentChannel = this.fireStore.collection<ChatChannel>('channels').doc<ChannelInfo>('KAM? PAF!');
            const generalChat = await documentChannel.get().toPromise();
            if (generalChat?.exists && uid != null) {
                const existingUsersId = generalChat.data()?.usersId || [];
                const updatedUsersId = [...existingUsersId, uid];
                await documentChannel.update({
                    usersId: updatedUsersId,
                });
            }
            try {
                await this.channelsService.sendChat(
                    this.currentUser?.username,
                    `${this.currentUser?.username} a rejoint la plateforme.`,
                    'KAM? PAF!',
                    undefined,
                    true,
                );
            } catch (err) {
                this.messageErrorRegister = "Erreur lors de l'envoi du message de bienvenue.";
            }

            this.router.navigate([TO_HOME]);
        } catch (err) {
            this.messageErrorRegister = "L'adresse courriel est déja utilisée ou invalide.";
            this.router.navigate([TO_REGISTER]);
        }
    }

    async logout(): Promise<void> {
        const currentUser = await this.fireAuth.currentUser;
        if (currentUser) {
            const uid = currentUser.uid;

            const newLogoutTime = Timestamp.now();
            const userDoc = await this.fireStore.collection<User>('users').doc(uid).get().toPromise();
            const userData = userDoc?.data() as User;
            const existingHistoric = userData.historic || [];
            const updatedHistoric = [...existingHistoric, newLogoutTime];
            await this.fireStore.collection('users').doc(uid).update({
                historic: updatedHistoric,
            });

            await this.fireRealTimeDatabase.object(`status/${uid}/logged`).set(false);
            await this.fireAuth.setPersistence('none');
            await this.fireAuth.signOut();
        }
        this.router.navigate([TO_LOGIN]);
        if (!(await (window as any).electron.isWindowClosed('chatWindow'))) {
            (window as any).electron.close('chatWindow');
        }
        (window as any).electron.setCurrentUser(undefined);
    }

    async getCurrentUser(): Promise<User | null> {
        const user = await this.fireAuth.currentUser;
        if (user) {
            const userDoc = await this.fireStore.collection<User>('users').doc(user.uid).get().toPromise();
            const userData = userDoc?.data() as User;
            this.currentUser = {
                uid: user.uid,
                username: user.displayName || '',
                email: user.email || '',
                friends: userData.friends,
                requests: userData.requests,
                createdChannels: userData.createdChannels || '',
                joinedChannels: userData.joinedChannels || '',
                historic: userData.historic,
                avatar: userData.avatar,
                theme: userData.theme,
                language: userData.language,
                statistics: userData.statistics,
                gamesHistoric: userData.gamesHistoric,
                wallet: userData.wallet,
                experience: userData.experience,
                rankingPoints: userData.rankingPoints,
                rankingW: userData.rankingW,
                rankingL: userData.rankingL,
                rankingD: userData.rankingD,
            };
            return this.currentUser;
        }
        return null;
    }

    async checkAuthState(path: string): Promise<User | null> {
        const user = await firstValueFrom(this.fireAuth.authState);
        if (user) {
            this.router.navigate([path]);
            return await this.getCurrentUser();
        } else {
            this.router.navigate([TO_LOGIN]);
            return null;
        }
    }

    verificationInfoRegister(username: string, password: string, email: string, avatar: string): void {
        if (email.length === 0) {
            this.messageErrorRegister = 'Veuillez entrer une adresse courriel.';
            throw new Error();
        } else if (username.length === 0) {
            this.messageErrorRegister = "Veuillez entrer un nom d'utilisateur.";
            throw new Error();
        } else if (password.length < MIN_LENGTH_PASSWORD) {
            this.messageErrorRegister = "Veuillez entrer un mot de passe d'au moins 6 caractères.";
            throw new Error();
        } else if (avatar.length === 0) {
            this.messageErrorRegister = 'Veuillez choisir un avatar.';
            throw new Error();
        }
    }
}
