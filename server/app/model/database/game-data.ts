import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document } from 'mongoose';
import { Game, gameSchema } from './game';

export type GameDataDocument = GameData & Document;

@Schema()
export class GameData {
    @ApiProperty()
    @Prop({ required: true })
    id: number;

    @ApiProperty()
    @Prop({ required: true })
    isVisible: boolean;

    @ApiProperty()
    @Prop({ required: true })
    isChecked: boolean;

    @ApiProperty()
    @Prop({ type: gameSchema, required: true })
    game: Game;
}

export const gameDataSchema = SchemaFactory.createForClass(GameData);
