import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';

export class Options {
    @ApiProperty()
    @IsString()
    creator: string;

    @ApiProperty()
    @IsString()
    mode: string;

    @ApiProperty()
    @IsNumber()
    price: number;

    constructor(creator: string, mode: string, price: number) {
        this.creator = creator;
        this.mode = mode;
        this.price = price;
    }
}
