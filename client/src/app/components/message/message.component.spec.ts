import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { MessageComponent } from './message.component';
import { DialogsService } from '@app/services/dialog/dialogs.service';
import { ChatService } from '@app/services/room-game/chat.service';
import { SocketsService } from '@app/services/sockets/sockets.service';
import { MAX_TEXT_COUNT } from '@app/constants';
import { MatDialogModule } from '@angular/material/dialog';
import { Message } from '@app/interfaces/message/message';
import { of } from 'rxjs';
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '@angular/core';
import { SoundService } from '@app/services/sound/sound.service';

describe('MessageComponent', () => {
    let component: MessageComponent;
    let fixture: ComponentFixture<MessageComponent>;
    let dialogsService: DialogsService;
    let chatService: ChatService;
    let mockSocketsService: jasmine.SpyObj<SocketsService>;
    let songspyService: jasmine.SpyObj<SoundService>;

    beforeEach(async () => {
        mockSocketsService = jasmine.createSpyObj('SocketsService', ['send', 'on', 'disconnect']);
        songspyService = jasmine.createSpyObj('SoundService', ['buttonClick']);
        await TestBed.configureTestingModule({
            imports: [RouterTestingModule, MatDialogModule],
            declarations: [MessageComponent],
            providers: [
                DialogsService,
                ChatService,
                SocketsService,
                { provide: SocketsService, useValue: mockSocketsService },
                { provide: SoundService, useValue: songspyService },
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
        }).compileComponents();
        fixture = TestBed.createComponent(MessageComponent);
        component = fixture.componentInstance;
        dialogsService = TestBed.inject(DialogsService);
        chatService = TestBed.inject(ChatService);
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should initialize messages from chat service', async () => {
        const mockMessages: Message[] = [{ author: 'Moi', sentTime: '9:50:12 PM', chatMessage: 'Hi, its me!' }];
        const observable = of(mockMessages);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        spyOn(chatService, 'getMessage').and.returnValue(observable as any);

        // eslint-disable-next-line @typescript-eslint/ban-types
        mockSocketsService.on.and.callFake((event: string, callback: Function) => {
            if (event === 'isMute') {
                callback(true);
            }
        });
        component.ngOnInit();
        component.messages = mockMessages;

        fixture.whenStable().then(() => {
            expect(component.messages[0]).toEqual(mockMessages[0]);
        });
    });

    it('should update remaining text count on value change', () => {
        const mockValue = 'Hello, World!';
        component.valueChange(mockValue);
        expect(component.remainingTextCount).toBe(MAX_TEXT_COUNT - mockValue.length);
    });

    it('should send message on submit', () => {
        const mockMessage = 'Hello, World!';
        spyOn(chatService, 'sendMessage');
        component.messageInput = mockMessage;
        component.onSubmit();
        expect(chatService.sendMessage).toHaveBeenCalledWith(mockMessage);
        expect(component.messageInput).toBe('');
    });

    it('should open abandon dialog and navigate to home on confirmation', async () => {
        spyOn(dialogsService, 'openGiveUp').and.returnValue(Promise.resolve(true));
        spyOn(component['router'], 'navigate');
        await component.openAbandonDialog();
        expect(dialogsService.openGiveUp).toHaveBeenCalled();
        expect(mockSocketsService.send).toHaveBeenCalledWith('giveUp');
        expect(component['router'].navigate).toHaveBeenCalledWith(['home']);
        expect(mockSocketsService.disconnect).toHaveBeenCalled();
    });

    it('should open abandon dialog and not navigate to home on cancellation', async () => {
        spyOn(dialogsService, 'openGiveUp').and.returnValue(Promise.resolve(false));
        spyOn(component['router'], 'navigate');
        await component.openAbandonDialog();
        expect(dialogsService.openGiveUp).toHaveBeenCalled();
        expect(mockSocketsService.send).not.toHaveBeenCalled();
        expect(component['router'].navigate).not.toHaveBeenCalled();
        expect(mockSocketsService.disconnect).not.toHaveBeenCalled();
    });

    it('should quit game on confirmation', async () => {
        spyOn(dialogsService, 'openGiveUp').and.returnValue(Promise.resolve(true));
        await component.quitGame();
        expect(dialogsService.openGiveUp).toHaveBeenCalled();
        expect(mockSocketsService.send).toHaveBeenCalledWith('quitGame');
    });

    it('should not quit game on cancellation', async () => {
        spyOn(dialogsService, 'openGiveUp').and.returnValue(Promise.resolve(false));
        await component.quitGame();
        expect(dialogsService.openGiveUp).toHaveBeenCalled();
        expect(mockSocketsService.send).not.toHaveBeenCalled();
    });

    it('should call soundService.buttonClick on clickedButton', () => {
        component.buttonClick();
        expect(songspyService.buttonClick).toHaveBeenCalled();
    });
});
