import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

@Schema({ timestamps: true })
export class Notification extends Document {
  @Prop({ type: String, required: true, index: true })
  userId: string;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  message: string;

  @Prop({ default: false, index: true })
  read: boolean;

  @Prop({
    required: true,
    enum: ['PAYMENT', 'COURSE', 'ASSIGNMENT', 'SYSTEM', 'MEETING'],
    index: true,
  })
  type: string;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
