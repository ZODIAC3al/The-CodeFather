import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

@Schema({ timestamps: true })
export class Meeting extends Document {
  @Prop({ required: true })
  title: string;

  @Prop()
  description?: string;

  @Prop({ type: String, ref: 'Course', index: true })
  courseId?: string;

  @Prop({ type: String, ref: 'User', required: true, index: true })
  hostId: string;

  @Prop({ required: true, type: Date })
  startAt: Date;

  @Prop({ type: Date })
  endAt?: Date;

  @Prop()
  roomUrl?: string;

  @Prop({ default: false, index: true })
  isOffline: boolean;

  @Prop({ type: String, ref: 'Center', index: true })
  centerId?: string;

  @Prop()
  roomName?: string;

  @Prop({ type: Number })
  capacity?: number;

  @Prop({ type: [String], default: [] })
  attendees: string[];

  @Prop({ type: [{ userId: String, attended: Boolean }], default: [] })
  attendance: Array<{ userId: string; attended: boolean }>;
}

export const MeetingSchema = SchemaFactory.createForClass(Meeting);
