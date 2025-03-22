import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsBoolean } from 'class-validator';

export class CreateChoice {
    @ApiProperty()
    @IsString()
    text: string;

    @ApiProperty()
    @IsBoolean()
    isCorrect: boolean;
}
