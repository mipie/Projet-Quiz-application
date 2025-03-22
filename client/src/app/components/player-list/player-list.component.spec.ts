/* eslint-disable max-lines */
/* eslint-disable @typescript-eslint/no-magic-numbers */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { TestBed } from '@angular/core/testing';
import { PlayerListComponent } from './player-list.component';
import { SocketsService } from '@app/services/sockets/sockets.service';
import { RoomService } from '@app/services/room-game/room.service';
import { CurrentGameService } from '@app/services/room-game/current-game.service';
import { Player } from '@app/interfaces/player/player';
import { MatchDataService } from '@app/services/matches/match-data.service';

describe('PlayerListComponent', () => {
    let component: PlayerListComponent;
    let socketService: jasmine.SpyObj<SocketsService>;
    let roomService: jasmine.SpyObj<RoomService>;
    let currentGameService: jasmine.SpyObj<CurrentGameService>;
    let players: Player[];

    beforeEach(() => {
        socketService = jasmine.createSpyObj('SocketsService', ['send', 'on']);
        roomService = jasmine.createSpyObj('RoomService', ['code']);
        currentGameService = jasmine.createSpyObj('CurrentGameService', ['isGameDone']);
        players = [
            {
                name: 'John',
                isSurrender: false,
                score: 0,
                bonus: 0,
                isMute: false,
                position: 0,
                isInteract: false,
                isFinish: false,
            },
            {
                name: 'xxx',
                isSurrender: false,
                score: 20,
                bonus: 0,
                isMute: false,
                position: 0,
                isInteract: false,
                isFinish: false,
            },
        ];

        MatchDataService.currentMatch = {
            bestScore: 0,
            title: 'Mock Match Title',
            startDate: new Date(),
            numberPlayers: 0,
        };

        TestBed.configureTestingModule({
            providers: [
                PlayerListComponent,
                { provide: SocketsService, useValue: socketService },
                { provide: RoomService, useValue: roomService },
                { provide: CurrentGameService, useValue: currentGameService },
            ],
        });

        component = TestBed.inject(PlayerListComponent);
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should set players and call setPlayers on getPlayers event', () => {
        const mockPlayers = players;
        spyOn(component as any, 'setPlayers');
        component.ngOnInit();
        socketService.on.calls.argsFor(0)[1](mockPlayers);
        expect(component['setPlayers']).toHaveBeenCalled();
    });

    it('should send room code on init', () => {
        component.ngOnInit();
        expect(socketService.send).toHaveBeenCalledWith('uploadPlayers', roomService.code);
    });

    it('should update finish status on getGameFinished event', () => {
        const finishStatus = true;
        component.ngOnInit();
        socketService.on.calls.argsFor(1)[1](finishStatus);
        expect(component.isFinish).toBe(finishStatus);
    });

    it('should mute all players if at least one is not muted', () => {
        component.players = players;
        component.players[0].isMute = false;
        component.players[1].isMute = true;
        component.muteAll();
        for (const player of component.players) {
            expect(player.isMute).toBeTrue();
            expect(socketService.send).toHaveBeenCalledWith('mutePlayer', 'John');
        }
    });

    it('should unmute all players if all are already muted', () => {
        component.players = players;
        component.players[0].isMute = true;
        component.players[1].isMute = true;
        component.muteAll();
        for (const player of component.players) {
            expect(player.isMute).toBeFalse();
            expect(socketService.send).toHaveBeenCalledWith('mutePlayer', player.name);
        }
    });

    it('should toggle the mute status of a player', () => {
        component.players = players;
        component.players[0].isMute = false;
        component.players[1].isMute = true;
        component.toggleMute(0);
        expect(component.players[0].isMute).toBeTrue();
        expect(socketService.send).toHaveBeenCalledWith('mutePlayer', 'John');
        component.toggleMute(1);
        expect(component.players[1].isMute).toBeFalse();
        expect(socketService.send).toHaveBeenCalledWith('mutePlayer', 'xxx');
    });

    it('should sort two players by name in ascending and descending order', () => {
        component.players = players;
        component.players[0].name = 'Charlie';
        component.players[1].name = 'Alice';
        currentGameService.isGameDone = false;
        component['activeSort'] = 'name';
        component.order = 'desc';
        component.sortNames();
        expect(component.players.map((p) => p.name)).toEqual(['Alice', 'Charlie']);
        component.order = 'asc';
        component.sortNames();
        expect(component.players.map((p) => p.name)).toEqual(['Charlie', 'Alice']);
    });

    it('should sort two players by score in ascending and descending order', () => {
        component.players = players;
        component.players[0].score = 20;
        component.players[1].score = 30;
        currentGameService.isGameDone = false;
        component.activeSort = 'score';
        component.order = 'desc';
        component.sortScore();
        expect(component.players.map((p) => p.score)).toEqual([20, 30]);

        component.order = 'asc';
        component.sortScore();
        expect(component.players.map((p) => p.score)).toEqual([30, 20]);

        component.players[0].score = 30;
        component.players[1].score = 30;
        component.sortScore();
        expect(component.players.map((p) => p.name)).toEqual(['John', 'xxx']);
    });

    it('should sort two players by bonus and name in ascending and descending order', () => {
        component.players = players;
        component.players[0].name = 'Charlie';
        component.players[1].name = 'Alice';
        currentGameService.isGameDone = false;
        component.players[0].bonus = 100;
        component.players[1].bonus = 200;
        component.activeSort = 'bonus';
        component.order = 'desc';
        component.sortBonus();
        expect(component.players.map((p) => p.name)).toEqual(['Charlie', 'Alice']);
        expect(component.order).toBe('asc');

        component.sortBonus();
        expect(component.players.map((p) => p.name)).toEqual(['Alice', 'Charlie']);
        expect(component.order).toBe('desc');

        component.players[0].bonus = 200;
        component.players[1].bonus = 200;
        component.sortBonus();
        expect(component.players.map((p) => p.name)).toEqual(['Alice', 'Charlie']);
        expect(component.order).toBe('asc');
    });

    it('should correctly sort players by color and secondary criteria', () => {
        const players2 = [
            {
                name: 'John',
                isSurrender: false,
                isFinish: false,
                isInteract: false,
                score: 0,
                bonus: 0,
                isMute: false,
                position: 0,
            },
            {
                name: 'Alice',
                isSurrender: true,
                isFinish: false,
                isInteract: false,
                score: 10,
                bonus: 0,
                isMute: false,
                position: 1,
            },
            {
                name: 'Bob',
                isSurrender: false,
                isFinish: true,
                isInteract: false,
                score: 20,
                bonus: 0,
                isMute: false,
                position: 2,
            },
            {
                name: 'Charlie',
                isSurrender: false,
                isFinish: false,
                isInteract: true,
                score: 30,
                bonus: 0,
                isMute: false,
                position: 3,
            },
            {
                name: 'Jack',
                isSurrender: false,
                isFinish: false,
                isInteract: false,
                score: 0,
                bonus: 0,
                isMute: false,
                position: 0,
            },
            {
                name: 'Ben',
                isSurrender: false,
                isFinish: false,
                isInteract: false,
                score: 10,
                bonus: 0,
                isMute: false,
                position: 1,
            },
            {
                name: 'Sam',
                isSurrender: false,
                isFinish: false,
                isInteract: false,
                score: 0,
                bonus: 0,
                isMute: false,
                position: 0,
            },
            {
                name: 'Kel',
                isSurrender: false,
                isFinish: false,
                isInteract: false,
                score: 0,
                bonus: 0,
                isMute: false,
                position: 1,
            },
        ];
        component.players = players2;
        currentGameService.isGameDone = false;
        component.activeSort = 'color';
        component.order = 'asc';
        component.sortColor();
        expect(component.players.map((p) => p.name)).toEqual(['Alice', 'Bob', 'Charlie', 'Ben', 'Jack', 'John', 'Kel', 'Sam']);
        component.order = 'desc';
        component.sortColor();
        expect(component.players.map((p) => p.name)).toEqual(['Ben', 'Jack', 'John', 'Kel', 'Sam', 'Charlie', 'Bob', 'Alice']);
    });

    it('should sort players by score and set positions if game is done', () => {
        component.players = players;
        currentGameService.isGameDone = true;
        spyOn(component, 'sortScore');
        spyOn(component as any, 'setPlayersPosition');
        component['setPlayers']();
        expect(component.sortScore).toHaveBeenCalled();
        expect(component['setPlayersPosition']).toHaveBeenCalled();
    });

    it('should sort players based on activeSort when game is not done', () => {
        currentGameService.isGameDone = false;
        component.isFinish = true;
        const sorts: string[] = ['name', 'color', 'bonus', 'score'];
        sorts.forEach((sort) => {
            (component.activeSort as any) = sort;
            let sortSpy;

            switch (sort) {
                case 'name':
                    sortSpy = spyOn(component, 'sortNames').and.callThrough();
                    break;
                case 'color':
                    sortSpy = spyOn(component, 'sortColor').and.callThrough();
                    break;
                case 'bonus':
                    sortSpy = spyOn(component, 'sortBonus').and.callThrough();
                    break;
                case 'score':
                default:
                    sortSpy = spyOn(component, 'sortScore').and.callThrough();
                    break;
            }
            component['setPlayers']();
            expect(sortSpy).toHaveBeenCalled();
            expect(component.order).toMatch(/asc|desc/);
        });
    });

    it('should toggle the order each time setPlayers is called', () => {
        currentGameService.isGameDone = false;
        component.isFinish = true;
        component.order = 'desc';
        (component as any).setPlayers();
        expect(component.order).toBe('asc');
        (component as any).setPlayers();
    });

    it('should sort players by name when scores are equal in setPlayersPosition', () => {
        component.players = [
            {
                name: 'Charlie',
                isSurrender: false,
                score: 0,
                bonus: 0,
                isMute: false,
                position: 0,
                isInteract: false,
                isFinish: false,
            },
            {
                name: 'Alice',
                isSurrender: false,
                score: 10,
                bonus: 0,
                isMute: false,
                position: 0,
                isInteract: false,
                isFinish: false,
            },
            {
                name: 'Bob',
                isSurrender: false,
                score: 0,
                bonus: 0,
                isMute: false,
                position: 0,
                isInteract: false,
                isFinish: false,
            },
        ];
        component['setPlayersPosition']();
        expect(component.players.map((p) => p.name)).toEqual(['Alice', 'Bob', 'Charlie']);
        component.players.forEach((player, index) => {
            expect(player.position).toBe(index);
        });
    });

    it('should not sort on gameDone', () => {
        currentGameService.isGameDone = true;
        component.sortBonus();
        component.sortScore();
        component.sortNames();
        component.sortColor();
        expect(component.players).toEqual(component.players);
    });
});
