import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

@Schema()
export class MembershipPlan {
  @Prop({ type: String })
  _id: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, type: Number })
  price: number;

  @Prop({ required: true, enum: ['month', 'year'] })
  interval: string;

  @Prop({ type: [String], default: [] })
  features: string[];
}

export const MembershipPlanSchema: MongooseSchema =
  SchemaFactory.createForClass(MembershipPlan);
