import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';

@Schema()
export class Qre {
    @ApiProperty()
    @Prop({ required: false })
    id: number;

    @ApiProperty()
    @Prop({ required: false })
    lowerBound: number;

    @ApiProperty()
    @Prop({ required: false })
    goodAnswer: number;

    @ApiProperty()
    @Prop({ required: false })
    margin: number;

    @ApiProperty()
    @Prop({ required: false })
    upperBound: number;
}
export const qreSchema = SchemaFactory.createForClass(Qre);
