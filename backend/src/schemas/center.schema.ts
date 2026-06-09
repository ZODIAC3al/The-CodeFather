import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Classroom {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, type: Number })
  capacity: number;
}

export const ClassroomSchema = SchemaFactory.createForClass(Classroom);

@Schema({ timestamps: true })
export class Center extends Document {
  @Prop({ required: true, unique: true, index: true })
  name: string;

  @Prop({ required: true })
  location: string;

  @Prop({ type: [ClassroomSchema], default: [] })
  classrooms: Classroom[];
}

export const CenterSchema = SchemaFactory.createForClass(Center);
