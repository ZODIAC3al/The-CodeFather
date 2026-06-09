import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Submission extends Document {
  @Prop({ required: true, type: String, ref: 'Course', index: true })
  courseId: string;

  @Prop({ required: true, type: String, ref: 'Lesson', index: true })
  lessonId: string;

  @Prop({ required: true, type: String, ref: 'User', index: true })
  userId: string;

  @Prop({ required: true })
  content: string;

  @Prop({ type: Number })
  grade?: number;

  @Prop()
  feedback?: string;

  @Prop({ default: 'PENDING', enum: ['PENDING', 'GRADED'], index: true })
  status: string;
}

export const SubmissionSchema = SchemaFactory.createForClass(Submission);
