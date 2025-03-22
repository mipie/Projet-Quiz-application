/* eslint-disable max-lines */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { GameDetails } from '@app/interfaces/gameDetails/game-details';
import { DialogsService } from '@app/services/dialog/dialogs.service';
import { GameDataService } from '@app/services/games/game-data.service';
import { SharedIdService } from '@app/services/id/shared-id.service';
import { ChatService } from '@app/services/room-game/chat.service';
import { CurrentGameService } from '@app/services/room-game/current-game.service';
import { RoomService } from '@app/services/room-game/room.service';
import { SocketsService } from '@app/services/sockets/sockets.service';
import { SoundService } from '@app/services/sound/sound.service';
import { of } from 'rxjs';
import { HostGameComponent } from './host-game.component';
import { MatchDataService } from '@app/services/matches/match-data.service';
import { Match } from '@app/interfaces/match/match';

describe('HostGameComponent', () => {
    let component: HostGameComponent;
    let fixture: ComponentFixture<HostGameComponent>;
    let mockGameDataService: jasmine.SpyObj<GameDataService>;
    let mockRouter: jasmine.SpyObj<Router>;
    let mockDialogs: jasmine.SpyObj<DialogsService>;
    let mockCurrentGameService: jasmine.SpyObj<CurrentGameService>;
    let mockChatService: jasmine.SpyObj<ChatService>;
    let mockRoomService: jasmine.SpyObj<RoomService>;
    let mockSocketsService: jasmine.SpyObj<SocketsService>;
    let songspyService: SoundService;
    const mockGameJSON: GameDetails = {
        id: 0,
        isVisible: true,
        isChecked: true,
        game: {
            title: '',
            $schema: '',
            description: '',
            duration: 10,
            lastModification: new Date(),
            questions: [
                {
                    id: 0,
                    type: 'QCM',
                    text: '',
                    choices: [
                        {
                            id: 0,
                            text: '',
                            isCorrect: true,
                        },
                    ],
                    points: 10,
                },
                {
                    id: 1,
                    type: 'QCM',
                    text: '',
                    choices: [
                        {
                            id: 0,
                            text: '',
                            isCorrect: true,
                        },
                    ],
                    points: 10,
                },
            ],
        },
    };

    beforeEach(async () => {
        mockGameDataService = jasmine.createSpyObj('GameDataService', ['getGameById']);
        mockRouter = jasmine.createSpyObj('Router', ['navigate']);
        mockDialogs = jasmine.createSpyObj('DialogsService', ['openRedirectHome', 'openRedirectionDialog', 'openGiveUp']);
        mockCurrentGameService = jasmine.createSpyObj('CurrentGameService', ['setGame', 'isGameDone']);
        mockChatService = jasmine.createSpyObj('ChatService', ['getMessage']);
        mockRoomService = jasmine.createSpyObj('RoomService', ['isHost']);
        mockSocketsService = jasmine.createSpyObj('SocketsService', ['send', 'on']);

        TestBed.configureTestingModule({
            declarations: [HostGameComponent],
            providers: [
                { provide: GameDataService, useValue: mockGameDataService },
                { provide: Router, useValue: mockRouter },
                { provide: DialogsService, useValue: mockDialogs },
                { provide: CurrentGameService, useValue: mockCurrentGameService },
                { provide: ChatService, useValue: mockChatService },
                { provide: RoomService, useValue: mockRoomService },
                { provide: SocketsService, useValue: mockSocketsService },
                SoundService,
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
        }).compileComponents();

        fixture = TestBed.createComponent(HostGameComponent);
        songspyService = TestBed.inject(SoundService);
        spyOn(songspyService, 'buttonClick').and.returnValue();
        component = fixture.componentInstance;
        mockGameDataService.getGameById.and.returnValue(of(mockGameJSON));
        fixture.detectChanges();

        // eslint-disable-next-line @typescript-eslint/ban-types
        mockSocketsService.on.and.callFake((event: string, callback: Function) => {
            switch (event) {
                case 'viewToHome':
                    callback(false);
                    break;
                case 'gotBanned':
                    callback();
                    break;
                case 'lockToggled':
                    callback(false);
                    break;
            }
        });
    });

    describe('simple functions', () => {
        it('should create', () => {
            expect(component).toBeTruthy();
        });

        it('should ban player', fakeAsync(() => {
            component.players = ['test'];
            const playerNameToBan = 'test';
            let asyncOperationCompleted = false;
            mockSocketsService.send.and.callFake((command, data) => {
                if (command === 'playerBan' && data === playerNameToBan) {
                    component.bannedNames.push(playerNameToBan);
                    asyncOperationCompleted = true;
                }
            });
            component.banPlayer(0);
            tick();
            expect(asyncOperationCompleted).toBeTrue();
            expect(component.bannedNames).toContain(playerNameToBan);
        }));

        it('should toggle lock', () => {
            component.code = 'test';
            component.isRoomLocked = false;
            mockSocketsService.send.and.callFake((command, data?: any) => {
                const typedData = data as { roomCode?: string; lockState?: boolean };
                if (
                    command === 'emitToggleLock' &&
                    typedData &&
                    component.code === typedData.roomCode &&
                    typeof typedData.lockState !== 'undefined'
                ) {
                    component.isRoomLocked = typedData.lockState;
                }
            });

            component.toggleLock();

            expect(mockSocketsService.send).toHaveBeenCalledWith('emitToggleLock', { roomCode: component.code, lockState: true });
            expect(component.isRoomLocked).toBeTrue();
        });

        it('should begin game', () => {
            component.time = 6;
            component.disable = true;
            mockSocketsService.send.and.callFake((command, data) => {
                if (command === 'startTimer' && (data as any).startValue === component.time && (data as any).roomName === component.code) {
                    component.disable = false;
                }
            });
            component.organizerBegin();
            expect(component.disable).toBeFalse();
        });

        it('should quit game', async () => {
            mockDialogs.openGiveUp.and.returnValue(true as unknown as Promise<boolean>);
            await component.quitGame();
            expect(mockSocketsService.send).toHaveBeenCalledWith('quitGame');
        });

        it('should set up data of match to save later', async () => {
            const expectedMatch = new Match();
            expectedMatch.title = mockCurrentGameService.title;
            expectedMatch.startDate = new Date();
            expectedMatch.numberPlayers = component.players.length - 1;
            component['setUpMatchHistory']();
            expect(MatchDataService.currentMatch).toEqual(expectedMatch);
        });
    });

    describe('getTime', () => {
        it('should get time', fakeAsync(() => {
            component['getTime']();
            expect(mockSocketsService.on).toHaveBeenCalledWith('timer', jasmine.any(Function));
        }));

        it('should listen to timer message from socketsService and update time', () => {
            spyOn(component as any, 'beginGame');
            mockCurrentGameService.isGameDone = false;
            // eslint-disable-next-line @typescript-eslint/ban-types
            mockSocketsService.on.and.callFake((command: string, callback: Function) => {
                if (command === 'timer') {
                    callback({ time: 0, pauseState: false, panicState: false });
                }
            });

            component['getTime']();
            mockSocketsService.on.calls.mostRecent().args[1]({ time: 0, pauseState: false, panicState: false });

            expect(component.time).toEqual(0);
            expect(component.isGameBegin).toBeTrue();
            expect(component['beginGame']).toHaveBeenCalled();
        });
    });

    describe('getAllUsers', () => {
        it('should get all users', fakeAsync(() => {
            component.players = [];
            const players = ['test1', 'test2'];
            const playersBanned = ['test3', 'test4'];
            mockSocketsService.on.and.callFake((command: string) => {
                if (command === 'getUsers') {
                    component.players = players;
                } else if (command === 'getBanned') {
                    component.bannedNames = playersBanned;
                }
            });
            component['getAllUsers']();
            tick();
            expect(component.players).toEqual(players);
            expect(component.bannedNames).toEqual(playersBanned);
            expect(mockSocketsService.send).toHaveBeenCalledWith('uploadNames', '');
        }));

        it('should listen to getBanned message from socketUsers and update bannedNames array', () => {
            // eslint-disable-next-line @typescript-eslint/ban-types
            mockSocketsService.on.and.callFake((command: string, callback: Function) => {
                if (command === 'getBanned') {
                    callback(['test1', 'test2']);
                }
            });
            component['getAllUsers']();
            expect(component.bannedNames).toEqual(['test1', 'test2']);
        });

        it('should listen to getUsers message from socketUsers and update players array', () => {
            // eslint-disable-next-line @typescript-eslint/ban-types
            mockSocketsService.on.and.callFake((command: string, callback: Function) => {
                if (command === 'getUsers') {
                    callback([]);
                }
            });
            component.isRoomLocked = true;
            component['getAllUsers']();
            expect(component.players).toEqual([]);
            expect(mockSocketsService.send).toHaveBeenCalledWith('emitToggleLock');
        });
    });

    describe('beginGame', () => {
        beforeEach(() => {
            spyOn(component as any, 'setUpMatchHistory').and.stub();
        });

        it('should begin game', () => {
            mockRoomService.isHost = true;
            component['beginGame']();
            expect(mockSocketsService.send).toHaveBeenCalledWith('beginGame', '');
            expect(mockSocketsService.send).toHaveBeenCalledWith('stopTimer');
            expect(mockSocketsService.on).toHaveBeenCalledWith('goToViews', jasmine.any(Function));
        });

        it('should listen to goToViews event from socketUsers and redirect to organizer page', () => {
            // eslint-disable-next-line @typescript-eslint/ban-types
            mockSocketsService.on.and.callFake((command: string, callback: Function) => {
                if (command === 'goToViews') {
                    callback(true);
                }
            });
            component['beginGame']();
            expect(mockRouter.navigate).toHaveBeenCalledWith(['organizer']);
        });

        it('should listen to goToViews event from socketUsers and redirect to game page', () => {
            // eslint-disable-next-line @typescript-eslint/ban-types
            mockSocketsService.on.and.callFake((command: string, callback: Function) => {
                if (command === 'goToViews') {
                    callback(false);
                }
            });
            component['beginGame']();
            expect(mockRouter.navigate).toHaveBeenCalledWith(['game']);
        });
    });

    describe('ngOnInit', () => {
        beforeEach(() => {
            spyOn(component as any, 'getAllUsers').and.stub();
            spyOn(component as any, 'waitAnswer').and.stub();
            spyOn(component as any, 'getTime').and.stub();
            spyOn(component as any, 'windowInteraction').and.stub();
        });

        it('should give code in the ngOnInit', () => {
            mockRoomService.code = 'test';
            component.ngOnInit();
            expect(component.code).toEqual('test');
        });

        it('should setGame in OnInit', () => {
            mockRoomService.code = 'test';
            SharedIdService.id = 1;
            mockRoomService.isHost = true;
            component.ngOnInit();
            expect(mockCurrentGameService.setGame).toHaveBeenCalled();
        });
    });

    describe('windowInteraction', () => {
        it('should socket send reloadGame', () => {
            const event = new Event('popstate');
            spyOn(window, 'addEventListener').and.callThrough();
            component['windowInteraction']();
            window.dispatchEvent(event);
            expect(mockRoomService.code).toEqual('');
            expect(mockSocketsService.send).toHaveBeenCalledWith('reloadGame');
        });

        it('should socket send reloadGame', () => {
            const event = new Event('beforeunload');
            spyOn(window, 'addEventListener').and.callThrough();
            window.onbeforeunload = null;
            component['windowInteraction']();
            window.dispatchEvent(event);
            expect(mockSocketsService.send).toHaveBeenCalledWith('reloadGame');
        });
    });

    describe('waitAnswer', () => {
        it('should wait for answer', () => {
            component['waitAnswer']();
            expect(mockSocketsService.on).toHaveBeenCalledWith('gotBanned', jasmine.any(Function));
            expect(mockSocketsService.on).toHaveBeenCalledWith('viewToHome', jasmine.any(Function));
            expect(mockSocketsService.on).toHaveBeenCalledWith('lockToggled', jasmine.any(Function));
        });

        it('should listen to gotBanned message from socketUsers and update bannedNames array', () => {
            // eslint-disable-next-line @typescript-eslint/ban-types
            mockSocketsService.on.and.callFake((command: string, callback: Function) => {
                if (command === 'gotBanned') {
                    callback();
                }
            });
            component['waitAnswer']();
            expect(mockDialogs.openRedirectHome).toHaveBeenCalledWith("Vous avez été banni(e) par l'organisateur!", 'OK!');
        });

        it('should handle viewToHome event when hasOrgQuit is false', async () => {
            mockRouter.navigate.and.returnValue(Promise.resolve(true));

            component['waitAnswer']();
            mockSocketsService.on.calls.argsFor(1)[1](false);

            expect(mockRouter.navigate).toHaveBeenCalledWith(['home']);
        });

        it('should handle viewToHome event when hasOrgQuit is true and isOrganizer is true', async () => {
            mockRouter.navigate.and.returnValue(Promise.resolve(true));
            // eslint-disable-next-line @typescript-eslint/ban-types
            mockSocketsService.on.and.callFake((command: string, callback: Function) => {
                if (command === 'viewToHome') {
                    callback(true);
                }
            });
            Object.defineProperty(component, 'isOrganizer', { value: true });

            component['waitAnswer']();

            expect(mockRouter.navigate).toHaveBeenCalledWith(['createPlay']);
        });

        it('should handle viewToHome event when hasOrgQuit is true and isOrganizer is false', async () => {
            mockDialogs.openRedirectHome.and.returnValue(Promise.resolve(true));
            // eslint-disable-next-line @typescript-eslint/ban-types
            mockSocketsService.on.and.callFake((command: string, callback: Function) => {
                if (command === 'viewToHome') {
                    callback(true);
                }
            });
            Object.defineProperty(component, 'isOrganizer', { value: false });

            component['waitAnswer']();

            expect(mockDialogs.openRedirectHome).toHaveBeenCalledWith("L'organisateur a quitté la partie.", 'OK!');
        });

        it('should handle lockToggled event', () => {
            // eslint-disable-next-line @typescript-eslint/ban-types
            mockSocketsService.on.and.callFake((command: string, callback: Function) => {
                if (command === 'lockToggled') {
                    callback(true);
                }
            });
            component['waitAnswer']();
            mockSocketsService.on.calls.argsFor(2)[1](true);

            expect(component.isRoomLocked).toBeTrue();
        });
    });

    it('should play sound for a button clicked', () => {
        component.buttonClick();
        expect(songspyService.buttonClick).toHaveBeenCalled();
    });
});
