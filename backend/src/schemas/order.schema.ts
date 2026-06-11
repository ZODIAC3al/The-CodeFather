import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

@Schema({ timestamps: true })
export class Order extends Document {
  @Prop({ type: String, ref: 'User', required: true, index: true })
  userId: string;

  @Prop({ type: String, ref: 'Course', required: true, index: true })
  courseId: string;

  @Prop({ required: true, type: Number })
  amount: number;

  @Prop({
    required: true,
    default: 'PENDING',
    enum: ['PENDING', 'PAID', 'FAILED', 'REFUNDED'],
  })
  status: string;

  @Prop()
  stripeId?: string;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
