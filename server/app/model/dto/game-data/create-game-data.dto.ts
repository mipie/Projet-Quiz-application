import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsBoolean, IsObject } from 'class-validator';
import { CreateGame } from './create-game.dto';

export class CreateGameData {
    @ApiProperty()
    @IsNumber()
    id: number;

    @ApiProperty()
    @IsBoolean()
    isVisible: boolean;

    @ApiProperty()
    @IsBoolean()
    isChecked: boolean;

    @ApiProperty({ type: CreateGame })
    @IsObject()
    game: CreateGame;
}
