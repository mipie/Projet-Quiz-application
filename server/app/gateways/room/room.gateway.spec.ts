/* eslint-disable max-lines */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Histogram } from '@app/model/schema/histogram';
import { DateService } from '@app/services/date/date.service';
import { PlayerListService } from '@app/services/player-list/player-list.service';
import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SinonStubbedInstance, createStubInstance } from 'sinon';
import { Server, Socket } from 'socket.io';
import { RoomGateway } from './room.gateway';

describe('RoomGateway', () => {
    let roomGateway: RoomGateway;
    let playerListService: SinonStubbedInstance<PlayerListService>;
    let dateService: SinonStubbedInstance<DateService>;
    let logger: SinonStubbedInstance<Logger>;
    let mockServer: { to: jest.Mock; emit: jest.Mock };
    let mockSocket: {
        id: '12345-ABC';
        join: jest.Mock;
        emit: jest.Mock;
        disconnect: jest.Mock;
        broadcast: {
            to: jest.Mock;
            emit: jest.Mock;
        };
    };

    beforeEach(async () => {
        playerListService = createStubInstance(PlayerListService);
        dateService = createStubInstance(DateService);
        logger = createStubInstance(Logger);
        mockServer = {
            to: jest.fn(),
            emit: jest.fn(),
        };
        mockSocket = {
            id: '12345-ABC',
            join: jest.fn(),
            emit: jest.fn(),
            disconnect: jest.fn(),
            broadcast: {
                to: jest.fn(),
                emit: jest.fn(),
            },
        };

        const app: TestingModule = await Test.createTestingModule({
            providers: [
                RoomGateway,
                { provide: PlayerListService, useValue: playerListService },
                { provide: DateService, useValue: dateService },
                { provide: Logger, useValue: logger },
                {
                    provide: Server,
                    useValue: mockServer,
                },
                {
                    provide: Socket,
                    useValue: mockSocket,
                },
            ],
        }).compile();

        roomGateway = app.get<RoomGateway>(RoomGateway);
    });

    it('should be defined', () => {
        expect(roomGateway).toBeDefined();
    });

    it('should create a room', async () => {
        const id = 123;
        await roomGateway.createRoom(mockSocket as any, id);
        expect(playerListService.createRoom.calledOnceWith(mockSocket as any, id)).toBe(true);
    });

    it('should join a room', () => {
        const room = '1234';
        roomGateway.joinRoom(mockSocket as any, room);
        expect(mockSocket.join).toBeCalledWith(room);
    });

    it('should verify room', () => {
        const room = 'test-room';
        playerListService.verifyIfLocked.returns(false);
        roomGateway.verifyRoom(mockSocket as any, room);
        expect(playerListService.verifyIfLocked.calledOnceWith(room)).toBe(true);
        expect((mockSocket as any).emit).toBeCalled();
    });

    it('should verify name and return true', () => {
        const room = '1234';
        const data = { code: room, name: 'Player1' };
        roomGateway['userToRoomMap'][mockSocket.id] = room;
        const successSpy = jest.spyOn(playerListService, 'addPlayer').mockReturnValue(true);
        const joinRoomSpy = jest.spyOn(roomGateway, 'joinRoom');
        mockSocket.join = jest.fn().mockReturnValue({
            emit: jest.fn(),
        });
        roomGateway.verifyName(mockSocket as any, data);
        expect(joinRoomSpy).toHaveBeenCalledWith(mockSocket as any, room);
        expect(successSpy).toHaveBeenCalledWith(data.code, data.name, mockSocket);
        expect(mockSocket.emit).toHaveBeenCalledWith('receiveId', playerListService.getRoomProperty(room, 'game'));
    });

    it('should verify name and return false', () => {
        const room = '1234';
        const data = { code: room, name: 'Player1' };
        roomGateway['userToRoomMap'][mockSocket.id] = room;
        const successSpy = jest.spyOn(playerListService, 'addPlayer').mockReturnValue(false);
        mockSocket.join = jest.fn().mockReturnValue({
            emit: jest.fn(),
        });
        roomGateway.verifyName(mockSocket as any, data);
        expect(successSpy).toHaveBeenCalledWith(data.code, data.name, mockSocket);
        expect(mockSocket.emit).toHaveBeenCalledWith('nameAdd', false);
    });

    it('should upload names to the specified room', () => {
        const room = '1234';
        roomGateway['server'] = mockServer as any;
        mockServer.to = jest.fn().mockReturnValue({
            emit: jest.fn(),
        });
        roomGateway.uploadNames(mockSocket as any, room);
        expect(mockServer.to).toHaveBeenCalledWith(room);
        expect(mockServer.to().emit).toHaveBeenCalledWith('getUsers', undefined);
        expect(mockServer.to().emit).toHaveBeenCalledWith('getBanned', undefined);
    });

    it('should upload players', () => {
        const room = '1234';
        roomGateway['server'] = mockServer as any;
        mockServer.to = jest.fn().mockReturnValue({
            emit: jest.fn(),
        });
        roomGateway.uploadPlayers(mockSocket as any, room);
        expect(mockServer.to).toHaveBeenCalledWith(room);
        expect(mockServer.to().emit).toHaveBeenCalledWith('getPlayers', undefined);
    });

    it('should toggle lock', () => {
        const roomCode = '1234';
        roomGateway['userToRoomMap'][mockSocket.id] = roomCode;
        const isLocked = true;
        const verifyIfOrganisatorSpy = jest.spyOn(playerListService, 'verifyIfOrganisator').mockReturnValue(true);
        const changeLockStateSpy = jest.spyOn(playerListService, 'changeLockState').mockReturnValue(!isLocked);
        roomGateway['server'] = mockServer as any;
        mockServer.to = jest.fn().mockReturnValue({
            emit: jest.fn(),
        });
        roomGateway.toggleLock(mockSocket as any);
        expect(verifyIfOrganisatorSpy).toHaveBeenCalledWith(mockSocket.id, roomCode);
        expect(changeLockStateSpy).toHaveBeenCalledWith(roomCode);
        expect(mockServer.to).toHaveBeenCalledWith(roomCode);
        expect(mockServer.to().emit).toHaveBeenCalledWith('lockToggled', !isLocked);
    });

    it('should begin game', () => {
        playerListService.verifyIfOrganisator.returns(true);
        mockSocket.broadcast.to = jest.fn().mockReturnValue({
            emit: jest.fn(),
        });
        roomGateway.beginGame(mockSocket as any, 'test-room');
        expect(mockSocket.emit).toHaveBeenCalledWith('goToViews', true);
        expect(mockSocket.broadcast.to).toHaveBeenCalledWith('test-room');
        expect(mockSocket.broadcast.to().emit).toHaveBeenCalled();
    });

    it('should not begin game', () => {
        playerListService.verifyIfOrganisator.returns(false);
        const logMock = jest.spyOn(logger, 'log');
        roomGateway.beginGame(mockSocket as any, 'test-room');
        expect(logMock).toBeCalledWith(`${mockSocket.id} is not a organizer.`);
    });

    it('should handle message', () => {
        const room = 'test-room';
        roomGateway['userToRoomMap'][mockSocket.id] = room;
        const mockData = {
            name: 'test-name',
            time: 'test-time',
            message: 'test-message',
        };
        mockSocket.broadcast.to = jest.fn().mockReturnValue({
            emit: jest.fn(),
        });
        roomGateway.handleMessage(mockSocket as any, mockData);
        expect(mockSocket.broadcast.to).toHaveBeenCalledWith(room);
        expect(mockSocket.broadcast.to().emit).toHaveBeenCalled();
    });

    it('should player ban', () => {
        const room = 'test-room';
        roomGateway['userToRoomMap'][mockSocket.id] = room;
        playerListService.banPlayer.returns(mockSocket as any);
        const uplaodSpy = jest.spyOn(roomGateway as any, 'uploadNames');
        uplaodSpy.mockImplementation(() => {
            return;
        });
        roomGateway.playerBan(mockSocket as any, 'test-id');
        expect(mockSocket.emit).toHaveBeenCalledWith('gotBanned');
        expect(mockSocket.disconnect).toBeCalled();
        expect(roomGateway.uploadNames).toBeCalled();
    });

    it('should quit game for the organizer', () => {
        roomGateway['userToRoomMap'][(mockSocket as any).id] = 'test-room';
        playerListService.verifyIfOrganisator.returns(true);
        mockServer.to = jest.fn().mockReturnValue({
            emit: jest.fn(),
        });
        roomGateway['server'] = mockServer as any;
        roomGateway.quitGame(mockSocket as any);
        expect(playerListService.deleteRoom.calledWith('test-room')).toBe(true);
        expect(mockServer.to().emit).toBeCalledWith('viewToHome', true);
    });

    it('should quit game for the player', () => {
        roomGateway['userToRoomMap'][(mockSocket as any).id] = 'test-room';
        playerListService.verifyIfOrganisator.returns(false);
        const uploadSpy = jest.spyOn(roomGateway, 'uploadNames');
        uploadSpy.mockImplementation(() => {
            return;
        });
        roomGateway.quitGame(mockSocket as any);
        expect(playerListService.deletePlayer.calledWith(mockSocket.id, 'test-room')).toBe(true);
        expect(mockSocket.emit).toBeCalledWith('viewToHome', false);
        expect(uploadSpy).toBeCalled();
    });

    it('should set the choice of a player', () => {
        const choice = 1;
        const room = 'test-room';
        roomGateway['userToRoomMap'][(mockSocket as any).id] = room;
        const sumSpy = jest.spyOn(roomGateway, 'sumChoice');
        const uploadSpy = jest.spyOn(roomGateway, 'uploadPlayers');
        sumSpy.mockImplementation(() => {
            return;
        });
        uploadSpy.mockImplementation(() => {
            return;
        });
        roomGateway.setChoice(mockSocket as any, choice);
        expect(playerListService.setChoice.calledOnceWith(mockSocket as any, room, 0));
        expect(roomGateway.sumChoice).toBeCalled();
        expect(roomGateway.uploadPlayers).toBeCalled();
    });

    it('should set the interaction of a player', () => {
        const mockOrganizerSocket = { emit: jest.fn() } as any;
        const room = '1234';
        const data = { property: 'isInteractionOver5s', value: true };
        const hasInteractedUnder5s = true;
        roomGateway['userToRoomMap'][mockSocket.id] = room;
        jest.spyOn(playerListService, 'setPlayerProperty');
        jest.spyOn(playerListService, 'organizerSocket').mockReturnValue(mockOrganizerSocket);
        const uploadSpy = jest.spyOn(roomGateway as any, 'uploadPlayers');
        uploadSpy.mockImplementation(() => {
            return;
        });
        roomGateway.setInteractif(mockSocket as any, hasInteractedUnder5s);
        expect(data.property).toBe('isInteractionOver5s');
        expect(data.value).toBe(hasInteractedUnder5s);
        expect(playerListService.setPlayerProperty).toHaveBeenCalledWith(room, mockSocket, data);
    });

    it('should set the interaction of a player', () => {
        const mockOrganizerSocket = { emit: jest.fn() } as any;
        const room = '1234';
        const hasInteractedUnder5s = true;
        roomGateway['userToRoomMap'][mockSocket.id] = room;
        jest.spyOn(playerListService, 'setPlayerProperty');
        jest.spyOn(playerListService, 'organizerSocket').mockReturnValue(mockOrganizerSocket);
        const getPlayersPropertySpy = jest.spyOn(playerListService, 'getPlayerProperty').mockReturnValue(true);
        const uploadSpy = jest.spyOn(roomGateway as any, 'uploadPlayers');
        uploadSpy.mockImplementation(() => {
            return;
        });
        roomGateway.setInteractif(mockSocket as any, hasInteractedUnder5s);
        expect(getPlayersPropertySpy).toHaveBeenCalledWith(room, mockSocket, 'isInteractionOver5s');
    });

    it('should sum all interaction', () => {
        const mockOrganizerSocket = { emit: jest.fn() } as any;
        const room = 'test-room';
        roomGateway['userToRoomMap'][mockSocket.id] = room;
        jest.spyOn(playerListService, 'sumInteractions').mockReturnValue([1, 2, 3, 3]);
        jest.spyOn(playerListService, 'organizerSocket').mockReturnValue(mockOrganizerSocket);
        roomGateway.sumInteractions(mockSocket as any);
        expect(playerListService.sumInteractions).toHaveBeenCalledWith(room);
        expect(playerListService.organizerSocket).toHaveBeenCalledWith(room);
        expect(mockOrganizerSocket.emit).toHaveBeenCalledWith('resultInteractions', [1, 2, 3, 3]);
    });

    it('should sum all choice', () => {
        const room = 'test-room';
        roomGateway['userToRoomMap'][mockSocket.id] = room;
        playerListService.sumChoice.returns([1, 2, 3, 3]);
        roomGateway.sumChoice(mockSocket as any);
        expect(mockSocket.emit).toHaveBeenCalledWith('resultChoice', [1, 2, 3, 3]);
    });

    it('should set isFinish and everyone finish', () => {
        const mockOrganizerSocket = { emit: jest.fn() } as any;
        const openEndedAnswer = 'test';
        const data = { property: 'isFinish', value: true };
        const room = '1234';
        roomGateway['userToRoomMap'][mockSocket.id] = room;
        const uploadSpy = jest.spyOn(roomGateway as any, 'uploadPlayers');
        uploadSpy.mockImplementation(() => {
            return;
        });
        jest.spyOn(playerListService, 'setPlayerProperty');
        jest.spyOn(playerListService, 'organizerSocket').mockReturnValue(mockOrganizerSocket);
        playerListService.verifyAllFinish.returns(true);
        roomGateway.setIsFinish(mockSocket as any, openEndedAnswer);
        expect(playerListService.setPlayerProperty).toHaveBeenCalledWith(room, mockSocket, data);
        expect(playerListService.organizerSocket).toHaveBeenCalledWith(room);
        expect(mockOrganizerSocket.emit).toHaveBeenCalledWith('allFinish', true);
        expect(mockOrganizerSocket.emit).toHaveBeenCalledWith('allQCMEvaluated', true);
    });

    it('should set isFinish and openEndedAnswer', () => {
        const mockOrganizerSocket = { emit: jest.fn() } as any;
        const openEndedAnswer = 'test';
        const data = { property: 'isFinish', value: true };
        const room = '1234';
        roomGateway['userToRoomMap'][mockSocket.id] = room;
        const uploadSpy = jest.spyOn(roomGateway as any, 'uploadPlayers');
        uploadSpy.mockImplementation(() => {
            return;
        });
        playerListService.verifyAllFinish.returns(false);
        jest.spyOn(playerListService, 'setPlayerProperty');
        jest.spyOn(playerListService, 'organizerSocket').mockReturnValue(mockOrganizerSocket);

        roomGateway.setIsFinish(mockSocket as any, openEndedAnswer);
        expect(playerListService.organizerSocket).toHaveBeenCalledWith(room);
        expect(playerListService.organizerSocket).toHaveBeenCalledWith(room);
        expect(mockOrganizerSocket.emit).toHaveBeenCalledWith('newOpenEndedAnswer', {
            playerName: playerListService.getPlayerProperty(room, mockSocket as any, 'name'),
            answer: openEndedAnswer,
        });
        expect(playerListService.setPlayerProperty).toHaveBeenCalledWith(room, mockSocket, data);
    });

    it('should answer send', () => {
        const mockOrganizerSocket = { emit: jest.fn() } as any;
        const room = '1234';
        roomGateway['userToRoomMap'][mockSocket.id] = room;
        const mockData = {
            property: 'openEndedAnswer',
            value: 'test',
        };
        const setPlayerPropertySpy = jest.spyOn(playerListService, 'setPlayerProperty');
        jest.spyOn(playerListService, 'organizerSocket').mockReturnValue(mockOrganizerSocket);
        roomGateway.answerSend(mockSocket as any, mockData.value);
        expect(setPlayerPropertySpy).toHaveBeenCalledWith(room, mockSocket, mockData);
        expect(playerListService.organizerSocket).toHaveBeenCalledWith(room);
        expect(mockOrganizerSocket.emit).toHaveBeenCalledWith('newOpenEndedAnswer', {
            playerName: playerListService.getPlayerProperty(room, mockSocket as any, 'name'),
            answer: mockData.value,
        });
    });

    it('should answer evaluated', () => {
        const mockPlayerSocket = { emit: jest.fn() } as any;
        const room = '1234';
        const grades = 1;
        roomGateway['userToRoomMap'][mockSocket.id] = room;
        const data = {
            playersName: 'testName',
            room: '1234',
            grade: grades,
        };
        const mockData = {
            property: 'answerGrade',
            value: grades,
        };
        const setPlayerPropertySpy = jest.spyOn(playerListService, 'setPlayerProperty');
        const getPlayerSocketSpy = jest.spyOn(playerListService, 'getPlayerSocket').mockReturnValue(mockPlayerSocket);
        roomGateway.answerEvaluated(mockSocket as any, data);
        expect(setPlayerPropertySpy).toHaveBeenCalledWith(room, playerListService.getPlayerSocket(room, data.playersName), mockData);
        expect(getPlayerSocketSpy).toHaveBeenCalledWith(room, data.playersName);
        expect(mockPlayerSocket.emit).toHaveBeenCalledWith('answersGrade', grades);
    });

    it('should show result', () => {
        const uploadSpy = jest.spyOn(roomGateway as any, 'socketBroadcastRoom');
        uploadSpy.mockImplementation(() => {
            return;
        });
        roomGateway.showResult(mockSocket as any);
        expect(roomGateway['socketBroadcastRoom']).toBeCalledWith(mockSocket, 'showQuestion');
    });

    it('should timer next question', () => {
        const uploadSpy = jest.spyOn(roomGateway as any, 'socketBroadcastRoom');
        uploadSpy.mockImplementation(() => {
            return;
        });
        roomGateway.timerNextQuestion(mockSocket as any);
        expect(roomGateway['socketBroadcastRoom']).toBeCalledWith(mockSocket, 'timerShowQuestion');
    });

    it('should go next question', () => {
        const room = '1234';
        roomGateway['userToRoomMap'][mockSocket.id] = room;
        const resetSpy = jest.spyOn(playerListService, 'resetAttributes');
        const sumChoiceSpy = jest.spyOn(roomGateway as any, 'sumChoice');
        const uploadSpy = jest.spyOn(roomGateway as any, 'uploadPlayers');
        const socketBroadcastRoomSpy = jest.spyOn(roomGateway as any, 'socketBroadcastRoom');
        resetSpy.mockImplementation(() => {
            return;
        });
        sumChoiceSpy.mockImplementation(() => {
            return;
        });
        uploadSpy.mockImplementation(() => {
            return;
        });
        socketBroadcastRoomSpy.mockImplementation(() => {
            return;
        });
        roomGateway.nextQuestion(mockSocket as any);
        expect(resetSpy).toHaveBeenCalledWith(room);
        expect(sumChoiceSpy).toHaveBeenCalledWith(mockSocket);
        expect(uploadSpy).toHaveBeenCalledWith(mockSocket, room);
        expect(socketBroadcastRoomSpy).toBeCalledWith(mockSocket, 'showNextQuestion');
    });

    it('should give up', () => {
        const mockOrganizerSocket = { emit: jest.fn() } as any;
        const room = '1234';
        roomGateway['userToRoomMap'][mockSocket.id] = room;
        const mockData = {
            property: 'isSurrender',
            value: true,
        };
        const setPlayerPropertySpy = jest.spyOn(playerListService, 'setPlayerProperty');
        playerListService.verifyAllFinish.returns(true);
        jest.spyOn(playerListService, 'organizerSocket').mockReturnValue(mockOrganizerSocket);
        const uploadSpy = jest.spyOn(roomGateway as any, 'uploadPlayers');
        uploadSpy.mockImplementation(() => {
            return;
        });
        roomGateway.giveUp(mockSocket as any);
        expect(setPlayerPropertySpy).toHaveBeenCalledWith(room, mockSocket, mockData);
        expect(playerListService.organizerSocket).toHaveBeenCalledWith(room);
        expect(mockOrganizerSocket.emit).toHaveBeenCalledWith('allFinish', true);
    });

    it('should emit "allGaveUp" when all players gave up', () => {
        const mockOrganizerSocket = { emit: jest.fn() } as any;
        const room = '1234';
        roomGateway['userToRoomMap'][mockSocket.id] = room;
        playerListService.verifyIfAllGaveUp.returns(true);
        jest.spyOn(playerListService, 'organizerSocket').mockReturnValue(mockOrganizerSocket);
        roomGateway.didAllGaveUp(mockSocket as any);
        expect(playerListService.organizerSocket).toHaveBeenCalledWith(room);
        expect(mockOrganizerSocket.emit).toHaveBeenCalledWith('allGaveUp');
    });

    it('should stop waiting', () => {
        const uploadSpy = jest.spyOn(roomGateway as any, 'socketBroadcastRoom');
        uploadSpy.mockImplementation(() => {
            return;
        });
        roomGateway.stopWaiting(mockSocket as any);
        expect(roomGateway['socketBroadcastRoom']).toBeCalledWith(mockSocket, 'stopWaiting');
    });

    it('should score player', () => {
        const mockOrganizerSocket = { emit: jest.fn() } as any;
        const room = '1234';
        roomGateway['userToRoomMap'][mockSocket.id] = room;
        const mockData = {
            property: 'score',
            value: 0,
        };
        const setPlayerPropertySpy = jest.spyOn(playerListService, 'setPlayerProperty');
        jest.spyOn(playerListService, 'organizerSocket').mockReturnValue(mockOrganizerSocket);
        const uploadSpy = jest.spyOn(roomGateway as any, 'uploadPlayers');
        uploadSpy.mockImplementation(() => {
            return;
        });
        roomGateway.scorePlayer(mockSocket as any, mockData.value);

        expect(playerListService.organizerSocket).toHaveBeenCalledWith(room);
        expect(setPlayerPropertySpy).toHaveBeenCalledWith(room, mockSocket, mockData);
    });

    it('should score player', () => {
        const mockOrganizerSocket = { emit: jest.fn() } as any;
        const room = '1234';
        roomGateway['userToRoomMap'][mockSocket.id] = room;
        const mockData = {
            property: 'score',
            value: 1,
        };
        const setPlayerPropertySpy = jest.spyOn(playerListService, 'setPlayerProperty');
        jest.spyOn(playerListService, 'organizerSocket').mockReturnValue(mockOrganizerSocket);
        const uploadSpy = jest.spyOn(roomGateway as any, 'uploadPlayers');
        uploadSpy.mockImplementation(() => {
            return;
        });
        roomGateway.scorePlayer(mockSocket as any, mockData.value);

        expect(playerListService.organizerSocket).toHaveBeenCalledWith(room);
        expect(setPlayerPropertySpy).toHaveBeenCalledWith(room, mockSocket, mockData);
    });

    it('should player first and two sockets come at the same time', () => {
        const room = '1234';
        roomGateway['userToRoomMap'][mockSocket.id] = room;
        roomGateway['isMethodRunning'][room] = true;
        const loggerSpy = jest.spyOn(logger, 'log');
        roomGateway.playerFirst(mockSocket as any);
        expect(loggerSpy).toHaveBeenCalledWith('Deux sockets sont arrivés en même temps.');
    });

    it('should player first and method running is false', () => {
        const room = '1234';
        roomGateway['userToRoomMap'][mockSocket.id] = room;
        roomGateway['isMethodRunning'][room] = false;
        const isFirstSpy = jest.spyOn(playerListService, 'setPlayerBonus').mockReturnValue(true);
        roomGateway.playerFirst(mockSocket as any);
        expect(isFirstSpy).toHaveBeenCalledWith(room, mockSocket);
        expect(mockSocket.emit).toHaveBeenCalledWith('isBonus', true);
    });

    it('should result ending game', () => {
        const room = 'test-room';
        roomGateway['userToRoomMap'][mockSocket.id] = room;
        playerListService.verifyIfOrganisator.returns(true);
        const finishSpy = jest.spyOn(roomGateway as any, 'finishedGame');
        const socketBroadcastRoomSpy = jest.spyOn(roomGateway as any, 'socketBroadcastRoom');
        const uploadSpy = jest.spyOn(roomGateway as any, 'uploadPlayers');
        const deleteRoomSpy = jest.spyOn(playerListService, 'deleteRoom');
        finishSpy.mockImplementation(() => {
            return;
        });
        socketBroadcastRoomSpy.mockImplementation(() => {
            return;
        });
        uploadSpy.mockImplementation(() => {
            return;
        });
        deleteRoomSpy.mockImplementation(() => {
            return;
        });
        const mockHistogram1: Histogram = {
            labelData: ['0', '50', '100'],
            realData: [1, 2, 3],
            colorData: ['rgba(252, 76, 111, 0.771)', 'rgba(255, 255, 0, 0.785)', 'rgba(12, 230, 164, 0.821)'],
        };
        const mockHistogramList: Histogram[] = [mockHistogram1];
        const finish = jest.spyOn(playerListService, 'getRoomProperty').mockReturnValue(true);
        const histogram = jest.spyOn(playerListService, 'getRoomProperty').mockReturnValue(mockHistogramList);
        roomGateway['server'] = mockServer as any;
        mockServer.to = jest.fn().mockReturnValue({
            emit: jest.fn(),
        });
        roomGateway.resultEndingGame(mockSocket as any);
        expect(finish).toHaveBeenCalledWith(room, 'isGameFinished');
        expect(histogram).toHaveBeenCalledWith(room, 'histogramList');
        expect(mockServer.to).toHaveBeenCalledWith(room);
        expect(mockServer.to().emit).toHaveBeenCalledWith('getGameFinished', mockHistogramList);
        expect(mockServer.to().emit).toHaveBeenCalledWith('sendHistogram', mockHistogramList);
    });

    it('should started game', () => {
        const room = 'test-room';
        roomGateway['userToRoomMap'][mockSocket.id] = room;
        roomGateway.startedGame(mockSocket as any);
        expect(playerListService.beginIsStarted.calledWith(room));
    });

    it('should finished game', () => {
        const room = 'test-room';
        roomGateway['userToRoomMap'][mockSocket.id] = room;
        roomGateway.finishedGame(mockSocket as any);
        expect(playerListService.endIsFinished.calledWith(room));
    });

    it('should add histogram', () => {
        const room = 'test-room';
        roomGateway['userToRoomMap'][mockSocket.id] = room;
        const mockData: Histogram = {
            labelData: ['1', '2', '3'],
            realData: [1, 2, 3],
            colorData: ['rgba(252, 76, 111, 0.771)', 'rgba(255, 255, 0, 0.785)', 'rgba(12, 230, 164, 0.821)'],
        };
        roomGateway.addHistogram(mockSocket as any, mockData);
        expect(playerListService.addHistogram.calledWith(room, mockData));
    });

    it('should add grade count', () => {
        const room = '1234';
        roomGateway['userToRoomMap'][mockSocket.id] = room;
        const mockData: Histogram = {
            labelData: ['0', '50', '100'],
            realData: [1, 2, 3],
            colorData: ['rgba(252, 76, 111, 0.771)', 'rgba(255, 255, 0, 0.785)', 'rgba(12, 230, 164, 0.821)'],
        };
        const addHistogramSpy = jest.spyOn(playerListService, 'addHistogram');
        addHistogramSpy.mockImplementation(() => {
            return;
        });
        roomGateway.addGradeCount(mockSocket as any, mockData.realData);
        expect(addHistogramSpy).toHaveBeenCalledWith(room, mockData);
        expect(mockSocket.emit).toHaveBeenCalledWith('resultatGrade', mockData);
    });

    it('should mute player', () => {
        const mockPlayerSocket = { emit: jest.fn() } as any;
        const room = '1234';
        const playerName = 'test';
        roomGateway['userToRoomMap'][mockSocket.id] = room;
        const isMuteSpy = jest.spyOn(playerListService, 'toggleIsMute').mockReturnValue(true);
        const playersSpy = jest.spyOn(playerListService, 'getPlayers').mockReturnValue([]);
        const getPlayerSpy = jest.spyOn(playerListService, 'getPlayerSocket').mockReturnValue(mockPlayerSocket);
        mockSocket.broadcast.to = jest.fn().mockReturnValue({
            emit: jest.fn(),
        });
        roomGateway.mutePlayer(mockSocket as any, playerName);
        expect(isMuteSpy).toHaveBeenCalledWith(playerName, room);
        expect(playersSpy).toHaveBeenCalledWith(room);
        expect(getPlayerSpy).toHaveBeenCalledWith(room, playerName);
        expect(mockPlayerSocket.emit).toHaveBeenCalledWith('isMute', true);
        expect(mockSocket.broadcast.to).toHaveBeenCalledWith(room);
        expect(mockSocket.broadcast.to().emit).toHaveBeenCalledWith('getPlayers', []);
    });

    it('should disconnect player when isGameFinished and he is organizer', () => {
        const room = 'test-room';
        roomGateway['userToRoomMap'][mockSocket.id] = room;
        const getRoomSpy = jest.spyOn(playerListService, 'getRoomProperty').mockReturnValue(true);
        const verifyOrganisatorSpy = jest.spyOn(playerListService, 'verifyIfOrganisator').mockReturnValue(true);
        roomGateway.disconnectPlayer(mockSocket as any);
        expect(getRoomSpy).toHaveBeenCalledWith(room, 'isGameFinished');
        expect(verifyOrganisatorSpy).toHaveBeenCalledWith(mockSocket.id, room);
        expect(playerListService.deleteRoom.calledWith(room)).toBe(true);
    });

    it('should disconnect player when is isGameFinished', () => {
        const room = 'test-room';
        roomGateway['userToRoomMap'][mockSocket.id] = room;
        const getRoomSpy = jest.spyOn(playerListService, 'getRoomProperty').mockReturnValue(true);
        roomGateway.disconnectPlayer(mockSocket as any);
        expect(getRoomSpy).toHaveBeenCalledWith(room, 'isGameFinished');
    });

    it('should disconnect player when is organizer', () => {
        const room = 'test-room';
        roomGateway['userToRoomMap'][mockSocket.id] = room;
        const verifyOrganisatorSpy = jest.spyOn(playerListService, 'verifyIfOrganisator').mockReturnValue(true);
        const deleteRoomSpy = jest.spyOn(playerListService, 'deleteRoom');
        deleteRoomSpy.mockImplementation(() => {
            return;
        });
        mockSocket.broadcast.to = jest.fn().mockReturnValue({
            emit: jest.fn(),
        });
        roomGateway.disconnectPlayer(mockSocket as any);
        expect(verifyOrganisatorSpy).toHaveBeenCalledWith(mockSocket.id, room);
        expect(mockSocket.broadcast.to).toHaveBeenCalledWith(room);
        expect(mockSocket.broadcast.to().emit).toHaveBeenCalledWith('viewToHome', true);
    });

    it('should disconnect player when is not started', () => {
        const room = 'test-room';
        roomGateway['userToRoomMap'][mockSocket.id] = room;
        const playerSpy = jest.spyOn(playerListService, 'deletePlayer');
        const getRoomSpy = jest.spyOn(playerListService, 'getRoomProperty').mockReturnValue(false);
        const uploadSpy = jest.spyOn(roomGateway, 'uploadNames');
        uploadSpy.mockImplementation(() => {
            return;
        });
        playerSpy.mockImplementation(() => {
            return;
        });
        roomGateway.disconnectPlayer(mockSocket as any);
        expect(getRoomSpy).toHaveBeenCalledWith(room, 'isGameStarted');
    });

    it('should disconnect player when is started', () => {
        const room = 'test-room';
        roomGateway['userToRoomMap'][mockSocket.id] = room;
        jest.spyOn(playerListService, 'getRoomProperty').mockImplementation((roomCode, property) => {
            if (roomCode === room && property === 'isGameStarted') {
                return true;
            }
            return false;
        });
        jest.spyOn(playerListService, 'verifyIfOrganisator').mockReturnValue(false);
        const giveUpSpy = jest.spyOn(roomGateway, 'giveUp');
        giveUpSpy.mockImplementation(() => {
            return;
        });
        roomGateway.disconnectPlayer(mockSocket as any);
        expect(giveUpSpy).toHaveBeenCalledWith(mockSocket);
    });

    it('should handle connection', () => {
        const logMock = jest.spyOn(logger, 'log');
        roomGateway.handleConnection(mockSocket as any);
        expect(logMock).toBeCalledWith(`Connexion par l'utilisateur avec id : ${mockSocket.id}`);
    });

    it('should handle disconnect', () => {
        const logMock = jest.spyOn(logger, 'log');
        roomGateway.handleDisconnect(mockSocket as any);
        expect(logMock).toBeCalledWith(`Déconnexion par l'utilisateur avec id : ${mockSocket.id}`);
    });

    it('should broadcast to room', () => {
        const event = 'test-event';
        const room = 'test-room';
        roomGateway['userToRoomMap'][mockSocket.id] = room;
        mockSocket.broadcast.to = jest.fn().mockReturnValue({
            emit: jest.fn(),
        });
        roomGateway['socketBroadcastRoom'](mockSocket as any, event);
        expect(mockSocket.broadcast.to).toHaveBeenCalledWith(room);
        expect(mockSocket.broadcast.to().emit).toHaveBeenCalledWith(event, true);
    });
});
