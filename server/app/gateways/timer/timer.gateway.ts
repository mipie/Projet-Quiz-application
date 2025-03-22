import { Injectable, Logger } from '@nestjs/common';
import { OnGatewayInit, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { DELAY_NORMAL_MODE, DELAY_PANIC_MODE, PORT } from './timer.gateway.constants';
import { ChatEvents } from './timer.gateway.events';

@WebSocketGateway(PORT, { cors: '*' })
@Injectable()
export class TimerGateway implements OnGatewayInit {
    @WebSocketServer() private server: Server;
    private userToRoomMap = {};
    private timersMap: { [room: string]: number } = {};
    private pauseState: { [room: string]: boolean } = {};
    private panicState: { [room: string]: boolean } = {};
    private interval1: NodeJS.Timeout;
    private interval2: NodeJS.Timeout;

    @SubscribeMessage(ChatEvents.StartTimer)
    startTimer(socket: Socket, data: { startValue: number; roomName: string }) {
        const userId = socket.id;
        const { startValue, roomName } = data;
        this.userToRoomMap[userId] = roomName;
        this.initializeTimerStates(startValue, roomName);
        this.server.to(roomName).emit('timer', this.getDataFromRoom(roomName));
    }

    @SubscribeMessage(ChatEvents.StopTimer)
    stopTimer(socket: Socket) {
        const userId = socket.id;
        const room = this.userToRoomMap[userId];
        if (this.timersMap[room]) this.deleteTimerStates(room);
    }

    @SubscribeMessage(ChatEvents.PanicTimer)
    panicTimer(socket: Socket, time: number) {
        const userId = socket.id;
        const timer = time;
        const room = this.userToRoomMap[userId];

        if (this.timersMap[room] && room) {
            this.panicState[room] = true;
            if (this.timersMap[room] <= timer && this.panicState[room]) {
                this.server.to(room).emit('playSound');
                this.server.to(room).emit('timer', this.getDataFromRoom(room));
            }
        }
    }

    @SubscribeMessage(ChatEvents.PauseTimer)
    pauseTimer(socket: Socket, pause: boolean) {
        const userId = socket.id;
        const room = this.userToRoomMap[userId];
        if (room && this.timersMap[room]) {
            this.pauseState[room] = pause;
            this.server.to(room).emit('timer', this.getDataFromRoom(room));
        }
    }

    @SubscribeMessage('timerGame')
    timerGame(socket: Socket, room: string) {
        if (room && this.timersMap[room]) {
            setTimeout(() => {
                socket.emit('timer', this.getDataFromRoom(room));
            }, 100);
        }
    }

    afterInit() {
        this.interval1 = setInterval(() => this.emitTime(), DELAY_NORMAL_MODE);
        this.interval2 = setInterval(() => this.emitTimePanic(), DELAY_PANIC_MODE);
    }

    private emitTime() {
        for (const [room, value] of Object.entries(this.timersMap)) {
            if (value > 0 && !this.pauseState[room] && !this.panicState[room]) {
                this.timersMap[room]--;
                this.server.to(room).emit('timer', this.getDataFromRoom(room));
            }
        }
    }

    private emitTimePanic() {
        for (const [room, value] of Object.entries(this.timersMap)) {
            if (value > 0 && !this.pauseState[room] && this.panicState[room]) {
                this.timersMap[room]--;
                this.server.to(room).emit('timer', this.getDataFromRoom(room));
            }
        }
    }

    private getDataFromRoom(room: string): { time: number; pauseState: boolean; panicState: boolean } {
        const data = {
            time: this.timersMap[room],
            pauseState: this.pauseState[room],
            panicState: this.panicState[room],
        };
        Logger.log("le temps est:" + this.timersMap[room])
        return data;
    }

    private initializeTimerStates(startValue: number, room: string) {
        this.timersMap[room] = startValue;
        this.pauseState[room] = false;
        this.panicState[room] = false;
    }

    private deleteTimerStates(room: string) {
        delete this.timersMap[room];
        delete this.pauseState[room];
        delete this.panicState[room];
    }
}
