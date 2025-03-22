/* eslint-disable @typescript-eslint/no-explicit-any */
import { TestBed } from '@angular/core/testing';
import { ChatService } from './chat.service';
import { SocketsService } from '@app/services/sockets/sockets.service';
import { Message } from '@app/interfaces/message/message';
import { RoomService } from './room.service';

describe('ChatService', () => {
    let service: ChatService;
    let socketsService: jasmine.SpyObj<SocketsService>;
    let roomService: jasmine.SpyObj<RoomService>;
    const message = new Message({ author: 'Me', sentTime: '22:22:22', chatMessage: 'Hi, its me!' });

    beforeEach(() => {
        const socketsServiceSpy = jasmine.createSpyObj('SocketsService', ['on', 'send']);
        const roomServiceSpy = jasmine.createSpyObj('RoomService', ['name']);

        TestBed.configureTestingModule({
            providers: [
                { provide: SocketsService, useValue: socketsServiceSpy },
                { provide: RoomService, useValue: roomServiceSpy },
            ],
        });

        service = TestBed.inject(ChatService);
        socketsService = TestBed.inject(SocketsService) as jasmine.SpyObj<SocketsService>;
        roomService = TestBed.inject(RoomService) as jasmine.SpyObj<RoomService>;
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should return all chats of the conversation', () => {
        const expectedChats = [message];
        ChatService['messages'] = expectedChats;
        const actualChats = service.allChats;
        expect(actualChats).toEqual(expectedChats);
    });

    it("should return room's name", () => {
        const expectedName = roomService.name;
        const actualChats = service.name;
        expect(actualChats).toEqual(expectedName);
    });

    it("should send a chat and add it to the conversation with 'Moi' as author's name", () => {
        message.author = 'Moi';
        message.sentTime = new Date().toLocaleTimeString();

        service.sendMessage(message.chatMessage);

        expect(socketsService.send).toHaveBeenCalledWith('message', { name: service.name, message: message.chatMessage });
    });

    it('should reset chats list', () => {
        service.resetMessages();
        expect(service.allChats.length).toEqual(0);
    });

    it('should receive a chat and add it to front of chats list', () => {
        socketsService.on.and.callFake((event, callback) => {
            if (event === 'newMessage') {
                callback(message as any);
            }
        });
        message.sentTime = new Date().toLocaleTimeString();
        service.getMessage();
        expect(service.allChats[0]).toEqual(message);
    });
});
