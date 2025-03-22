import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsArray, IsOptional } from 'class-validator';
import { UpdateChoiceDto } from './update-choice.dto';

export class UpdateQuestionDto {
    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    type?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    text?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    points?: number;

    @ApiProperty({ type: [UpdateChoiceDto], required: false })
    @IsOptional()
    @IsArray()
    choices?: UpdateChoiceDto[];
}
