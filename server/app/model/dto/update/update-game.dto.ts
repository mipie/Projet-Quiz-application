import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, IsArray, IsOptional } from 'class-validator';
import { UpdateQuestionDto } from './update-question.dto';

export class UpdateGameDto {
    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    $schema?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    title?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    duration?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    lastModification?: string;

    @ApiProperty({ type: [UpdateQuestionDto], required: false })
    @IsOptional()
    @IsArray()
    questions?: UpdateQuestionDto[];
}
