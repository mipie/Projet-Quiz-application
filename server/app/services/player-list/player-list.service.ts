/* eslint-disable max-lines */
import { Histogram } from '@app/model/schema/histogram';
import { Observer } from '@app/model/schema/observer';
import { PlayerList } from '@app/model/schema/player-list';
import { RoomGame } from '@app/model/schema/room-game';
import { GameDataService } from '@app/services/game-data/game-data.service';
import { Injectable, Logger } from '@nestjs/common';
import { Socket } from 'socket.io';
import { INDEX_NOT_EXIST, MAX_CHOICE_INDEX, MAX_CODE_ROOM, SLICE_VALUE } from './player-list.service.constants';

@Injectable()
export class PlayerListService {
    private roomsGame: RoomGame[] = [];

    constructor(
        private gameDataService: GameDataService,
        private logger: Logger,
    ) {}

    organizerSocket(roomCode: string) {
        const room = this.getRoom(roomCode);
        if (room) return room.playerList[0].socket;
    }

    getNames(roomName: string): string[] {
        const existingRoom = this.getRoom(roomName);
        return existingRoom ? existingRoom.playerList.map((player) => player.name) : undefined;
    }

    getNamesBanned(roomName: string): string[] {
        const existingRoom = this.getRoom(roomName);
        return existingRoom ? existingRoom.banNames : undefined;
    }

    getRoomProperty<T extends keyof RoomGame>(roomCode: string, property: T) {
        const room = this.getRoom(roomCode);
        if (room) return room[property];
    }

    getPlayerProperty<T extends keyof PlayerList>(roomCode: string, socket: Socket, property: T) {
        const room = this.getRoom(roomCode);
        if (room) return room.playerList.find((player) => player.socket === socket)[property];
    }

    getPlayerSocket(roomCode: string, name: string) {
        const room = this.getRoom(roomCode);
        if (room) return room.playerList.find((player) => player.name === name).socket;
    }

    getObserverPlayer(roomCode: string, socket: Socket): Socket[] {
        const room = this.getRoom(roomCode);
        if (room) {
            return room.observers.filter((observer) => observer.userObserved === socket).map((observer) => observer.socket);
        }
        return [];
    }

    getLastHistogram(roomCode: string): Histogram {
        const room = this.getRoom(roomCode);
        if (room) {
            return room.histogramList[room.histogramList.length - 1];
        }
        return null;
    }

    getPlayers(roomCode: string): {
        name: string;
        isSurrender: boolean;
        score: number;
        bonus: number;
        isFinish: boolean;
        isInteract: boolean;
        isMute: boolean;
        nbGoodAnswersPlayer: number;
    }[] {
        const room = this.getRoom(roomCode);
        return room
            ? room.playerList.map((player) => {
                return {
                    name: player.name,
                    isSurrender: player.isSurrender,
                    score: player.score,
                    bonus: player.bonus,
                    isFinish: player.isFinish,
                    isInteract: player.isInteract,
                    isMute: player.isMute,
                    nbGoodAnswersPlayer: player.nbGoodAnswersPlayer,
                };
            })
            : undefined;
    }

    nextQuestion(roomCode: string) {
        const room = this.getRoom(roomCode);
        if (room) {
            room.questionIndex++;
            room.isAllFinish = false;
            room.isNext = false;
        }
    }

    setIsAllFinish(roomCode: string, isAllFinish: boolean) {
        const room = this.getRoom(roomCode);
        if (room) {
            room.isAllFinish = isAllFinish;
        }
    }

    setDisable(roomCode: string, disable: boolean) {
        const room = this.getRoom(roomCode);
        if (room) {
            room.disable = disable;
        }
    }

    setIsNext(roomCode: string, isNext: boolean) {
        const room = this.getRoom(roomCode);
        if (room) {
            room.isNext = isNext;
        }
    }

    setPlayerBonus(roomCode: string, socket: Socket): boolean {
        const room = this.getRoom(roomCode);
        if (room && !room.playerBonus) {
            const player = room.playerList.find((result) => result.socket === socket);
            player.bonus++;
            player.awardedBonus = true;
            room.playerBonus = true;
            return true;
        }
        return false;
    }

    setPlayerBonusQre(roomCode: string, socket: Socket): Socket[] {
        const room = this.getRoom(roomCode);
        const rewardedPlayers = [];

        if (!room) {
            return rewardedPlayers;
        }

        room.playerList.forEach((player) => {
            if (player.socket === socket && player.goodAnswer === player.sliderValue && !player.awardedBonus) {
                player.bonus++;
                player.awardedBonus = true;
                rewardedPlayers.push(player.socket);
            }
        });

        return rewardedPlayers;
    }

    setPlayerProperty<T extends keyof PlayerList>(roomCode: string, socket: Socket, data: { property: T; value: PlayerList[T] }): PlayerList[T] {
        const { property, value } = data;
        const room = this.getRoom(roomCode);
        if (room) {
            const player = room.playerList.find((result) => result.socket === socket);
            player[property] = value;
            return player[property];
        }
    }

    setChoice(socket: Socket, roomCode: string, choice: number) {
        const room = this.getRoom(roomCode);
        if (room) {
            const player = room.playerList.find((result) => result.socket === socket);
            player.isInteract = true;
            if (player.choices.includes(choice)) {
                const index = player.choices.indexOf(choice);
                player.choices.splice(index, 1);
            } else player.choices.push(choice);
        }
    }

    setQreValue(socket: Socket, roomCode: string, data: { value: number; lowerMargin: number; upperMargin: number; goodAnswer: number }) {
        const room = this.getRoom(roomCode);
        if (room) {
            const player = room.playerList.find((result) => result.socket === socket);
            player.isInteract = true;
            player.sliderValue = data.value;
            player.lowerMargin = data.lowerMargin;
            player.upperMargin = data.upperMargin;
            player.goodAnswer = data.goodAnswer;
        }
    }

    setPlayersDisable(roomCode: string, disable: boolean) {
        const room = this.getRoom(roomCode);
        if (room) {
            room.playerList.forEach((player) => {
                player.disable = disable;
            });
        }
    }

    setPlayersIsWait(roomCode: string, isWaiting: boolean) {
        const room = this.getRoom(roomCode);
        if (room) {
            room.playerList.forEach((player) => {
                player.isWaiting = isWaiting;
            });
        }
    }

    setPlayerIsWait(socket: Socket, roomCode: string, isWaiting: boolean) {
        const room = this.getRoom(roomCode);
        if (room) {
            const player = room.playerList.find((player) => player.socket.id === socket.id);
            player.isWaiting = isWaiting;
        }
    }

    setPlayersIsWaitOrg(roomCode: string, isWaitingOrg: boolean) {
        const room = this.getRoom(roomCode);
        if (room) {
            room.playerList.forEach((player) => {
                player.isWaitingOrg = isWaitingOrg;
            });
        }
    }

    setIsShowResult(roomCode: string, isShowResult: boolean) {
        const room = this.getRoom(roomCode);
        if (room) {
            room.isShowResult = isShowResult;
        }
    }

    setPlayerGainedPoints(socket: Socket, roomCode: string, gainedPoints: number) {
        const room = this.getRoom(roomCode);
        if (room) {
            const player = room.playerList.find((player) => player.socket.id === socket.id);
            player.gainedPoints = gainedPoints;
        }
    }

    setPlayerAnswer(socket: Socket, roomCode: string, answer: string) {
        const room = this.getRoom(roomCode);
        if (room) {
            const player = room.playerList.find((player) => player.socket.id === socket.id);
            player.openEndedAnswer = answer;
        }
    }

    verifyIfOrganisator(userId: string, roomName: string): boolean {
        const roomFound = this.getRoom(roomName);
        return this.verifyRoom(roomName) && roomFound.playerList[0].socket.id === userId;
    }

    verifyIfLocked(roomName: string): boolean {
        const existingRoom = this.getRoom(roomName);
        return !this.verifyRoom(roomName) ? undefined : !existingRoom.isLock;
    }

    verifyAllFinish(roomCode: string): boolean {
        const room = this.getRoom(roomCode);
        if (room) return room.playerList.every((player) => player.isFinish || player.isSurrender);
        return false;
    }

    verifyIfAllGaveUp(roomCode: string): boolean {
        const room = this.getRoom(roomCode);
        if (room) return room.playerList.filter((player) => !player.isSurrender).length < 2;
    }

    toggleIsMute(name: string, roomCode: string): boolean {
        const room = this.getRoom(roomCode);
        if (room) {
            const player = room.playerList.find((result) => result.name === name);
            player.isMute = !player.isMute;
            return player.isMute;
        }
    }

    changeLockState(roomName: string): boolean {
        const roomToUpdate = this.getRoom(roomName);
        if (roomToUpdate) {
            roomToUpdate.isLock = !roomToUpdate.isLock;
            return roomToUpdate.isLock;
        } else throw new Error(`Room with name ${roomName} not found.`);
    }

    changeObs(socket: Socket, roomCode: string, name: string) {
        const room = this.getRoom(roomCode);
        if (room) {
            const player = room.playerList.find((player) => player.name === name);
            const observer = room.observers.find((observer) => observer.socket === socket);
            observer.userObserved = player.socket;
            this.logger.log('j ai changer de vue:', observer);
        }
    }

    beginIsStarted(roomCode: string): void {
        const room = this.getRoom(roomCode);
        if (room) room.isGameStarted = true;
    }

    endIsFinished(roomCode: string): void {
        const room = this.getRoom(roomCode);
        if (room) {
            room.isGameFinished = true;
            room.playerList.forEach((player) => (player.isMute = false));
        }
    }

    resetAttributes(roomCode: string) {
        const room = this.getRoom(roomCode);
        if (room) {
            room.isShowResult = false;
            room.playerBonus = false;
            room.playerList.forEach((player) => (player.isFinish = false));
            room.playerList.forEach((player) => (player.isInteract = false));
            room.playerList.forEach((player) => (player.choices = []));
            room.playerList.forEach((player) => (player.isInteractionOver5s = false));
            room.playerList.forEach((player) => (player.awardedBonus = false));
            room.playerList.forEach((player) => (player.gainedPoints = 0));
            room.playerList.forEach((player) => (player.disable = false));
            room.playerList[0].isFinish = true;
        }
    }

    sumChoice(roomCode: string): number[] {
        const room = this.getRoom(roomCode);
        if (room) {
            const result = [0, 0, 0, 0];
            room.playerList.forEach((player) => {
                player.choices.forEach((choiceIndex) => {
                    if (choiceIndex >= 0 && choiceIndex < MAX_CHOICE_INDEX) result[choiceIndex]++;
                });
            });
            return result;
        }
        return [0, 0, 0, 0];
    }

    sumEstimateResponse(roomCode: string): number[] {
        const room = this.getRoom(roomCode);
        if (room) {
            const result = [0, 0, 0];
            room.playerList.forEach((player) => {
                if (player.lowerMargin !== undefined && player.upperMargin !== undefined) {
                    if (!(player.lowerMargin === 0 && player.upperMargin === 0)) {
                        if (player.sliderValue >= player.lowerMargin && player.sliderValue <= player.upperMargin) {
                            if (player.sliderValue !== player.goodAnswer) result[0]++;
                        }
                    }

                    if (player.sliderValue === player.goodAnswer) result[1]++;
                    else if (player.sliderValue < player.lowerMargin || player.sliderValue > player.upperMargin) result[2]++;
                }
            });
            return result;
        }
        return [0, 0, 0];
    }

    sumInteractions(roomCode: string): number[] {
        const room = this.getRoom(roomCode);
        if (room) {
            const result = [room.playerList.length - 1, 0];
            room.playerList.forEach((player, index) => {
                if (index !== 0 && !player.isInteractionOver5s) {
                    result[0]--;
                    result[1]++;
                }
            });
            return result;
        }
        return [0, 0];
    }

    addHistogram(roomCode: string, histogram: Histogram) {
        const room = this.getRoom(roomCode);
        if (room) room.histogramList.push(histogram);
    }

    addPlayer(roomName: string, playerName: string, socket: Socket): boolean {
        const existingRoom = this.getRoom(roomName);
        if (!this.verifyName(playerName, roomName) && !existingRoom.isLock) {
            const newPlayer = new PlayerList(playerName, socket);
            existingRoom.playerList.push(newPlayer);
            return true;
        }
        return false;
    }

    addObserver(roomName: string, observerName: string, socket: Socket): boolean {
        const existingRoom = this.getRoom(roomName);
        if (existingRoom.isGameStarted) {
            const socketOrganizer = existingRoom.playerList[0].socket;
            const newObserver = new Observer(observerName, socket, socketOrganizer);
            existingRoom.observers.push(newObserver);
            return true;
        }
        return false;
    }

    banPlayer(playerName: string, roomName: string): Socket | undefined {
        let socket: Socket;
        const roomFound = this.getRoom(roomName);
        if (roomFound) {
            const indexOfPlayer = roomFound.playerList.findIndex((player) => player.name === playerName);
            if (indexOfPlayer !== INDEX_NOT_EXIST) {
                const player = roomFound.playerList[indexOfPlayer];
                roomFound.banNames.push(player.name);
                socket = player.socket;
                roomFound.playerList.splice(indexOfPlayer, 1);
            }
        }
        return socket;
    }

    deletePlayer(userId: string, roomName: string): void {
        const roomFound = this.getRoom(roomName);
        if (roomFound) {
            const indexOfPlayer = roomFound.playerList.findIndex((player) => player.socket.id === userId);
            if (indexOfPlayer !== INDEX_NOT_EXIST) roomFound.playerList.splice(indexOfPlayer, 1);
        }
    }

    deleteObserver(userId: string, roomName: string): void {
        const roomFound = this.getRoom(roomName);
        if (roomFound) {
            const indexOfObserver = roomFound.observers.findIndex((observer) => observer.socket.id === userId);
            if (indexOfObserver !== INDEX_NOT_EXIST) roomFound.observers.splice(indexOfObserver, 1);
        }
    }

    deleteRoom(roomCode: string): void {
        const indexOfRoom = this.roomsGame.findIndex((room) => room.room === roomCode);
        if (indexOfRoom !== INDEX_NOT_EXIST) this.roomsGame.splice(indexOfRoom, 1);
    }

    getAttributRoom(roomCode: string): {
        questionIndex: number;
        isAllFinish: boolean;
        disable: boolean;
        isNext: boolean;
        answers: { playerName: string; answer: string }[];
    } {
        const room = this.getRoom(roomCode);
        if (room) {
            const answer = room.playerList.map((player) => ({
                playerName: player.name,
                answer: player.openEndedAnswer,
            }));
            this.logger.log(answer);
            return {
                questionIndex: room.questionIndex,
                isAllFinish: room.isAllFinish,
                disable: room.disable,
                isNext: room.isNext,
                answers: room.playerList
                    .filter((player) => player.openEndedAnswer !== '')
                    .map((player) => ({
                        playerName: player.name,
                        answer: player.openEndedAnswer,
                    })),
            };
        }
        return null;
    }

    getAttributPlayer(
        roomCode: string,
        socket: Socket,
    ): {
        questionIndex: number;
        disable: boolean;
        isNext: boolean;
        score: number;
        needBonus: boolean;
        selectedValue: number;
        gainedPoints: number;
        isShowResult: boolean;
        pointGrade: number;
        isWaiting: boolean;
        isWaitingOrg: boolean;
        selectedChoices: number[];
        answer: string;
    } {
        const room = this.getRoom(roomCode);
        if (room) {
            const observer = room.observers.find((person) => person.socket.id === socket.id);
            const player = room.playerList.find((player) => player.socket.id === observer.userObserved.id);
            return {
                questionIndex: room.questionIndex,
                disable: player.disable,
                isNext: room.isNext,
                score: player.score,
                needBonus: player.awardedBonus,
                selectedValue: player.sliderValue,
                gainedPoints: player.gainedPoints,
                isShowResult: room.isShowResult,
                pointGrade: player.answerGrade,
                isWaiting: player.isWaiting,
                isWaitingOrg: player.isWaitingOrg,
                selectedChoices: player.choices,
                answer: player.openEndedAnswer,
            };
        }
        return null;
    }

    getAllRoom(): {
        room: string;
        creator: string;
        name: string;
        mode: string;
        numberOfPlayers: number;
        observers: number;
        price: number;
        state: boolean;
    }[] {
        if (this.roomsGame) {
            const roomsGame = this.roomsGame.map((roomGame) => {
                return {
                    room: roomGame.room,
                    creator: roomGame.options.creator,
                    name: roomGame.game.title,
                    mode: roomGame.options.mode,
                    numberOfPlayers: roomGame.playerList.length - 1,
                    observers: roomGame.observers.length,
                    price: roomGame.options.price,
                    state: roomGame.isLock,
                };
            });
            return roomsGame;
        }
        return [];
    }

    async createRoom(socket: Socket, gameId: number, options: { creator: string; mode: string; price: number } | undefined): Promise<string> {
        const newRoom = new RoomGame(this.generateUniqueCode());

        const gameData = await this.gameDataService.getGame(gameId);
        if (gameData && gameData.game) newRoom.game = gameData.game;

        const newPlayer = new PlayerList('Organisateur', socket);
        newPlayer.isFinish = true;

        newRoom.playerList.push(newPlayer);
        newRoom.options = options;

        this.roomsGame.push(newRoom);
        return newRoom.room;
    }

    private generateUniqueCode(): string {
        let codeString: string;
        do {
            const uniqueCode: number = Math.round(Math.random() * MAX_CODE_ROOM);
            codeString = ('000' + uniqueCode).slice(SLICE_VALUE);
        } while (this.getRoom(codeString));
        return codeString;
    }

    private getRoom(roomName: string): RoomGame | undefined {
        return this.roomsGame.find((room) => room.room === roomName);
    }

    private verifyRoom(roomName: string): boolean {
        return this.getRoom(roomName) !== undefined;
    }

    private verifyName(name: string, roomName: string): boolean {
        const roomFound = this.getRoom(roomName);
        const nameFound = roomFound.playerList.find((player) => player.name.toLowerCase().trim() === name.toLowerCase().trim());
        const nameBanned = roomFound.banNames.find((player) => player.toLowerCase().trim() === name.toLowerCase().trim());
        return nameFound !== undefined || nameBanned !== undefined;
    }
}
