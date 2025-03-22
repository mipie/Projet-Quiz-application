import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document } from 'mongoose';

export type MatchDataDocument = MatchData & Document;

@Schema()
export class MatchData {
    // @ApiProperty()
    // @Prop({ required: true })
    // id: number;

    @ApiProperty()
    @Prop({ required: true })
    title: string;

    @ApiProperty()
    @Prop({ required: true })
    startDate: string;

    @ApiProperty()
    @Prop({ required: true })
    numberPlayers: number;

    @ApiProperty()
    @Prop({ required: true })
    bestScore: number;
}

export const matchDataSchema = SchemaFactory.createForClass(MatchData);
