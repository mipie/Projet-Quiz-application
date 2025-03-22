import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator';
import { CreateChoice } from './create-choice.dto';
import { CreateQre } from './create-qre.dto';
// import { CreateQreParams } from './create-qre-params.dto';

export class CreateQuestion {
    @ApiProperty()
    @IsString()
    type: string;

    @ApiProperty()
    @IsString()
    text: string;

    @ApiProperty()
    @IsNumber()
    points: number;

    @ApiProperty({ type: [CreateChoice] })
    @IsArray()
    choices: CreateChoice[];

    @ApiProperty({ type: CreateQre, required: false })
    @IsOptional()
    qre: CreateQre;

    @ApiProperty()
    @IsString()
    imageURL: string[];
}
