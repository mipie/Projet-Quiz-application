import { Injectable, inject } from '@angular/core';
import { Message } from '@app/interfaces/message/message';
import { SocketsService } from '@app/services/sockets/sockets.service';
import { RoomService } from './room.service';

@Injectable({
    providedIn: 'root',
})
export class ChatService {
    private static messages: Message[] = [];
    private socketService: SocketsService = inject(SocketsService);
    private roomService: RoomService = inject(RoomService);

    get allChats(): Message[] {
        return ChatService.messages;
    }

    get name(): string {
        return this.roomService.name;
    }

    sendMessage(messageInput: string): void {
        const message = new Message();
        message.author = 'Moi';
        message.sentTime = new Date().toLocaleTimeString();
        message.chatMessage = messageInput;
        this.socketService.send('message', { name: this.name, message: messageInput });
        ChatService.messages.unshift(message);
    }

    getMessage(): void {
        this.socketService.on('newMessage', (data: { author: string; chatMessage: string }) => {
            const message = new Message();
            message.author = data.author;
            message.sentTime = new Date().toLocaleTimeString();
            message.chatMessage = data.chatMessage;
            ChatService.messages.unshift(message);
        });
    }

    resetMessages(): void {
        ChatService.messages = [];
    }
}
