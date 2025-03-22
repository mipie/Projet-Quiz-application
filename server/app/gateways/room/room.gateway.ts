/* eslint-disable no-unused-vars */
/* eslint-disable max-lines */
import { PlayerList } from '@app/model/schema/player-list';
import { PlayerListService } from '@app/services/player-list/player-list.service';
import { Injectable, Logger } from '@nestjs/common';
import { OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PORT } from './room.gateway.constants';
import { RoomEvents } from './room.gateway.events';

@WebSocketGateway(PORT, { cors: '*' })
@Injectable()
export class RoomGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer() private server: Server;

    private userToRoomMap = {};
    private isMethodRunning = {};

    constructor(
        private readonly logger: Logger,
        private roomService: PlayerListService,
    ) {}

    @SubscribeMessage(RoomEvents.CreateRoom)
    async createRoom(socket: Socket, data: { id: number; options: { creator: string; mode: string; price: number } | undefined }): Promise<void> {
        const { id, options } = data;
        const room = await this.roomService.createRoom(socket, id, options);
        this.joinRoom(socket, room);
        socket.emit('gameCreate', room);
        //
        this.getAllRooms(socket);
    }

    @SubscribeMessage(RoomEvents.JoinRoom)
    joinRoom(socket: Socket, room: string) {
        this.userToRoomMap[socket.id] = room;
        socket.join(room);
        //
        this.getAllRooms(socket);
    }

    @SubscribeMessage(RoomEvents.VerifyRoom)
    verifyRoom(socket: Socket, roomCode: string): void {
        this.logger.log(this.roomService.getRoomProperty(roomCode, 'isGameStarted'));
        if (!this.roomService.getRoomProperty(roomCode, 'isGameStarted')) {
            socket.emit('verifiedCode', this.roomService.verifyIfLocked(roomCode));
        } else {
            socket.emit('seeAsObserver');
        }
    }

    @SubscribeMessage(RoomEvents.JoinGameByName)
    verifyName(socket: Socket, data: { code: string; name: string }) {
        const { code, name } = data;
        const success = this.roomService.addPlayer(code, name, socket);
        if (success) {
            this.joinRoom(socket, code);
            this.logger.log(`Dans la room ${code}, ${name} est admis.`);
            socket.emit('receiveId', this.roomService.getRoomProperty(code, 'game'));
        }
        socket.emit('nameAdd', success);
    }

    @SubscribeMessage('joinAsObserver')
    joinAsObserver(socket: Socket, data: { code: string; name: string }) {
        const { code, name } = data;
        const success = this.roomService.addObserver(code, name, socket);
        if (success) {
            this.joinRoom(socket, code);
            this.logger.log(`Dans la room ${code}, ${name} est admis en tant qu'observateur.`);
            socket.emit('goObserved', this.roomService.getRoomProperty(code, 'game'));
        }
    }

    @SubscribeMessage(RoomEvents.UploadNames)
    uploadNames(socket: Socket, code: string) {
        this.server.to(code).emit('getUsers', this.roomService.getNames(code));
        this.server.to(code).emit('getBanned', this.roomService.getNamesBanned(code));
    }

    @SubscribeMessage(RoomEvents.UploadPlayers)
    uploadPlayers(socket: Socket, roomCode: string) {
        const players = this.roomService.getPlayers(roomCode);
        this.server.to(roomCode).emit('getPlayers', players);
    }

    @SubscribeMessage(RoomEvents.ToggleLock)
    toggleLock(socket: Socket) {
        const roomCode = this.userToRoomMap[socket.id];
        if (this.roomService.verifyIfOrganisator(socket.id, roomCode)) {
            const isLocked = this.roomService.changeLockState(roomCode);
            this.server.to(roomCode).emit('lockToggled', isLocked);
            //
            this.getAllRooms(socket);
        }
    }

    @SubscribeMessage(RoomEvents.BeginGame)
    beginGame(socket: Socket, roomCode: string): void {
        if (this.roomService.verifyIfOrganisator(socket.id, roomCode)) {
            const isViewForOrganizer = true;
            socket.emit('goToViews', isViewForOrganizer);
            socket.broadcast.to(roomCode).emit('goToViews', !isViewForOrganizer);
        } else this.logger.log(`${socket.id} is not a organizer.`);
    }

    @SubscribeMessage('observerSet')
    observerSet(socket: Socket, roomCode: string): void {
        const attribut = this.roomService.getAttributRoom(roomCode);
        this.logger.log(attribut);
        socket.emit('setObserver', attribut);
        const result = this.roomService.sumChoice(roomCode);
        socket.emit('resultChoice', result);
        const resultInteract = this.roomService.sumInteractions(roomCode);
        socket.emit('resultInteractions', resultInteract);
        const resultGrade = this.roomService.getLastHistogram(roomCode);
        socket.emit('resultatGrade', resultGrade);
        const resultEstimate = this.roomService.sumEstimateResponse(roomCode);
        socket.emit('resultEstimateResponse', resultEstimate);
    }

    @SubscribeMessage('obsPlayerSet')
    obsPlayerSet(socket: Socket, roomCode: string): void {
        const attribut = this.roomService.getAttributPlayer(roomCode, socket);
        this.logger.log(attribut);
        setTimeout(() => {
            socket.emit('setObsPlayer', attribut);
        }, 100);
    }

    @SubscribeMessage(RoomEvents.Message)
    handleMessage(socket: Socket, data: { name: string; message: string }) {
        const room = this.userToRoomMap[socket.id];
        const { name, message } = data;
        socket.broadcast.to(room).emit('newMessage', { author: name, chatMessage: message });
    }

    @SubscribeMessage(RoomEvents.PlayerBan)
    playerBan(socket: Socket, playerName: string) {
        const room = this.userToRoomMap[socket.id];
        const socketBan = this.roomService.banPlayer(playerName, room);
        socketBan.emit('gotBanned');
        setTimeout(() => {
            socketBan.disconnect(true);
        }, 100);
        this.uploadNames(socket, room);
        //
        this.getAllRooms(socket);
    }

    @SubscribeMessage(RoomEvents.QuitGame)
    quitGame(socket: Socket): void {
        const roomCode = this.userToRoomMap[socket.id];
        if (this.roomService.verifyIfOrganisator(socket.id, roomCode)) {
            this.server.to(roomCode).emit('viewToHome', true);
            this.roomService.deleteRoom(roomCode);
        } else if (this.userToRoomMap[socket.id]) {
            socket.emit('viewToHome', false);
            this.roomService.deletePlayer(socket.id, roomCode);
            this.uploadNames(socket, roomCode);
        }
        //
        this.getAllRooms(socket);
        setTimeout(() => {
            socket.disconnect(true);
        }, 100);
    }

    @SubscribeMessage('quitObserved')
    quitObserved(socket: Socket): void {
        const roomCode = this.userToRoomMap[socket.id];
        this.roomService.deleteObserver(socket.id, roomCode);
        //
        this.getAllRooms(socket);
    }

    @SubscribeMessage(RoomEvents.SetChoice)
    setChoice(socket: Socket, choice: number) {
        const room = this.userToRoomMap[socket.id];
        choice = --choice;
        this.roomService.setChoice(socket, room, choice);
        const observers = this.roomService.getObserverPlayer(room, socket);
        observers.forEach((observers) => {
            observers.emit('playerChoice', choice);
        });
        this.sumChoice(this.roomService.organizerSocket(room));
        this.uploadPlayers(this.roomService.organizerSocket(room), room);
    }

    @SubscribeMessage('userAnswer')
    userAnswer(socket: Socket, answer: string) {
        const room = this.userToRoomMap[socket.id];
        this.roomService.setPlayerAnswer(socket, room, answer);
        const observers = this.roomService.getObserverPlayer(room, socket);
        observers.forEach((observers) => {
            observers.emit('answerObs', answer);
        });
    }

    @SubscribeMessage(RoomEvents.SetQreValue)
    setQreValue(socket: Socket, data: { value: number; lowerMargin: number; upperMargin: number; goodAnswer: number }) {
        const room = this.userToRoomMap[socket.id];
        this.roomService.setQreValue(socket, room, data);
        this.sumEstimateResponse(this.roomService.organizerSocket(room));
        const observers = this.roomService.getObserverPlayer(room, socket);
        observers.forEach((observers) => {
            observers.emit('selectValueObs', data.value);
        });
        this.uploadPlayers(this.roomService.organizerSocket(room), room);
    }

    @SubscribeMessage(RoomEvents.Interactif)
    setInteractif(socket: Socket, hasInteractedUnder5s: boolean) {
        this.logger.log(hasInteractedUnder5s);
        const room = this.userToRoomMap[socket.id];
        const data: { property: keyof PlayerList; value: boolean } = { property: undefined, value: undefined };
        if (hasInteractedUnder5s) {
            data.property = 'isInteract';
            data.value = true;
            this.roomService.setPlayerProperty(room, socket, data);
        }
        if (hasInteractedUnder5s && this.roomService.getPlayerProperty(room, socket, 'isInteractionOver5s')) return;
        data.property = 'isInteractionOver5s';
        data.value = hasInteractedUnder5s;
        this.roomService.setPlayerProperty(room, socket, data);
        this.sumInteractions(socket);
        this.uploadPlayers(this.roomService.organizerSocket(room), room);
    }

    @SubscribeMessage('sumInteractions')
    sumInteractions(socket: Socket) {
        const room = this.userToRoomMap[socket.id];
        const result = this.roomService.sumInteractions(room);
        const observers = this.roomService.getObserverPlayer(room, this.roomService.organizerSocket(room));
        observers.forEach((observers) => {
            observers.emit('resultInteractions', result);
        });
        this.roomService.organizerSocket(room).emit('resultInteractions', result);
    }

    @SubscribeMessage(RoomEvents.SumChoice)
    sumChoice(socket: Socket) {
        const room = this.userToRoomMap[socket.id];
        const result = this.roomService.sumChoice(room);
        const observers = this.roomService.getObserverPlayer(room, socket);
        observers.forEach((observers) => {
            observers.emit('resultChoice', result);
        });
        socket.emit('resultChoice', result);
    }

    @SubscribeMessage(RoomEvents.SumEstimateResponse)
    sumEstimateResponse(socket: Socket) {
        const room = this.userToRoomMap[socket.id];
        const result = this.roomService.sumEstimateResponse(room);
        const observers = this.roomService.getObserverPlayer(room, socket);
        observers.forEach((observers) => {
            observers.emit('resultEstimateResponse', result);
        });
        socket.emit('resultEstimateResponse', result);
    }

    @SubscribeMessage(RoomEvents.IsFinish)
    setIsFinish(socket: Socket, openEndedAnswer?: string) {
        const room = this.userToRoomMap[socket.id];
        const data: { property: keyof PlayerList; value: boolean } = {
            property: 'isFinish',
            value: true,
        };
        const obsPlayer = this.roomService.getObserverPlayer(room, socket);
        obsPlayer.forEach((observers) => {
            observers.emit('playerfinish', true);
        });
        this.roomService.setPlayerProperty(room, socket, data);
        const playerDisable: { property: keyof PlayerList; value: boolean } = {
            property: 'disable',
            value: true,
        };
        this.roomService.setPlayerProperty(room, socket, playerDisable);
        const obsOrg = this.roomService.getObserverPlayer(room, this.roomService.organizerSocket(room));
        if (this.roomService.verifyAllFinish(room)) {
            obsOrg.forEach((observers) => {
                observers.emit('allFinish', true);
            });
            this.roomService.setIsAllFinish(room, true);
            this.roomService.setIsNext(room, true);
            this.roomService.organizerSocket(room).emit('allFinish', true);
            this.roomService.organizerSocket(room).emit('allQCMEvaluated', true);
        } else {
            socket.emit('waitPlayer', true);
            obsPlayer.forEach((observers) => {
                observers.emit('waitPlayer', true);
            });
            this.roomService.setPlayerIsWait(socket, room, true);
        }
        if (openEndedAnswer) {
            const data: { property: keyof PlayerList; value: string } = {
                property: 'openEndedAnswer',
                value: openEndedAnswer,
            };
            this.roomService.setPlayerProperty(room, socket, data);
            obsOrg.forEach((observers) => {
                observers.emit('newOpenEndedAnswer', {
                    playerName: this.roomService.getPlayerProperty(room, socket, 'name'),
                    answer: openEndedAnswer,
                });
            });
            this.roomService.organizerSocket(room).emit('newOpenEndedAnswer', {
                playerName: this.roomService.getPlayerProperty(room, socket, 'name'),
                answer: openEndedAnswer,
            });
        }
        this.uploadPlayers(this.roomService.organizerSocket(room), room);
    }

    @SubscribeMessage('answerSend')
    answerSend(socket: Socket, answerSend: string) {
        const room = this.userToRoomMap[socket.id];
        const data: { property: keyof PlayerList; value: string } = {
            property: 'openEndedAnswer',
            value: answerSend,
        };
        this.roomService.setPlayerProperty(room, socket, data);
        this.roomService.organizerSocket(room).emit('newOpenEndedAnswer', {
            playerName: this.roomService.getPlayerProperty(room, socket, 'name'),
            answer: answerSend,
        });
        const obsOrg = this.roomService.getObserverPlayer(room, this.roomService.organizerSocket(room));
        obsOrg.forEach((observers) => {
            observers.emit('newOpenEndedAnswer', {
                playerName: this.roomService.getPlayerProperty(room, socket, 'name'),
                answer: answerSend,
            });
        });
    }

    @SubscribeMessage(RoomEvents.AnswerEvaluated)
    answerEvaluated(socket: Socket, data: { playersName: string; room: string; grade: number }) {
        const { playersName, room, grade } = data;
        const dataToUpdate: { property: keyof PlayerList; value: number } = {
            property: 'answerGrade',
            value: grade,
        };
        const resetAnswer: { property: keyof PlayerList; value: string } = {
            property: 'openEndedAnswer',
            value: '',
        };
        const observers = this.roomService.getObserverPlayer(room, this.roomService.organizerSocket(room));
        observers.forEach((observers) => {
            observers.emit('orgGiveGrade', playersName);
        });
        this.roomService.setPlayerProperty(room, this.roomService.getPlayerSocket(room, playersName), dataToUpdate);
        this.roomService.setPlayerProperty(room, this.roomService.getPlayerSocket(room, playersName), resetAnswer);
        this.roomService.getPlayerSocket(room, playersName).emit('answersGrade', grade);
        const obsPlayers = this.roomService.getObserverPlayer(room, socket);
        obsPlayers.forEach((obsPlayer) => {
            obsPlayer.emit('answersGrade', grade);
        });
    }

    @SubscribeMessage(RoomEvents.ShowResult)
    showResult(socket: Socket) {
        const room = this.userToRoomMap[socket.id];
        if (room) {
            this.roomService.setDisable(room, false);
            this.roomService.setPlayersDisable(room, true);
            this.roomService.setPlayersIsWaitOrg(room, true);
            this.roomService.setPlayersIsWait(room, false);
            this.roomService.setIsShowResult(room, true);
        }

        setTimeout(() => {
            this.socketBroadcastRoom(socket, 'showQuestion');
        }, 100);
    }

    @SubscribeMessage(RoomEvents.TimerNextQuestion)
    timerNextQuestion(socket: Socket) {
        const room = this.userToRoomMap[socket.id];
        if (room) {
            this.roomService.setDisable(room, true);
            this.roomService.setIsNext(room, true);
            this.roomService.setPlayersIsWaitOrg(room, false);
        }
        this.socketBroadcastRoom(socket, 'timerShowQuestion');
    }

    @SubscribeMessage(RoomEvents.NextQuestion)
    nextQuestion(socket: Socket) {
        const room = this.userToRoomMap[socket.id];
        this.roomService.resetAttributes(room);
        this.roomService.nextQuestion(room);
        this.sumChoice(socket);
        this.uploadPlayers(socket, room);
        this.socketBroadcastRoom(socket, 'showNextQuestion');
    }

    @SubscribeMessage(RoomEvents.GiveUp)
    giveUp(socket: Socket) {
        const room = this.userToRoomMap[socket.id];
        const data: { property: keyof PlayerList; value: boolean } = {
            property: 'isSurrender',
            value: true,
        };
        this.roomService.setPlayerProperty(room, socket, data);
        this.uploadPlayers(this.roomService.organizerSocket(room), room);
        if (this.roomService.verifyAllFinish(room)) {
            this.roomService.setIsAllFinish(room, true);
            this.roomService.organizerSocket(room).emit('allFinish', true);
        }
        this.didAllGaveUp(socket);
    }

    @SubscribeMessage(RoomEvents.DidAllGiveUp)
    didAllGaveUp(socket: Socket) {
        // jai modifier un peu pour que quand tout le monde a abandonner une partie, le jeu s'efface de la liste cuz la room est delete  //
        const room = this.userToRoomMap[socket.id];
        if (this.roomService.verifyIfAllGaveUp(room)) {
            this.socketBroadcastRoom(this.roomService.organizerSocket(room), 'viewToHome');
            this.roomService.organizerSocket(room).emit('allGaveUp');
            this.getAllRooms(socket);
            this.roomService.deleteRoom(room);
        }
    }

    @SubscribeMessage('stopWaiting')
    stopWaiting(socket: Socket) {
        const room = this.userToRoomMap[socket.id];
        this.roomService.setPlayersIsWait(room, false);
        this.socketBroadcastRoom(socket, 'stopWaiting');
    }

    @SubscribeMessage(RoomEvents.ScorePlayer)
    scorePlayer(socket: Socket, score: number) {
        this.logger.log(score);
        const room = this.userToRoomMap[socket.id];
        const data: { property: keyof PlayerList; value: number } = {
            property: 'score',
            value: score ? score : 0,
        };
        const gainedPoints = score - this.roomService.getPlayerProperty(room, socket, 'score');
        this.roomService.setPlayerGainedPoints(socket, room, gainedPoints);
        const observers = this.roomService.getObserverPlayer(room, socket);
        observers.forEach((observers) => {
            observers.emit('obsScore', score);
        });
        this.roomService.setPlayerProperty(room, socket, data);
        this.uploadPlayers(this.roomService.organizerSocket(room), room);
    }

    @SubscribeMessage(RoomEvents.NbGoodAnswersPlayer)
    nbGoodAnswersPlayer(socket: Socket, nbGoodAnswersPlayer: number) {
        const room = this.userToRoomMap[socket.id];
        const data: { property: keyof PlayerList; value: number } = {
            property: 'nbGoodAnswersPlayer',
            value: nbGoodAnswersPlayer ? nbGoodAnswersPlayer : 0,
        };
        this.roomService.setPlayerProperty(room, socket, data);
        this.uploadPlayers(this.roomService.organizerSocket(room), room);
    }

    @SubscribeMessage(RoomEvents.PlayerFirst)
    playerFirst(socket: Socket) {
        const room = this.userToRoomMap[socket.id];
        if (this.isMethodRunning[room]) {
            this.logger.log('Deux sockets sont arrivés en même temps.');
            return;
        }
        this.isMethodRunning[room] = true;
        try {
            const isFirst = this.roomService.setPlayerBonus(room, socket);
            if (isFirst) {
                const observers = this.roomService.getObserverPlayer(room, socket);
                socket.emit('isBonus', true);
                observers.forEach((observers) => {
                    observers.emit('isBonus', true);
                });
            }
        } finally {
            this.isMethodRunning[room] = false;
        }
    }

    @SubscribeMessage(RoomEvents.ExactAnswer)
    exactAnswer(socket: Socket) {
        const room = this.userToRoomMap[socket.id];
        try {
            const rewardedPlayers = this.roomService.setPlayerBonusQre(room, socket);
            rewardedPlayers.forEach((playerSocket) => {
                const observers = this.roomService.getObserverPlayer(room, playerSocket);
                playerSocket.emit('isBonus', true);
                observers.forEach((observers) => {
                    observers.emit('isBonus', true);
                });
            });
        } catch (err) {
            this.logger.error("Erreur lors de l'évaluation de la réponse exacte.", err);
        }
    }

    @SubscribeMessage(RoomEvents.ResultEndingGame)
    resultEndingGame(socket: Socket): void {
        const roomCode = this.userToRoomMap[socket.id];
        if (this.roomService.verifyIfOrganisator(socket.id, roomCode)) {
            this.finishedGame(socket);
            this.socketBroadcastRoom(socket, 'redirectResult'); // switch ligne pour que isGameFinished soit avant redirectResult logique sa //
            const finish = this.roomService.getRoomProperty(roomCode, 'isGameFinished');
            setTimeout(() => {
                this.server.to(roomCode).emit('getGameFinished', finish);
                // this.socketBroadcastRoom(socket, 'redirectResult');
                this.uploadPlayers(socket, roomCode);
                const histogram = this.roomService.getRoomProperty(roomCode, 'histogramList');
                this.server.to(roomCode).emit('sendHistogram', histogram);
                this.roomService.deleteRoom(roomCode);
                //
                this.getAllRooms(socket);
            }, 500);
        }
    }

    @SubscribeMessage(RoomEvents.StartedGame)
    startedGame(socket: Socket) {
        const roomCode = this.userToRoomMap[socket.id];
        this.roomService.beginIsStarted(roomCode);
    }

    @SubscribeMessage(RoomEvents.FinishedGame)
    finishedGame(socket: Socket) {
        const roomCode = this.userToRoomMap[socket.id];
        this.roomService.endIsFinished(roomCode);
    }

    @SubscribeMessage('addHistogram')
    addHistogram(socket: Socket, data: { labelData: string[]; realData: number[]; colorData: string[] }) {
        const roomCode = this.userToRoomMap[socket.id];
        this.roomService.addHistogram(roomCode, data);
    }

    @SubscribeMessage('addGradeCount')
    addGradeCount(socket: Socket, gradeCount: number[]) {
        const roomCode = this.userToRoomMap[socket.id];
        const data = {
            labelData: ['0', '50', '100'],
            realData: gradeCount,
            colorData: ['rgba(252, 76, 111, 0.771)', 'rgba(255, 255, 0, 0.785)', 'rgba(12, 230, 164, 0.821)'],
        };
        this.roomService.addHistogram(roomCode, data);
        const observers = this.roomService.getObserverPlayer(roomCode, socket);
        observers.forEach((observers) => {
            observers.emit('resultatGrade', data);
        });
        socket.emit('resultatGrade', data);
    }

    @SubscribeMessage('mutePlayer')
    mutePlayer(socket: Socket, name: string) {
        const roomCode = this.userToRoomMap[socket.id];
        const isMute = this.roomService.toggleIsMute(name, roomCode);
        const player = this.roomService.getPlayerSocket(roomCode, name);
        player.emit('isMute', isMute);
        const players = this.roomService.getPlayers(roomCode);
        socket.broadcast.to(roomCode).emit('getPlayers', players);
    }

    @SubscribeMessage('changeObs')
    changeObs(socket: Socket, name: string) {
        const roomCode = this.userToRoomMap[socket.id];
        if (roomCode) {
            this.roomService.changeObs(socket, roomCode, name);
            if (name === 'Organisateur') {
                this.observerSet(socket, roomCode);
            } else {
                this.obsPlayerSet(socket, roomCode);
            }
        }
    }

    @SubscribeMessage(RoomEvents.ReloadGame)
    disconnectPlayer(socket: Socket): void {
        const roomCode = this.userToRoomMap[socket.id];
        if (roomCode) {
            if (this.roomService.getRoomProperty(roomCode, 'isGameFinished') && this.roomService.verifyIfOrganisator(socket.id, roomCode)) {
                this.roomService.deleteRoom(roomCode);
            } else if (this.roomService.getRoomProperty(roomCode, 'isGameFinished')) {
                return;
            } else if (this.roomService.verifyIfOrganisator(socket.id, roomCode)) {
                socket.broadcast.to(roomCode).emit('viewToHome', true);
                this.roomService.deleteRoom(roomCode);
            } else if (!this.roomService.getRoomProperty(roomCode, 'isGameStarted')) {
                this.roomService.deletePlayer(socket.id, roomCode);
                this.uploadNames(socket, roomCode);
            } else if (this.roomService.getRoomProperty(roomCode, 'isGameStarted')) {
                this.giveUp(socket);
            }
        }
    }

    @SubscribeMessage(RoomEvents.GetAllRooms)
    getAllRooms(socket: Socket): void {
        this.server.emit('actualRooms', this.roomService.getAllRoom());
    }

    handleConnection(socket: Socket) {
        this.logger.log(`Connexion par l'utilisateur avec id : ${socket.id}`);
    }

    handleDisconnect(socket: Socket) {
        this.logger.log(`Déconnexion par l'utilisateur avec id : ${socket.id}`);
    }

    private socketBroadcastRoom(socket: Socket, event: string) {
        const room = this.userToRoomMap[socket.id];
        if (room) socket.broadcast.to(room).emit(event, true);
    }
}
