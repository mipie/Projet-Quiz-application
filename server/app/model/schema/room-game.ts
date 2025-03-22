import { Game } from '@app/model/database/game';
import { Observer } from '@app/model/schema/observer';
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsNumber, IsObject, IsString } from 'class-validator';
import { Histogram } from './histogram';
import { Options } from './options-game';
import { PlayerList } from './player-list';

export class RoomGame {
    @ApiProperty()
    @IsString()
    room: string;

    @ApiProperty()
    @IsBoolean()
    isLock: boolean;

    @ApiProperty()
    @IsNumber()
    game: Game;

    @ApiProperty()
    @IsArray()
    banNames: string[];

    @ApiProperty()
    @IsBoolean()
    playerBonus: boolean;

    @ApiProperty()
    @IsBoolean()
    isGameStarted: boolean;

    @ApiProperty()
    @IsBoolean()
    isGameFinished: boolean;

    @ApiProperty()
    @IsArray()
    playerList: PlayerList[];

    @ApiProperty()
    @IsArray()
    histogramList: Histogram[];

    @ApiProperty()
    @IsObject()
    options: Options;

    @ApiProperty()
    @IsArray()
    observers: Observer[];

    @ApiProperty()
    @IsNumber()
    questionIndex: number;

    @ApiProperty()
    @IsBoolean()
    isAllFinish: boolean;

    @ApiProperty()
    @IsBoolean()
    disable: boolean;

    @ApiProperty()
    @IsBoolean()
    isNext: boolean;

    @ApiProperty()
    @IsBoolean()
    isShowResult: boolean;

    constructor(roomCode: string, game?: Game) {
        this.room = roomCode;
        this.game = game;
        this.isLock = false;
        this.banNames = [];
        this.playerBonus = false;
        this.isGameStarted = false;
        this.isGameFinished = false;
        this.playerList = [];
        this.histogramList = [];
        this.options = undefined;
        this.observers = [];
        this.questionIndex = 0;
        this.isAllFinish = false;
        this.disable = true;
        this.isNext = false;
        this.isShowResult = false;
    }
}
