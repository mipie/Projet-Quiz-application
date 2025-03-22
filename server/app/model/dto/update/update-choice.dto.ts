import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsBoolean, IsOptional } from 'class-validator';

export class UpdateChoiceDto {
    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    text?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsBoolean()
    isCorrect?: boolean;
}
