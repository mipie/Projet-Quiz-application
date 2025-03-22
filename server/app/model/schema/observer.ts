import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsString } from 'class-validator';
import { Socket } from 'socket.io';

export class Observer {
    @ApiProperty()
    @IsString()
    name: string;

    @ApiProperty()
    @IsString()
    socket: Socket;

    @ApiProperty()
    @IsString()
    userObserved: Socket;

    constructor(name: string, socket: Socket, userObserved: Socket) {
        this.name = name;
        this.socket = socket;
        this.userObserved = userObserved;
    }
}
