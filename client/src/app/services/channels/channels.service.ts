/* eslint-disable max-params */
/* eslint-disable @typescript-eslint/no-magic-numbers */
/* eslint-disable prettier/prettier */
import { inject, Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { ChannelInfo, ChatChannel, Message } from '@app/interfaces/channel/channel';
import { User, UserChannel } from '@app/interfaces/user/user';
import { Timestamp } from '@firebase/firestore';
import { map, Observable, Subscription } from 'rxjs';

@Injectable({
	providedIn: 'root',
})
export class ChannelsService {
	currentChannel: string = 'KAM? PAF!';
	isMinimized : boolean = false;
	isMaximized: boolean = false;
	isResults: boolean = false;
    roomCode: string = '';
    isOrganisator: boolean = false;
    inGame: boolean = false;
	currentUser: User | null;
    messages: Message[];
    isMute: boolean = false;
    isMuted: string = '';
	messagesSubscription: Subscription;

	private fireStore = inject(AngularFirestore);

	async sendChat(username: string, message: string, title: string = 'KAM? PAF!', 
		avatar?: string | undefined, fromAdmins: boolean = false): Promise<void> {
		const time = Timestamp.now();
		const newMessage = { username, message, time, fromAdmins, avatar: avatar || 'default-avatar-url' } as Message;

		const documentChannel = this.fireStore.collection<ChatChannel>('channels').doc<ChannelInfo>(title);
		const refDoc = await documentChannel.get().toPromise();

		if (refDoc?.exists) {
			const existingMessages = refDoc.data()?.messages || [];
			const messageUpdated = [...existingMessages, newMessage];
			messageUpdated.sort((a, b) => a.time.toMillis() - b.time.toMillis());
			await documentChannel.update({
				messages: messageUpdated,
			});
		}
	}

	getChannel(title: string = 'KAM? PAF!'): Observable<Message[]> {
		return this.fireStore
			.collection<ChatChannel>('channels')
			.doc<ChannelInfo>(title)
			.valueChanges()
			.pipe(
				map((channel) => {
					if (channel != null) {
						return channel.messages || [];
					} else {
						throw new Error(`${title} channel does not exist`);
					}
				}),
			);
	}

	getAllChannels(): Observable<string[]> {
		return this.fireStore.collection<ChannelInfo>('channels').snapshotChanges().pipe(
			map((actions) => actions
				.map((action) => action.payload.doc.data().title)
			)
		);
	}

	searchChannels(querry: string): Observable<string[]> {
		return this.fireStore.collection<ChannelInfo>('channels').snapshotChanges().pipe(
			map((actions) => actions
				.map((action) => action.payload.doc.data().title)
				.filter((title) => {
					const normalizedQuery = querry
						.toLocaleLowerCase()
						.trim()
						.normalize('NFD')
						.replace(/[\u0300-\u036f]/g, '')
						.split(/\s+/);

					const normalizedTitle = title
						.toLowerCase()
						.trim()
						.normalize('NFD')
						.replace(/[\u0300-\u036f]/g, '')
						.split(/\s+/);

					return normalizedQuery.every((qword) =>
						normalizedTitle.some((word) => word.startsWith(qword))
					);
				}))
		);
	}

	async createChannel(title: string, currentUser: User | null): Promise<boolean> {
		title = title.trim();
		if (!currentUser || !title) return false;
		const channelDoc = this.fireStore.collection('channels').doc(title);
		const document = await channelDoc.get().toPromise();
		if (document?.exists) return false;
		const time = Timestamp.now();
		const firstMessage = {
			username: currentUser.username,
			message: `Ce canal a été créé par : ${currentUser.username}`,
			time,
			fromAdmins: true,
			avatar: currentUser.avatar.currentAvatar,
		} as Message;
		const data = {
			creator: currentUser?.username,
			title,
			messages: [firstMessage],
		};
		const userChannel = {
			title,
			lastMessageSeen: time,
		} as UserChannel;
		currentUser.createdChannels = currentUser.createdChannels || [];
		currentUser.createdChannels.unshift(userChannel);
		await this.fireStore.collection('users').doc<User>(currentUser.uid).update({
			createdChannels: currentUser.createdChannels
		});
		await channelDoc.set(data);
		return true;
	}

	joinChannel(title: string, currentUser: User | null): boolean {
		title = title.trim();
		if (!currentUser || !title) return false;
		currentUser.joinedChannels = currentUser.joinedChannels || [];
		const userChannel = currentUser.joinedChannels.find((channel) => channel.title === title);
		if (userChannel) {
			return false;
		}
		currentUser.joinedChannels.unshift({ title, lastMessageSeen: null } as UserChannel);
		this.fireStore.collection<User>('users').doc(currentUser.uid).update({
			joinedChannels: currentUser.joinedChannels
		});
		return true;
	}

	quitChannel(title: string, currentUser: User | null): boolean {
		title = title.trim();
		if (!currentUser || !title || title.startsWith('*************')) return false;
		const channelIndex = currentUser.joinedChannels.findIndex((channel) => channel.title === title);
		if (channelIndex !== -1) {
			currentUser.joinedChannels.splice(channelIndex, 1);
			this.fireStore.collection<User>('users').doc(currentUser.uid).update({
				joinedChannels: currentUser.joinedChannels
			});
		}
		return true;
	}

	async deleteChannel(title: string, currentUser: User | null): Promise<boolean> {
		title = title.trim();
		if (!currentUser || !title) return false;
		const channelIndex = currentUser.createdChannels.findIndex((channel) => channel.title === title);
		if (channelIndex !== -1) {
			currentUser.createdChannels.splice(channelIndex, 1);
			this.fireStore.collection('channels').doc(title).delete();
			this.fireStore.collection('users').doc(currentUser.uid).update({
				createdChannels: currentUser.createdChannels
			});
			return true;
		}
		return false;
	}

	async wasChannelDeleted(title: string): Promise<boolean> {
		const channelDoc = await this.fireStore.collection('channels').doc(title).get().toPromise();
		return !channelDoc?.exists;
	}

	async updateLastSeenMessage(currentUser: User, title: string): Promise<boolean> {
		const userDocRef = this.fireStore.collection<User>('users').doc(currentUser.uid);
		const userData = (await userDocRef.get().toPromise())?.data();

		if (!userData) return false;

		const channelToUpdate = userData.joinedChannels.find((channel) => channel.title === title)
			|| userData.createdChannels.find((channel) => channel.title === title);

		if (channelToUpdate) {
			channelToUpdate.lastMessageSeen = Timestamp.now();
			await userDocRef.update({
				joinedChannels: userData.joinedChannels,
				createdChannels: userData.createdChannels
			});
			return true;
		}
		return false;
	}
}
