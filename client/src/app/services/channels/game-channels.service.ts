/* eslint-disable max-params */
/* eslint-disable @typescript-eslint/no-magic-numbers */
/* eslint-disable prettier/prettier */
import { inject, Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { ChannelInfo, ChatChannel, Message } from '@app/interfaces/channel/channel';
import { User, UserChannel } from '@app/interfaces/user/user';
import { Timestamp } from '@firebase/firestore';
import { map, Observable } from 'rxjs';

@Injectable({
	providedIn: 'root',
})
export class GameChannelsService {
	private fireStore = inject(AngularFirestore);

	async sendChat(username: string, message: string, title: string = 'KAM? PAF!', 
		avatar?: string | undefined, fromAdmins: boolean = false): Promise<void> {
		const time = Timestamp.now();
		const newMessage = { username, message, time, fromAdmins, avatar: avatar || 'default-avatar-url' } as Message;

		const documentChannel = this.fireStore.collection<ChatChannel>('game-channels').doc<ChannelInfo>(title);
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

	getChannelMessages(title: string): Observable<Message[]> {
		return this.fireStore
			.collection<ChatChannel>('game-channels')
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

	async resetGamingChannel(currentUser: User | null): Promise<void> {
		if (!currentUser) return;
		const channelToRemove = currentUser.joinedChannels.find((channel) => channel.title.startsWith('*************'));
		if (!channelToRemove) return;
	
		const channelDocRef = this.fireStore.collection<ChannelInfo>('game-channels').doc(channelToRemove.title);
		const userDocRef = this.fireStore.collection<User>('users').doc(currentUser.uid);
		const [channelDoc, userDoc] = await Promise.all([
			channelDocRef.get().toPromise(),
			userDocRef.get().toPromise(),
		]);
		
		if (channelDoc?.exists) {
			const channelData = channelDoc.data() as ChannelInfo;	
			if (channelData.members) {
				const updatedMembers = channelData.members.filter((member) => member !== currentUser.username);
	
				if (updatedMembers.length !== channelData.members.length) {
					await channelDocRef.update({ members: updatedMembers });
				}
	
				if (updatedMembers.length === 0) {
					await channelDocRef.delete();
				}
			}
		}
	
		if (userDoc?.exists) {
			const userData = userDoc.data() as User;
	
			const updatedJoinedChannels = userData.joinedChannels.filter((channel) => channel.title !== channelToRemove.title);
	
			if (updatedJoinedChannels.length !== userData.joinedChannels.length) {
				await userDocRef.update({ joinedChannels: updatedJoinedChannels });
			}
		} 
	}
	

	async createGameChannel(title: string, currentUser: User | null): Promise<void> {
		title = '*************' + title.trim();
		if (!currentUser || !title) return;
		const time = Timestamp.now();
	
		const userDocRef = this.fireStore.collection<User>('users').doc(currentUser.uid);
		const channelDocRef = this.fireStore.collection<ChatChannel>('game-channels').doc<ChannelInfo>(title);
	
		const [userDoc, channelDoc] = await Promise.all([
			userDocRef.get().toPromise(),
			channelDocRef.get().toPromise()
		]);
	
		if (channelDoc?.exists) {
			await channelDocRef.delete();
		}

		if (!channelDoc?.exists) {
			const firstMessage = {
				username: currentUser.username,
				message: `Cette salle de jeu a été ouverte par : ${currentUser.username}`,
				time,
				fromAdmins: true,
			} as Message;
			
			const data = {
				creator: currentUser.username,
				title,
				messages: [firstMessage],
				members: [currentUser.username],
			} as ChannelInfo;
	
			await channelDocRef.set(data);
		}

		if (userDoc?.exists) {
			const userData = userDoc.data() as User;
			const joinedChannels = userData.joinedChannels || [];
			const userChannel = joinedChannels.find((channel) => channel.title === title);
			if (!userChannel) {
				joinedChannels.unshift({ title, lastMessageSeen: null } as UserChannel);
				await userDocRef.update({ joinedChannels });
			}
		} 
	}
	

	async joinGameChannel(title: string, currentUser: User | null, isOrganisator: boolean = false): Promise<void> {
		title = '*************' + title.trim();
		if (!currentUser || !title) return;
	
		currentUser.joinedChannels = currentUser.joinedChannels || [];
	
		const userDocRef = this.fireStore.collection<User>('users').doc(currentUser.uid);
		const channelDocRef = this.fireStore.collection<ChatChannel>('game-channels').doc<ChannelInfo>(title);
	
		const [userDoc, channelDoc] = await Promise.all([
			userDocRef.get().toPromise(),
			channelDocRef.get().toPromise()
		]);
	
		if (userDoc?.exists) {
			const userData = userDoc.data() as User;
			const joinedChannels = userData.joinedChannels || [];
			const userChannel = joinedChannels.find((channel) => channel.title === title);
			if (!userChannel) {
				joinedChannels.unshift({ title, lastMessageSeen: null } as UserChannel);
				await userDocRef.update({ joinedChannels });
			}
		} 

		if (channelDoc?.exists) {
			const channelData = channelDoc.data() as ChannelInfo;
			const existingMembers = channelData.members || [];
			if (!existingMembers.includes(currentUser.username)) {
				await channelDocRef.update({
					members: [...existingMembers, currentUser.username],
				});
			}
			if (!isOrganisator) {
				this.sendChat(
					currentUser.username,
					`${currentUser.username} a rejoint la partie.`,
					title,
					undefined,
					true
				);
			}
		}
	}
	

	async quitGameChannel(title: string, currentUser: User | null): Promise<void> {
		title = '*************' + title.trim();
		if (!currentUser || !title) return;
	
		const userDocRef = this.fireStore.collection<User>('users').doc(currentUser.uid);
		const channelDocRef = this.fireStore.collection<ChatChannel>('game-channels').doc<ChannelInfo>(title);
	
		const [userDoc, channelDoc] = await Promise.all([
			userDocRef.get().toPromise(),
			channelDocRef.get().toPromise(),
		]);
	
		if (userDoc?.exists) {
			const userData = userDoc.data() as User;
			const joinedChannels = userData.joinedChannels || [];
			const channelIndex = joinedChannels.findIndex((channel) => channel.title === title);
	
			if (channelIndex !== -1) {
				joinedChannels.splice(channelIndex, 1);
	
				await userDocRef.update({ joinedChannels });
			}
		} 
	
		if (channelDoc?.exists) {
			const channelData = channelDoc.data() as ChannelInfo;
			const existingMembers = channelData.members || [];
			const updatedMembers = existingMembers.filter((member) => member !== currentUser.username);
	
			if (updatedMembers.length !== existingMembers.length) {
				await channelDocRef.update({ members: updatedMembers });
	
				this.sendChat(
					currentUser.username,
					`${currentUser.username} a quitté la partie.`,
					title,
					undefined,
					true
				);
			}
		} 
	}
	

	async deleteGameChannel(title: string): Promise<void> {
		title = '*************' + title.trim();
		this.fireStore.collection('game-channels').doc(title).delete();
	}
}
