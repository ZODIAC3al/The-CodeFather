import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

@Schema({ timestamps: true })
export class Course extends Document {
  @Prop({ required: true, unique: true, index: true })
  slug: string;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop()
  thumbnail?: string;

  @Prop({ required: true, type: Number, default: 0 })
  price: number;

  @Prop({ type: Number })
  discountPrice?: number;

  @Prop({ type: String, ref: 'Category', required: true, index: true })
  categoryId: string;

  @Prop({ type: String, ref: 'User', required: true, index: true })
  instructorId: string;

  @Prop({ default: false, index: true })
  published: boolean;

  @Prop({ type: [String], default: [] })
  tags: string[];
}

export const CourseSchema = SchemaFactory.createForClass(Course);
// Text search index for title and description queries
CourseSchema.index({ title: 'text', description: 'text' });
