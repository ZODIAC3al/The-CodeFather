import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

@Schema({ timestamps: true })
export class Lesson extends Document {
  @Prop({ type: String, ref: 'Course', required: true, index: true })
  courseId: string;

  @Prop({ required: true })
  title: string;

  @Prop()
  content?: string;

  @Prop()
  videoUrl?: string;

  @Prop({ required: true, type: Number })
  order: number;

  @Prop({ type: Number })
  duration?: number;

  @Prop({ default: false })
  isFree: boolean;

  @Prop({
    type: [{
      name: String,
      type: { type: String, enum: ['pdf', 'code', 'slides'] },
      url: String,
    }],
    default: [],
  })
  resources: Array<{ name: string; type: string; url: string }>;
}

export const LessonSchema = SchemaFactory.createForClass(Lesson);
// Compound index on courseId and order for lesson retrieval lists
LessonSchema.index({ courseId: 1, order: 1 });
