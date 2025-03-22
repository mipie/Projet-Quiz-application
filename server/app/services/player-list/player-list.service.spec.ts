/* eslint-disable max-lines */
import { Game } from '@app/model/database/game';
import { Histogram } from '@app/model/schema/histogram';
import { PlayerList } from '@app/model/schema/player-list';
import { RoomGame } from '@app/model/schema/room-game';
import { GameDataService } from '@app/services/game-data/game-data.service';
import { Test, TestingModule } from '@nestjs/testing';
import { Socket } from 'socket.io';
import { PlayerListService } from './player-list.service';

describe('PlayerListService', () => {
    let service: PlayerListService;
    const gameDataService = {
        getGame: jest.fn(),
    };
    let SOCKET: Socket;
    let GAME: Game;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PlayerListService,
                {
                    provide: GameDataService,
                    useValue: gameDataService,
                },
            ],
        }).compile();

        service = module.get<PlayerListService>(PlayerListService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should return the socket of the organizer in a room', () => {
        const roomCode = '1234';
        service['roomsGame'].push({
            room: roomCode,
            isLock: false,
            game: GAME,
            banNames: [],
            playerBonus: false,
            isGameStarted: true,
            isGameFinished: false,
            playerList: [new PlayerList('Organisator', SOCKET), new PlayerList('Player1', SOCKET)],
            histogramList: [],
        });
        const expectedOrganizerSocket = service.organizerSocket(roomCode);
        expect(expectedOrganizerSocket).toEqual(SOCKET);
    });

    it('should return the list of players names', () => {
        const roomCode = '1234';
        service['roomsGame'].push({
            room: roomCode,
            isLock: false,
            game: GAME,
            banNames: [],
            playerBonus: false,
            isGameStarted: true,
            isGameFinished: false,
            playerList: [new PlayerList('Organisator', SOCKET), new PlayerList('Player1', SOCKET)],
            histogramList: [],
        });
        const namesList = service.getNames(roomCode);
        expect(namesList).toEqual(['Organisator', 'Player1']);
    });

    it('should return undefined player names if the room does not exist', () => {
        const roomCode = '';
        const namesList = service.getNames(roomCode);
        expect(namesList).toBeUndefined();
    });

    it('should return the list of banned names', () => {
        const roomCode = '1234';
        service['roomsGame'].push({
            room: roomCode,
            isLock: false,
            game: GAME,
            banNames: ['Player1'],
            playerBonus: true,
            isGameStarted: true,
            isGameFinished: false,
            playerList: [],
            histogramList: [],
        });
        const nameBannedList = service.getNamesBanned(roomCode);
        expect(nameBannedList).toEqual(['Player1']);
    });

    it('should return undefined banned list if the room does not exist', () => {
        const roomCode = '';
        const bannedNamesList = service.getNamesBanned(roomCode);
        expect(bannedNamesList).toBeUndefined();
    });

    it('should get room properties', () => {
        const roomCode = '1234';
        const room: RoomGame = {
            room: roomCode,
            isLock: false,
            game: GAME,
            banNames: ['Player1'],
            playerBonus: false,
            isGameStarted: false,
            isGameFinished: false,
            playerList: [],
            histogramList: [],
        };
        service['roomsGame'].push(room);
        const result = service.getRoomProperty(roomCode, 'isLock');
        expect(result).toBe(false);
    });

    it('should get player properties', () => {
        const roomCode = '1234';
        const player: PlayerList = new PlayerList('Organisator', SOCKET);
        service['getRoom'] = jest.fn().mockReturnValue({
            room: roomCode,
            isLock: false,
            game: GAME,
            banNames: ['Player1'],
            playerBonus: false,
            isGameStarted: false,
            isGameFinished: false,
            playerList: [player],
            histogramList: [],
        });
        const result = service.getPlayerProperty(roomCode, player.socket, 'isSurrender');
        expect(result).toBe(false);
    });

    it('should get player socket', () => {
        const roomCode = '1234';
        const player: PlayerList = new PlayerList('Organisator', SOCKET);
        service['getRoom'] = jest.fn().mockReturnValue({
            room: roomCode,
            isLock: false,
            game: GAME,
            banNames: ['Player1'],
            playerBonus: false,
            isGameStarted: false,
            isGameFinished: false,
            playerList: [player],
            histogramList: [],
        });
        const result = service.getPlayerSocket(roomCode, player.name);
        expect(result).toBe(SOCKET);
    });

    it('should get players', () => {
        const roomCode = '1234';
        const player: PlayerList = new PlayerList('Organisator', SOCKET);
        service['getRoom'] = jest.fn().mockReturnValue({
            room: roomCode,
            isLock: false,
            game: GAME,
            banNames: [],
            playerBonus: false,
            isGameStarted: false,
            isGameFinished: false,
            playerList: [player],
            histogramList: [],
        });
        const result = service.getPlayers(roomCode);
        expect(result).toEqual([
            {
                name: 'Organisator',
                isSurrender: false,
                score: 0,
                bonus: 0,
                isFinish: false,
                isInteract: false,
                isMute: false,
            },
        ]);
    });

    it('should return undefined for a non-existing room', () => {
        const result = service.getPlayers('1234');
        expect(result).toBeUndefined();
    });

    it('should set the bonus and update the player bonus count for a player in a room', () => {
        const roomCode = '1234';
        service['roomsGame'].push({
            room: roomCode,
            isLock: false,
            game: GAME,
            banNames: [],
            playerBonus: false,
            isGameStarted: true,
            isGameFinished: false,
            playerList: [new PlayerList('Organisator', SOCKET), new PlayerList('Player1', SOCKET)],
            histogramList: [],
        });
        const result = service.setPlayerBonus(roomCode, SOCKET);
        const room = service['getRoom'](roomCode);
        const expectedPointBonus = room.playerList.find((player) => player.socket === SOCKET);
        expect(expectedPointBonus.bonus).toBe(1);
        expect(room.playerBonus).toBe(true);
        expect(result).toBe(true);
    });

    it('should not set the bonus if player bonus is set already in a room', () => {
        const roomCode = '1234';
        service['roomsGame'].push({
            room: roomCode,
            isLock: false,
            game: GAME,
            banNames: [],
            playerBonus: true,
            isGameStarted: true,
            isGameFinished: false,
            playerList: [new PlayerList('Organisator', SOCKET), new PlayerList('Player1', SOCKET)],
            histogramList: [],
        });
        const result = service.setPlayerBonus(roomCode, SOCKET);
        const room = service['getRoom'](roomCode);
        const expectedPointBonus = room.playerList.find((player) => player.socket === SOCKET);
        expect(expectedPointBonus.bonus).toBe(0);
        expect(room.playerBonus).toBe(true);
        expect(result).toBe(false);
    });

    it('should set player properties', () => {
        const roomCode = '1234';
        const player: PlayerList = new PlayerList('Organisator', SOCKET);
        service['getRoom'] = jest.fn().mockReturnValue({
            room: roomCode,
            isLock: false,
            game: GAME,
            banNames: ['Player1'],
            playerBonus: false,
            isGameStarted: false,
            isGameFinished: false,
            playerList: [player],
            histogramList: [],
        });
        const result = service.setPlayerProperty(roomCode, player.socket, { property: 'isSurrender', value: true });
        expect(result).toBe(true);
    });

    it('should add and remove choices for a player in a room', () => {
        const roomCode = '1234';
        const choiceToAdd = 1;
        const choiceToRemove = 2;
        service['roomsGame'].push({
            room: roomCode,
            isLock: false,
            game: GAME,
            banNames: [],
            playerBonus: false,
            isGameStarted: true,
            isGameFinished: false,
            playerList: [
                {
                    name: 'Player1',
                    socket: SOCKET,
                    isSurrender: false,
                    score: 0,
                    choices: [0, choiceToRemove],
                    openEndedAnswer: '',
                    answerGrade: 0,
                    bonus: 0,
                    isFinish: false,
                    isInteract: false,
                    isInteractionOver5s: false,
                    isMute: false,
                },
            ],
            histogramList: [],
        });
        service.setChoice(SOCKET, roomCode, choiceToAdd);
        service.setChoice(SOCKET, roomCode, choiceToRemove);
        const room = service['getRoom'](roomCode);
        const updatedPlayer = room.playerList.find((player) => player.socket === SOCKET);
        const updatedChoice = updatedPlayer.choices;
        expect(updatedChoice).toEqual([0, choiceToAdd]);
    });

    it('should return true when the room exists and the user is the organizer', () => {
        const roomCode = '1234';
        const userId = '123456789-ABC';
        service['getRoom'] = jest.fn().mockReturnValue({
            room: roomCode,
            isLock: false,
            game: GAME,
            banNames: [],
            playerBonus: false,
            isGameStarted: true,
            isGameFinished: false,
            playerList: [
                {
                    name: 'Organisator',
                    socket: { id: userId },
                    isSurrender: false,
                    score: 0,
                    choice: [],
                    openEndedAnswer: '',
                    answerGrade: 0,
                    bonus: 0,
                    isFinish: false,
                    isInteract: false,
                    isInteractionOver5s: false,
                    isMute: false,
                },
            ],
            histogramList: [],
        });
        const isRoomExists = service['verifyRoom'](roomCode);
        expect(isRoomExists).toBe(true);
        const result = service.verifyIfOrganisator(userId, roomCode);
        expect(result).toBe(true);
    });

    it('should return true if the room is not locked', () => {
        const roomCode = '1234';
        service['roomsGame'].push({
            room: roomCode,
            isLock: false,
            game: GAME,
            banNames: [],
            playerBonus: true,
            isGameStarted: true,
            isGameFinished: false,
            playerList: [
                {
                    name: 'Organisator',
                    socket: SOCKET,
                    isSurrender: false,
                    score: 0,
                    choices: [],
                    openEndedAnswer: '',
                    answerGrade: 0,
                    bonus: 0,
                    isFinish: false,
                    isInteract: false,
                    isInteractionOver5s: false,
                    isMute: false,
                },
            ],
            histogramList: [],
        });
        const spyVerifyRoom = service['verifyRoom'](roomCode);
        const isLocked = service.verifyIfLocked(roomCode);
        expect(spyVerifyRoom).toBe(true);
        expect(isLocked).toBe(true);
    });

    it('should return undefined for a non-existing room', () => {
        const result = service.verifyIfLocked('');
        expect(result).toBeUndefined();
    });

    it('should return false if the room is locked', () => {
        const roomCode = '1234';
        service['roomsGame'].push({
            room: roomCode,
            isLock: true,
            game: GAME,
            banNames: [],
            playerBonus: true,
            isGameStarted: true,
            isGameFinished: false,
            playerList: [
                {
                    name: 'Organisator',
                    socket: SOCKET,
                    isSurrender: false,
                    score: 0,
                    choices: [],
                    openEndedAnswer: '',
                    answerGrade: 0,
                    bonus: 0,
                    isFinish: false,
                    isInteract: false,
                    isInteractionOver5s: false,
                    isMute: false,
                },
            ],
            histogramList: [],
        });
        const spyVerifyRoom = service['verifyRoom'](roomCode);
        const isLocked = service.verifyIfLocked(roomCode);
        expect(spyVerifyRoom).toBe(true);
        expect(isLocked).toBe(false);
    });

    it('should return true if all players in the room have finished or surrender', () => {
        const roomCode = '1234';
        service['roomsGame'].push({
            room: roomCode,
            isLock: false,
            game: GAME,
            banNames: [],
            playerBonus: false,
            isGameStarted: true,
            isGameFinished: false,
            playerList: [
                {
                    name: 'Organisator',
                    socket: SOCKET,
                    isSurrender: false,
                    score: 0,
                    choices: [],
                    openEndedAnswer: '',
                    answerGrade: 0,
                    bonus: 0,
                    isFinish: true,
                    isInteract: false,
                    isInteractionOver5s: false,
                    isMute: false,
                },
            ],
            histogramList: [],
        });
        const expectedIsAllFinished = service.verifyAllFinish(roomCode);
        expect(expectedIsAllFinished).toBe(true);
    });

    it('should return false if not all players in the room have finished or surrender', () => {
        const roomCode = '1234';
        service['roomsGame'].push({
            room: roomCode,
            isLock: false,
            game: GAME,
            banNames: [],
            playerBonus: false,
            isGameStarted: true,
            isGameFinished: false,
            playerList: [
                {
                    name: 'Organisator',
                    socket: SOCKET,
                    isSurrender: false,
                    score: 0,
                    choices: [],
                    openEndedAnswer: '',
                    answerGrade: 0,
                    bonus: 0,
                    isFinish: false,
                    isInteract: false,
                    isInteractionOver5s: false,
                    isMute: false,
                },
            ],
            histogramList: [],
        });
        const expectedIsAllFinished = service.verifyAllFinish(roomCode);
        expect(expectedIsAllFinished).toBe(false);
    });

    it('should return false if the room is not found', () => {
        const roomCode = '1234';
        const result = service.verifyAllFinish(roomCode);
        expect(result).toBe(false);
    });

    it('should verify if all players gave up', () => {
        const roomCode = '1234';
        service['getRoom'] = jest.fn().mockReturnValue({
            room: roomCode,
            isLock: false,
            game: GAME,
            banNames: [],
            playerBonus: false,
            isGameStarted: false,
            isGameFinished: false,
            playerList: [new PlayerList('Organisator', SOCKET), new PlayerList('Player1', SOCKET)],
            histogramList: [],
        });
        const result = service.verifyIfAllGaveUp(roomCode);
        expect(result).toBe(false);
    });

    it('should toggle mute state of a player in a room ', () => {
        const roomCode = '1234';
        const player1: PlayerList = {
            name: 'Player1',
            socket: SOCKET,
            isSurrender: false,
            score: 0,
            choices: [],
            openEndedAnswer: '',
            answerGrade: 0,
            bonus: 0,
            isFinish: true,
            isInteract: false,
            isInteractionOver5s: false,
            isMute: false,
        };
        service['getRoom'] = jest.fn().mockReturnValue({
            room: roomCode,
            isLock: false,
            game: GAME,
            banNames: [],
            playerBonus: false,
            isGameStarted: false,
            isGameFinished: false,
            playerList: [new PlayerList('Organisator', SOCKET), player1],
            histogramList: [],
        });
        const result = service.toggleIsMute(player1.name, roomCode);
        expect(result).toBe(true);
    });

    it('should toggle lock state of a room ', () => {
        const roomCode = '1234';
        service['roomsGame'].push({
            room: roomCode,
            isLock: false,
            game: GAME,
            banNames: [],
            playerBonus: true,
            isGameStarted: true,
            isGameFinished: false,
            playerList: [new PlayerList('Organisator', SOCKET), new PlayerList('Player1', SOCKET)],
            histogramList: [],
        });
        const isLockChanged = service.changeLockState(roomCode);
        expect(isLockChanged).toBe(true);
        const isUnlockChanged = service.changeLockState(roomCode);
        expect(isUnlockChanged).toBe(false);
    });

    it('should throw an error if the room does not exist', () => {
        const roomCode = '';
        expect(() => service.changeLockState(roomCode)).toThrowError(`Room with name ${roomCode} not found.`);
    });

    it('should set to true when the game starts', () => {
        const roomCode = '1234';
        service['roomsGame'].push({
            room: roomCode,
            isLock: false,
            game: GAME,
            banNames: [],
            playerBonus: false,
            isGameStarted: false,
            isGameFinished: false,
            playerList: [new PlayerList('Organisator', SOCKET), new PlayerList('Player1', SOCKET)],
            histogramList: [],
        });
        service.beginIsStarted(roomCode);
        const updatedRoom = service['getRoom'](roomCode);
        expect(updatedRoom.isGameStarted).toBe(true);
    });

    it('should set to true when the game finishes', () => {
        const roomCode = '1234';
        service['roomsGame'].push({
            room: roomCode,
            isLock: false,
            game: GAME,
            banNames: [],
            playerBonus: false,
            isGameStarted: true,
            isGameFinished: false,
            playerList: [new PlayerList('Organisator', SOCKET)],
            histogramList: [],
        });
        service.endIsFinished(roomCode);
        const updatedRoom = service['getRoom'](roomCode);
        expect(updatedRoom.isGameFinished).toBe(true);
        expect(updatedRoom.playerList[0].isMute).toBe(false);
    });

    it('should reset attributes of a player in a room', () => {
        const roomCode = '1234';
        const player: PlayerList = {
            name: 'Organisator',
            socket: SOCKET,
            isSurrender: false,
            score: 0,
            choices: [],
            openEndedAnswer: '',
            answerGrade: 0,
            bonus: 0,
            isFinish: false,
            isInteract: true,
            isInteractionOver5s: true,
            isMute: false,
        };
        service['getRoom'] = jest.fn().mockReturnValue({
            room: roomCode,
            isLock: false,
            game: GAME,
            banNames: [],
            playerBonus: true,
            isGameStarted: false,
            isGameFinished: false,
            playerList: [player],
            histogramList: [],
        });
        service.resetAttributes(roomCode);
        expect(service['getRoom'](roomCode).playerBonus).toBe(false);
        expect(player.isInteract).toBe(false);
        expect(player.choices).toEqual([]);
        expect(player.isInteractionOver5s).toBe(false);
        expect(service['getRoom'](roomCode).playerList[0].isFinish).toBe(true);
    });

    it('should calculate the sum of choices for players in a room', () => {
        const roomCode = '1234';
        service['roomsGame'].push({
            room: roomCode,
            isLock: false,
            game: GAME,
            banNames: [],
            playerBonus: false,
            isGameStarted: true,
            isGameFinished: false,
            playerList: [
                {
                    name: 'Organisator',
                    socket: SOCKET,
                    isSurrender: false,
                    score: 0,
                    choices: [],
                    openEndedAnswer: '',
                    answerGrade: 0,
                    bonus: 0,
                    isFinish: false,
                    isInteract: true,
                    isInteractionOver5s: true,
                    isMute: false,
                },
                {
                    name: 'Player1',
                    socket: SOCKET,
                    isSurrender: false,
                    score: 0,
                    choices: [0, 1, 2, 1],
                    openEndedAnswer: '',
                    answerGrade: 0,
                    bonus: 0,
                    isFinish: false,
                    isInteract: true,
                    isInteractionOver5s: true,
                    isMute: false,
                },
            ],
            histogramList: [],
        });
        const expectedSumChoice = service.sumChoice(roomCode);
        expect(expectedSumChoice).toEqual([1, 2, 1, 0]);
    });

    it('should return array of 0 for players if a room is not found', () => {
        const roomCode = '1234';
        const expectedSumChoice = service.sumChoice(roomCode);
        expect(expectedSumChoice).toEqual([0, 0, 0, 0]);
    });

    it('should sum interaction time for players in a room', () => {
        const roomCode = '1234';
        const player: PlayerList = {
            name: 'Organisator',
            socket: SOCKET,
            isSurrender: false,
            score: 0,
            choices: [],
            openEndedAnswer: '',
            answerGrade: 0,
            bonus: 0,
            isFinish: false,
            isInteract: true,
            isInteractionOver5s: false,
            isMute: false,
        };
        const player1: PlayerList = {
            name: 'Player1',
            socket: SOCKET,
            isSurrender: false,
            score: 0,
            choices: [],
            openEndedAnswer: '',
            answerGrade: 0,
            bonus: 0,
            isFinish: false,
            isInteract: true,
            isInteractionOver5s: false,
            isMute: false,
        };
        service['getRoom'] = jest.fn().mockReturnValue({
            room: roomCode,
            isLock: false,
            game: GAME,
            banNames: [],
            playerBonus: true,
            isGameStarted: true,
            isGameFinished: false,
            playerList: [player, player1],
            histogramList: [],
        });
        const result = service.sumInteractions(roomCode);
        expect(result).toEqual([0, 1]);
    });

    it('should return [0, 0] for a non-existing room', () => {
        const result = service.sumInteractions('1234');
        expect(result).toEqual([0, 0]);
    });

    it('should add a histogram to a room', () => {
        const roomCode = '1234';
        const histogram = new Histogram(['1', '2', '3'], [1, 2, 3], ['red', 'blue', 'green']);
        service['roomsGame'].push({
            room: roomCode,
            isLock: false,
            game: GAME,
            banNames: [],
            playerBonus: false,
            isGameStarted: true,
            isGameFinished: false,
            playerList: [],
            histogramList: [],
        });
        service.addHistogram(roomCode, histogram);
        const room = service['getRoom'](roomCode);
        expect(room.histogramList).toHaveLength(1);
        expect(room.histogramList[0]).toEqual(histogram);
    });

    it('should add a player in a room', () => {
        const roomCode = '1234';
        const playerMock: PlayerList = {
            name: 'hello',
            socket: SOCKET,
            isSurrender: false,
            score: 0,
            choices: [],
            bonus: 0,
            isFinish: false,
            openEndedAnswer: '',
            answerGrade: 0,
            isInteract: false,
            isInteractionOver5s: false,
            isMute: false,
        };
        service['getRoom'] = jest.fn().mockReturnValue({
            room: roomCode,
            isLock: false,
            game: GAME,
            banNames: [],
            playerBonus: false,
            isGameStarted: true,
            isGameFinished: false,
            playerList: [{ name: 'Organisator', socket: SOCKET, isSurrender: false, score: 0, choice: [], bonus: 0, isFinish: true }],
        });
        const result = service.addPlayer(roomCode, playerMock.name, SOCKET);
        const room = service['getRoom'](roomCode);
        expect(result).toBe(true);
        expect(room.playerList).toHaveLength(2);
        expect(room.playerList[1].name).toBe(playerMock.name);
        expect(room.playerList[1].socket).toBe(playerMock.socket);
    });

    it('should not add a player in a room', () => {
        const roomCode = '1234';
        const playerMock: PlayerList = {
            name: 'hello',
            socket: SOCKET,
            isSurrender: false,
            score: 0,
            choices: [],
            bonus: 0,
            isFinish: false,
            openEndedAnswer: '',
            answerGrade: 0,
            isInteract: false,
            isInteractionOver5s: false,
            isMute: false,
        };
        service['getRoom'] = jest.fn().mockReturnValue({
            room: roomCode,
            isLock: true,
            game: GAME,
            banNames: [],
            playerBonus: false,
            isGameStarted: true,
            isGameFinished: false,
            playerList: [{ name: 'Organisator', socket: SOCKET, isSurrender: false, score: 0, choice: [], bonus: 0, isFinish: true }],
        });
        const result = service.addPlayer(roomCode, playerMock.name, SOCKET);
        const room = service['getRoom'](roomCode);
        expect(result).toBe(false);
        expect(room.playerList).toHaveLength(1);
    });

    it('should ban a player from a room and return the socket', () => {
        const roomCode = '1234';
        const playerMock: PlayerList = {
            name: 'Player1',
            socket: SOCKET,
            isSurrender: false,
            score: 0,
            choices: [],
            bonus: 0,
            isFinish: false,
            openEndedAnswer: '',
            answerGrade: 0,
            isInteract: false,
            isInteractionOver5s: false,
            isMute: false,
        };
        service['getRoom'] = jest.fn().mockReturnValue({
            room: roomCode,
            isLock: true,
            game: GAME,
            banNames: [],
            playerBonus: false,
            isGameStarted: true,
            isGameFinished: false,
            playerList: [{ name: 'Organisator', socket: SOCKET, isSurrender: false, score: 0, choice: [], bonus: 0, isFinish: true }, playerMock],
        });
        const result = service.banPlayer(playerMock.name, roomCode);
        const room = service['getRoom'](roomCode);
        expect(result).toBe(SOCKET);
        expect(room.playerList).toHaveLength(1);
        expect(room.banNames).toContain(playerMock.name);
    });

    it('should return undefined when trying to ban a non-existing player', () => {
        const roomName = '1234';
        const playerName = '';
        const result = service.banPlayer(playerName, roomName);
        expect(result).toBeUndefined();
    });

    it('should delete a player if it exists in the room', () => {
        const roomCode = '1234';
        const userId1 = '123456789-ABC';
        const userId2 = '987654321-CBA';
        service['getRoom'] = jest.fn().mockReturnValue({
            room: roomCode,
            isLock: false,
            game: GAME,
            banNames: [],
            playerBonus: false,
            isGameStarted: true,
            isGameFinished: false,
            playerList: [
                { name: 'Organisator', socket: { id: userId1 }, isSurrender: false, score: 0, choice: [], bonus: 0, isFinish: true },
                { name: 'Player1', socket: { id: userId2 }, isSurrender: false, score: 0, choice: [], bonus: 0, isFinish: true },
            ],
            histogramList: [],
        });
        service.deletePlayer(userId2, roomCode);
        const room = service['getRoom'](roomCode);
        expect(room.playerList).toHaveLength(1);
    });

    it('should delete a room', () => {
        const roomCode = '1234';
        service['roomsGame'].push({
            room: roomCode,
            isLock: false,
            game: GAME,
            banNames: [],
            playerBonus: true,
            isGameStarted: true,
            isGameFinished: false,
            playerList: [new PlayerList('Organisator', SOCKET)],
            histogramList: [],
        });
        const deletedRoom = service.deleteRoom(roomCode);
        expect(deletedRoom).toBeUndefined();
    });

    it('should create a room object with unique attributes', async () => {
        const gameId = 1;
        const gameData = {
            id: gameId,
            isVisible: true,
            isChecked: false,
            game: {
                $schema: '1234',
                title: 'Hello',
                description: 'Maintenant',
                duration: 10,
                lastModification: '2013-02-01',
                questions: [],
            },
        };
        jest.spyOn(gameDataService, 'getGame').mockResolvedValue({ game: gameData });
        const roomCode = await service.createRoom(SOCKET, gameId);
        const room = service['getRoom'](roomCode);
        expect(room).toBeDefined();
        expect(room.room).toEqual(roomCode);
        expect(room.isGameStarted).toBe(false);
        expect(room.game).toMatchObject(gameData);
        expect(room.playerList).toHaveLength(1);
        expect(room.banNames).toHaveLength(0);
        expect(room.playerList[0].name).toEqual('Organisateur');
        expect(room.playerList[0].socket).toBe(SOCKET);
    });

    it('should generate a unique code', () => {
        const codeString = '1234';
        const getRoom = service['getRoom'](codeString);
        const result = service['generateUniqueCode']();
        expect(getRoom).toBeUndefined();
        expect(result).toMatch(/^\d{4}$/);
        expect(result).not.toEqual(codeString);
    });

    it('should return a room when it exists', () => {
        const roomCode = '1234';
        const room: RoomGame = {
            room: roomCode,
            isLock: false,
            game: GAME,
            banNames: [],
            playerBonus: false,
            isGameStarted: false,
            isGameFinished: false,
            playerList: [],
            histogramList: [],
        };
        service['roomsGame'].push(room);
        const resultRoom = service['getRoom'](roomCode);
        expect(resultRoom).toEqual(room);
    });

    it('should return undefined when it does not exists', () => {
        const roomCode = '1234';
        const result = service['getRoom'](roomCode);
        expect(result).toBeUndefined();
    });

    it('should verify if the room exists', () => {
        const roomCode = '1234';
        const room: RoomGame = {
            room: roomCode,
            isLock: false,
            game: GAME,
            banNames: [],
            playerBonus: false,
            isGameStarted: false,
            isGameFinished: false,
            playerList: [],
            histogramList: [],
        };
        service['roomsGame'].push(room);
        const isRoomExists = service['verifyRoom'](roomCode);
        expect(isRoomExists).toBe(true);
    });

    it('should verify if the name is found', () => {
        const roomCode = '1234';
        const nameToAdd = 'Player1';
        const room: RoomGame = {
            room: roomCode,
            isLock: false,
            game: GAME,
            banNames: [],
            playerBonus: true,
            isGameStarted: true,
            isGameFinished: false,
            playerList: [new PlayerList('Organisator', SOCKET), new PlayerList('Player1', SOCKET)],
            histogramList: [],
        };
        service['roomsGame'].push(room);
        const resultRoom = service['getRoom'](roomCode);
        const isNameValid = service['verifyName'](nameToAdd, roomCode);
        expect(resultRoom).toEqual(room);
        expect(isNameValid).toBe(true);
    });

    it('should verify if the name is banned', () => {
        const roomCode = '1234';
        const nameToAdd = 'Player1';
        const room: RoomGame = {
            room: roomCode,
            isLock: false,
            game: GAME,
            banNames: ['Player1'],
            playerBonus: true,
            isGameStarted: true,
            isGameFinished: false,
            playerList: [new PlayerList('Organisator', SOCKET)],
            histogramList: [],
        };
        service['roomsGame'].push(room);
        const resultRoom = service['getRoom'](roomCode);
        const isNameValid = service['verifyName'](nameToAdd, roomCode);
        expect(resultRoom).toEqual(room);
        expect(isNameValid).toBe(true);
    });
});
