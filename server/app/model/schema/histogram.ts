import { ApiProperty } from '@nestjs/swagger';
import { IsArray } from 'class-validator';

export class Histogram {
    @ApiProperty()
    @IsArray()
    labelData: string[];

    @ApiProperty()
    @IsArray()
    realData: number[];

    @ApiProperty()
    @IsArray()
    colorData: string[];

    constructor(labelData: string[], realData: number[], colorData: string[]) {
        this.labelData = labelData;
        this.realData = realData;
        this.colorData = colorData;
    }
}
