import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsBoolean, IsObject, IsOptional } from 'class-validator';
import { UpdateGameDto } from './update-game.dto';

export class UpdateGameDataDto {
    @ApiProperty()
    @IsNumber()
    id: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsBoolean()
    isVisible?: boolean;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsBoolean()
    isChecked?: boolean;

    @ApiProperty({ type: UpdateGameDto, required: false })
    @IsOptional()
    @IsObject()
    game?: UpdateGameDto;
}
