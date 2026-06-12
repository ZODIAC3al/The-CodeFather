import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

@Schema({ timestamps: true })
export class Order extends Document {
  @Prop({ type: String, ref: 'User', required: true, index: true })
  userId: string;

  @Prop({ type: String, ref: 'Course', required: false, index: true })
  courseId?: string;

  @Prop({ type: String, ref: 'MembershipPlan', required: false, index: true })
  planId?: string;

  @Prop({ required: true, type: Number })
  amount: number;

  @Prop({
    required: true,
    default: 'PENDING',
    enum: ['PENDING', 'PAID', 'FAILED', 'REFUNDED', 'AUTHORIZED'],
  })
  status: string;

  @Prop()
  stripeId?: string;

  @Prop()
  paypalOrderId?: string;

  @Prop()
  paypalAuthorizationId?: string;

  @Prop()
  authorizationExpiry?: Date;

  @Prop({ default: 'SINGLE' })
  accessType: 'SINGLE' | 'SUBSCRIPTION' | 'GROUP';

  @Prop({ type: Number, default: 1 })
  quantity: number;

  @Prop({ type: [{ type: String, ref: 'Enrollment' }], default: [] })
  enrollments: string[];

  @Prop({ type: String })
  groupToken?: string;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
