import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

@Schema({ timestamps: true })
export class Membership extends Document {
  @Prop({
    type: String,
    ref: 'User',
    required: true,
    unique: true,
    index: true,
  })
  userId: string;

  @Prop({ type: String, ref: 'MembershipPlan', required: true, index: true })
  planId: string;

  @Prop({
    required: true,
    default: 'ACTIVE',
    enum: ['ACTIVE', 'EXPIRED', 'CANCELLED'],
  })
  status: string;

  @Prop({ type: Date })
  expiresAt?: Date;
}

export const MembershipSchema = SchemaFactory.createForClass(Membership);
