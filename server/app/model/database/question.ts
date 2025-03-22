import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Choice, choiceSchema } from './choice';
import { Qre, qreSchema } from './qre';
import { IsOptional } from 'class-validator';

@Schema()
export class Question {
    @ApiProperty()
    @Prop({ required: true })
    id: number;

    @ApiProperty()
    @Prop({ required: true })
    type: string;

    @ApiProperty()
    @Prop({ required: true })
    text: string;

    @ApiProperty()
    @Prop({ required: true })
    points: number;

    @ApiProperty()
    @Prop({ type: [choiceSchema], required: true })
    choices: Choice[];

    @ApiProperty({ required: false })
    @IsOptional()
    @Prop({ type: qreSchema, required: false })
    qre: Qre;

    @ApiProperty()
    @Prop({ required: true })
    imageUrl: string[];
}

export const questionSchema = SchemaFactory.createForClass(Question);
