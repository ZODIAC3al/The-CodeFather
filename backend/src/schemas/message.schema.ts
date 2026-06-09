import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Message extends Document {
  @Prop({ type: String, ref: 'User', required: true, index: true })
  userId: string;

  @Prop({ type: String, required: true, index: true })
  courseId: string;

  @Prop({ type: String, required: true, index: true })
  lessonId: string;

  @Prop({ required: true })
  content: string;

  @Prop()
  codeSnippet?: string;

  @Prop()
  language?: string;

  @Prop({ type: [String], default: [] })
  likes: string[];
}

export const MessageSchema = SchemaFactory.createForClass(Message);
