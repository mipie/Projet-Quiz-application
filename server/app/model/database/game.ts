import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Question, questionSchema } from './question';

@Schema()
export class Game {
    @ApiProperty()
    @Prop({ required: true })
    $schema: string;

    @ApiProperty()
    @Prop({ required: true })
    title: string;

    @ApiProperty()
    @Prop({ required: true })
    description: string;

    @ApiProperty()
    @Prop({ required: true })
    duration: number;

    @ApiProperty()
    @Prop({ required: true })
    lastModification: string;

    @ApiProperty()
    @Prop({ type: [questionSchema], required: true })
    questions: Question[];
}

export const gameSchema = SchemaFactory.createForClass(Game);
