import { Timestamp } from '@angular/fire/firestore';

export interface ChatChannel {
    id: string;
    channelInfo: ChannelInfo;
}

export interface ChannelInfo {
    creator: string;
    title: string;
    usersId: string[];
    messages: Message[];
    members?: string[];
}

export class Message {
    username: string;
    message: string;
    time: Timestamp;
    fromAdmins: boolean = false;
    avatar: string | undefined;
}
