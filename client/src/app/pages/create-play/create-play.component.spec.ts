/* eslint-disable @typescript-eslint/no-explicit-any */
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { GameDetails } from '@app/interfaces/gameDetails/game-details';
import { DialogsService } from '@app/services/dialog/dialogs.service';
import { GameDataService } from '@app/services/games/game-data.service';
import { SharedIdService } from '@app/services/id/shared-id.service';
import { RoomService } from '@app/services/room-game/room.service';
import { SocketsService } from '@app/services/sockets/sockets.service';
import { SoundService } from '@app/services/sound/sound.service';
import { of } from 'rxjs';
import { CreatePlayComponent } from './create-play.component';

describe('CreatePlayComponent', () => {
    let component: CreatePlayComponent;
    let fixture: ComponentFixture<CreatePlayComponent>;
    let gameDataServiceSpy: jasmine.SpyObj<GameDataService>;
    let roomServiceSpy: jasmine.SpyObj<RoomService>;
    let socketsServiceSpy: jasmine.SpyObj<SocketsService>;
    let dialogsServiceSpy: jasmine.SpyObj<DialogsService>;
    let routerSpy: jasmine.SpyObj<Router>;
    let soundServiceSpy: jasmine.SpyObj<SoundService>;
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
        gameDataServiceSpy = jasmine.createSpyObj('GameDataService', ['getData']);
        roomServiceSpy = jasmine.createSpyObj('RoomService', ['createRoom']);
        socketsServiceSpy = jasmine.createSpyObj('SocketsService', ['isSocketAlive', 'connect', 'disconnect', 'send', 'on']);
        dialogsServiceSpy = jasmine.createSpyObj('DialogsService', ['openAlertDialog']);
        routerSpy = jasmine.createSpyObj('Router', ['navigate']);
        soundServiceSpy = jasmine.createSpyObj('SoundService', ['buttonClick']);

        await TestBed.configureTestingModule({
            imports: [RouterTestingModule],
            declarations: [CreatePlayComponent],
            providers: [
                { provide: GameDataService, useValue: gameDataServiceSpy },
                { provide: RoomService, useValue: roomServiceSpy },
                { provide: SocketsService, useValue: socketsServiceSpy },
                { provide: DialogsService, useValue: dialogsServiceSpy },
                { provide: Router, useValue: routerSpy },
                { provide: SoundService, useValue: soundServiceSpy },
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
        }).compileComponents();

        fixture = TestBed.createComponent(CreatePlayComponent);
        component = fixture.componentInstance;
        gameDataServiceSpy.getData.and.returnValue(of([mockGameJSON]));
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should re/connect socket and get data on init', () => {
        socketsServiceSpy.isSocketAlive.and.returnValue(true);
        gameDataServiceSpy.getData.and.returnValue(of([mockGameJSON]));
        component.ngOnInit();
        expect(socketsServiceSpy.disconnect).toHaveBeenCalled();
        expect(socketsServiceSpy.connect).toHaveBeenCalled();
        expect(gameDataServiceSpy.getData).toHaveBeenCalled();
        expect(component.data).toEqual([mockGameJSON]);
        expect(component.gameActive).not.toContain(true);
    });

    describe('ableOptions', () => {
        it('should call changeGameActive and assign id if undefined', () => {
            spyOn(component as any, 'changeGameActive').and.stub();
            const expectedId = 1;
            const expectedIndex = 1;
            component.ableOptions(expectedId, expectedIndex);
            expect(component['changeGameActive']).toHaveBeenCalledOnceWith(expectedIndex);
            expect(component['id']).toEqual(expectedId);
        });

        it('should call changeGameActive and assign id corresponding game is the one selected', () => {
            spyOn(component as any, 'changeGameActive').and.stub();
            const expectedId = 1;
            const expectedIndex = 0;
            component['id'] = 0;
            component.gameActive[expectedIndex] = true;
            component.ableOptions(expectedId, expectedIndex);
            expect(component['id']).toEqual(expectedId);
        });
    });

    describe('navigateTo', () => {
        it('should not navigate if game doesnt exist', () => {
            spyOn(component, 'ngOnInit').and.stub();
            component['id'] = 1;
            component.navigateTo('host');
            expect(dialogsServiceSpy.openAlertDialog).toHaveBeenCalledWith("Ce jeu n'est plus disponible. Veuillez en choisir un autre.");
            expect(component.ngOnInit).toHaveBeenCalled();
        });

        it('should create room if navigating to host and make a sound effect', fakeAsync(() => {
            spyOn(component as any, 'createRoom').and.stub();
            spyOn(component, 'clickedButton').and.stub();
            component['id'] = 0;
            component.navigateTo('host');
            tick();
            expect(roomServiceSpy.isHost).toBeTrue();
            expect(component['createRoom']).toHaveBeenCalled();
            expect(component.clickedButton).toHaveBeenCalled();
            expect(routerSpy.navigate).toHaveBeenCalledWith(['host']);
        }));
    });

    it('should make a sound when button is clicked', () => {
        component.clickedButton();
        expect(soundServiceSpy.buttonClick).toHaveBeenCalled();
    });

    it("should createRoom and receive the room's code", () => {
        // eslint-disable-next-line @typescript-eslint/ban-types
        socketsServiceSpy.on.and.callFake((command: string, callback: Function) => {
            if (command === 'gameCreate') {
                callback('test');
            }
        });
        component['createRoom']();
        expect(socketsServiceSpy.send).toHaveBeenCalledWith('createRoom', SharedIdService.id);
        expect(roomServiceSpy.code).toEqual('test');
    });

    it('should changeGameActive with gameActive array to be all false', () => {
        component.gameActive = [false, false];
        component['changeGameActive'](0);
        expect(component['gameActive'][0]).toBeTrue();
    });

    it('should changeGameActive with gameActive true', () => {
        component.gameActive = [true, false];
        component['changeGameActive'](0);
        expect(component['gameActive'][0]).toBeFalse();
    });
});
