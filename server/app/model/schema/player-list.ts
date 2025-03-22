import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsString } from 'class-validator';
import { Socket } from 'socket.io';

export class PlayerList {
    @ApiProperty()
    @IsString()
    name: string;

    @ApiProperty()
    @IsString()
    socket: Socket;

    @ApiProperty()
    @IsBoolean()
    isSurrender: boolean;

    @ApiProperty()
    @IsNumber()
    score: number;

    @ApiProperty()
    @IsNumber()
    choices: number[];

    @ApiProperty()
    @IsString()
    sliderValue: number;

    @ApiProperty()
    @IsString()
    lowerMargin: number;

    @ApiProperty()
    @IsString()
    upperMargin: number;

    @ApiProperty()
    @IsString()
    goodAnswer: number;

    @ApiProperty()
    @IsString()
    openEndedAnswer: string;

    @ApiProperty()
    @IsNumber()
    answerGrade: number;

    @ApiProperty()
    @IsNumber()
    bonus: number;

    @ApiProperty()
    @IsBoolean()
    awardedBonus: boolean;

    @ApiProperty()
    @IsBoolean()
    isFinish: boolean;

    @ApiProperty()
    @IsBoolean()
    isInteract: boolean;

    @ApiProperty()
    @IsBoolean()
    isInteractionOver5s: boolean;

    @ApiProperty()
    @IsBoolean()
    isMute: boolean;

    @ApiProperty()
    @IsNumber()
    nbGoodAnswersPlayer: number;

    @ApiProperty()
    @IsNumber()
    gainedPoints: number;

    @ApiProperty()
    @IsBoolean()
    isWaiting: boolean;

    @ApiProperty()
    @IsBoolean()
    isWaitingOrg: boolean;

    @ApiProperty()
    @IsBoolean()
    disable: boolean;

    constructor(name: string, socket: Socket) {
        this.name = name;
        this.socket = socket;
        this.isSurrender = false;
        this.score = 0;
        this.choices = [];
        this.awardedBonus = false;
        this.openEndedAnswer = undefined;
        this.answerGrade = 0;
        this.bonus = 0;
        this.isFinish = false;
        this.isInteract = false;
        this.isInteractionOver5s = false;
        this.isMute = false;
        this.nbGoodAnswersPlayer = 0;
        this.gainedPoints = 0;
        this.isWaiting = false;
        this.isWaitingOrg = false;
        this.disable = false;
        this.sliderValue = 0;
        this.openEndedAnswer = '';
    }
}
