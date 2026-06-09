import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Category extends Document {
  @Prop({ required: true, unique: true, index: true })
  name: string;

  @Prop()
  icon?: string;
}

export const CategorySchema = SchemaFactory.createForClass(Category);
