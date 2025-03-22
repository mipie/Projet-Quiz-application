import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, IsArray } from 'class-validator';
import { CreateQuestion } from './create-question.dto';

export class CreateGame {
    @ApiProperty()
    @IsString()
    $schema: string;

    @ApiProperty()
    @IsString()
    title: string;

    @ApiProperty()
    @IsString()
    description: string;

    @ApiProperty()
    @IsNumber()
    duration: number;

    @ApiProperty()
    @IsString()
    lastModification: string;

    @ApiProperty({ type: [CreateQuestion] })
    @IsArray()
    questions: CreateQuestion[];
}
