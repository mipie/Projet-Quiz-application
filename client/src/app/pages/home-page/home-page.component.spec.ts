/* eslint-disable @typescript-eslint/no-explicit-any */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HomePageComponent } from './home-page.component';
import { Router } from '@angular/router';
import { DialogsService } from '@app/services/dialog/dialogs.service';
import { ChatService } from '@app/services/room-game/chat.service';
import { RoomService } from '@app/services/room-game/room.service';
import { SocketsService } from '@app/services/sockets/sockets.service';
import { NO_ERRORS_SCHEMA, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { SoundService } from '@app/services/sound/sound.service';
import { Game } from '@app/interfaces/game/game';
import { CurrentGameService } from '@app/services/room-game/current-game.service';

describe('HomePageComponent', () => {
    let component: HomePageComponent;
    let fixture: ComponentFixture<HomePageComponent>;
    let router: Router;
    let dialogsService: jasmine.SpyObj<DialogsService>;
    let socketsService: jasmine.SpyObj<SocketsService>;
    let roomService: jasmine.SpyObj<RoomService>;
    let chatService: jasmine.SpyObj<ChatService>;
    let songspyService: SoundService;
    let currentGameService: CurrentGameService;

    beforeEach(() => {
        const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
        const dialogsServiceSpy = jasmine.createSpyObj('DialogsService', ['openJoinGame', 'openRedirectHome']);
        const socketsServiceSpy = jasmine.createSpyObj('socketsService', ['connect', 'disconnect', 'on', 'send', 'isSocketAlive']);
        const roomServiceSpy = jasmine.createSpyObj('RoomService', ['verifyRoomCode']);
        const chatServiceSpy = jasmine.createSpyObj('ChatService', ['resetMessages']);

        TestBed.configureTestingModule({
            declarations: [HomePageComponent],
            providers: [
                { provide: Router, useValue: routerSpy },
                { provide: RoomService, useValue: roomServiceSpy },
                { provide: SocketsService, useValue: socketsServiceSpy },
                { provide: DialogsService, useValue: dialogsServiceSpy },
                { provide: ChatService, useValue: chatServiceSpy },
                SoundService,
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
        });

        fixture = TestBed.createComponent(HomePageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        router = TestBed.inject(Router);
        roomService = TestBed.inject(RoomService);
        socketsService = TestBed.inject(SocketsService) as jasmine.SpyObj<SocketsService>;
        dialogsService = TestBed.inject(DialogsService) as jasmine.SpyObj<DialogsService>;
        chatService = TestBed.inject(ChatService) as jasmine.SpyObj<ChatService>;
        songspyService = TestBed.inject(SoundService);
        currentGameService = TestBed.inject(CurrentGameService);

        spyOn(songspyService, 'buttonClick').and.returnValue();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should verify room code', () => {
        const response = { verified: true };
        socketsService.on.and.callFake((event, callback) => callback(response as any));
        component['verifyRoomCode']();
        expect(socketsService.on).toHaveBeenCalledWith('verifiedCode', jasmine.any(Function));
        expect(component['room'].isHost).toBe(false);
    });

    it('should not verify room code if response is null', () => {
        const response = null;
        spyOn(component as any, 'openLockedRoom');
        socketsService.on.and.callFake((event, callback) => callback(response as any));
        component['verifyRoomCode']();
        expect(socketsService.on).toHaveBeenCalledWith('verifiedCode', jasmine.any(Function));
        expect(component['openLockedRoom']).toHaveBeenCalledWith("La salle n'existe pas.");
    });

    it('should not verify room code if response is false', () => {
        const response = false;
        spyOn(component as any, 'openLockedRoom');
        socketsService.on.and.callFake((event, callback) => callback(response as any));
        component['verifyRoomCode']();
        expect(socketsService.on).toHaveBeenCalledWith('verifiedCode', jasmine.any(Function));
        expect(component['openLockedRoom']).toHaveBeenCalledWith("La salle a été verrouillée par l'organisateur.");
    });

    it('should verify name', () => {
        component['inputName'] = 'test';
        spyOn(component as any, 'enterRoom');
        component['verifyName']();
        expect(component['enterRoom']).toHaveBeenCalled();
    });

    it('should not verify name if inputName is empty', () => {
        component['inputName'] = '';
        spyOn(component as any, 'openLockedRoom');
        component['verifyName']();
        expect(component['openLockedRoom']).toHaveBeenCalledWith('Le nom ne doit pas être vide.');
    });

    it("should call resetMessages, revive socket and verify room's code on ngOnInit", () => {
        socketsService.isSocketAlive.and.returnValue(true);

        const verifyRoomCodeSpy = spyOn(component as any, 'verifyRoomCode').and.stub();
        component.ngOnInit();

        expect(chatService.resetMessages).toHaveBeenCalled();
        expect(socketsService.disconnect).toHaveBeenCalled();
        expect(socketsService.connect).toHaveBeenCalled();
        expect(verifyRoomCodeSpy).toHaveBeenCalled();
    });

    it('should open locked room dialog', async () => {
        dialogsService.openRedirectHome.and.returnValue(Promise.resolve(true));
        component['openLockedRoom']("La salle a été verrouillée par l'organisateur ou n'existe pas.");
        expect(dialogsService.openRedirectHome).toHaveBeenCalledWith("La salle a été verrouillée par l'organisateur ou n'existe pas.", 'OK!');
    });

    it("should navigate to 'join' and set the room's code if response is true", () => {
        socketsService.on.and.callFake((event, callback) => {
            if (event === 'verifiedCode') {
                callback(true as any);
            }
            if (event === 'nameAdd') {
                callback(true as any);
            }
        });

        component['inputName'] = 'test';
        component['verifyRoomCode']();
        component['verifyName']();

        expect(roomService.code).toEqual(component['roomCode']);
        expect(router.navigate).toHaveBeenCalledWith(['host']);
    });

    it('should call soundService.buttonClick on clickedButton', () => {
        component.clickedButton();
        expect(songspyService.buttonClick).toHaveBeenCalled();
    });

    it('should navigate to "home" and open a dialog if response is false', () => {
        socketsService.on.and.callFake((event, callback) => {
            if (['verifiedCode', 'roomIsLocked'].includes(event)) {
                callback(false as any);
            }
        });

        const openLockedRoomSpy = spyOn(component as any, 'openLockedRoom').and.stub();
        component['verifyRoomCode']();

        expect(openLockedRoomSpy).toHaveBeenCalled();
    });

    it('should open join game dialog and verify room', async () => {
        const response = { code: '1234', name: 'test' };
        dialogsService.openJoinGame.and.returnValue(Promise.resolve(response));
        spyOn(component, 'clickedButton');
        spyOn(component as any, 'openLockedRoom');
        socketsService.send.and.returnValue(await Promise.resolve(response as any));

        await component.openJoinGame();

        expect(component.clickedButton).toHaveBeenCalled();
        expect(dialogsService.openJoinGame).toHaveBeenCalled();
        expect(socketsService.send).toHaveBeenCalledWith('verifyRoom', response.code);
        expect(component['roomCode']).toEqual(response.code);
        expect(component['inputName']).toEqual(response.name);
        expect(component['openLockedRoom']).not.toHaveBeenCalled();
    });

    it('should call openLockedRoom if roomCode is empty', async () => {
        const response = { code: '', name: 'test' };
        dialogsService.openJoinGame.and.returnValue(Promise.resolve(response));
        spyOn(component as any, 'openLockedRoom');

        await component.openJoinGame();

        expect(component['openLockedRoom']).toHaveBeenCalledWith('Le code de la salle ne peut pas être vide.');
    });

    it('should set game when receiveId event is emitted', () => {
        const game: Game = new Game();
        socketsService.on.and.callFake((event: string, callback: (data: any) => void) => {
            if (event === 'receiveId') {
                callback(game);
            }
        });

        spyOn(currentGameService, 'setGame');

        component['enterRoom']();

        expect(socketsService.on).toHaveBeenCalledWith('receiveId', jasmine.any(Function));
        expect(currentGameService.setGame).toHaveBeenCalledWith(game);
    });

    it('should call openLockedRoom and ngOnInit when nameAdd event is emitted with false', () => {
        const socketsServiceSpy = jasmine.createSpyObj('SocketsService', ['send', 'on']);
        socketsServiceSpy.on.and.callFake((event: string, callback: (data: any) => void) => {
            if (event === 'nameAdd') {
                callback(false);
            }
        });
        component['socketUsers'] = socketsServiceSpy;

        spyOn(component as any, 'openLockedRoom');
        spyOn(component, 'ngOnInit');

        component['enterRoom']();

        expect(socketsServiceSpy.on).toHaveBeenCalledWith('nameAdd', jasmine.any(Function));
        expect(component['openLockedRoom']).toHaveBeenCalledWith("Le nom a été utilisé par un autre utilisateur ou banni par l'organisateur.");
        expect(component.ngOnInit).toHaveBeenCalled();
    });

    it('should return early when dialogs.openJoinGame resolves to undefined', async () => {
        const dialogsSpy = jasmine.createSpyObj('Dialogs', ['openJoinGame']);
        dialogsSpy.openJoinGame.and.resolveTo(undefined);
        component['dialogs'] = dialogsSpy;

        const socketUsersSpy = jasmine.createSpyObj('SocketsService', ['send']);
        component['socketUsers'] = socketUsersSpy;

        spyOn(component, 'clickedButton');

        await component['openJoinGame']();

        expect(component.clickedButton).toHaveBeenCalled();
        expect(dialogsSpy.openJoinGame).toHaveBeenCalled();
        expect(socketUsersSpy.send).not.toHaveBeenCalled();
    });
});
