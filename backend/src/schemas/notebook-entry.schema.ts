import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class NotebookEntry extends Document {
  @Prop({ type: String, ref: 'User', required: true, index: true })
  userId: string;

  @Prop({ type: String, ref: 'Course', required: true, index: true })
  courseId: string;

  @Prop({ type: String, ref: 'Lesson', required: false, index: true })
  lessonId?: string;

  @Prop({ required: true, type: String })
  title: string;

  @Prop({ required: true, type: String })
  content: string;

  @Prop({ default: 'scratch' })
  type: 'scratch' | 'notes' | 'code';
}

export const NotebookEntrySchema = SchemaFactory.createForClass(NotebookEntry);