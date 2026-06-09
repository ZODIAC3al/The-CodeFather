import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true, unique: true, index: true })
  username: string;

  @Prop({ required: true, unique: true, index: true })
  email: string;

  @Prop({ required: true })
  passwordHash: string;

  @Prop({ default: 'STUDENT', enum: ['STUDENT', 'INSTRUCTOR', 'ADMIN'] })
  role: string;

  @Prop()
  avatar?: string;

  @Prop()
  bio?: string;

  @Prop()
  fullName?: string;

  @Prop()
  nickName?: string;

  @Prop()
  gender?: string;

  @Prop()
  country?: string;

  @Prop()
  language?: string;

  @Prop()
  timeZone?: string;

  @Prop({ default: false })
  suspended: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);
