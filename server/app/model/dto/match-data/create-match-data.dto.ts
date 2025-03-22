import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';

export class CreateMatchData {
    @ApiProperty()
    @IsString()
    title: string;

    @ApiProperty()
    @IsString()
    startDate: string;

    @ApiProperty()
    @IsNumber()
    numberPlayers: number;

    @ApiProperty()
    @IsNumber()
    bestScore: number;
}
