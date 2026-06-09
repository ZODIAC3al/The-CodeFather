import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

@Schema({ timestamps: true })
export class Enrollment extends Document {
  @Prop({ type: String, ref: 'User', required: true, index: true })
  userId: string;

  @Prop({ type: String, ref: 'Course', required: true, index: true })
  courseId: string;

  @Prop({ type: Number, default: 0 })
  progress: number;

  @Prop({ type: Date })
  completedAt?: Date;
}

export const EnrollmentSchema = SchemaFactory.createForClass(Enrollment);
// Unique constraint on user and course enrollment
EnrollmentSchema.index({ userId: 1, courseId: 1 }, { unique: true });
