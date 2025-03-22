/* eslint-disable prettier/prettier */
import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';
// eslint-disable-next-line prettier/prettier

export class CreateQre {
    @ApiProperty()
    @IsNumber()
    lowerBound: number;

    @ApiProperty()
    @IsNumber()
    goodAnswer: number;

    @ApiProperty()
    @IsNumber()
    margin: number;

    @ApiProperty()
    @IsNumber()
    upperBound: number;
}
