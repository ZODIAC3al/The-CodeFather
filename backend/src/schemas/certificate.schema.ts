import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Certificate extends Document {
  @Prop({ required: true, type: String, ref: 'User', index: true })
  userId: string;

  @Prop({ required: true, type: String, ref: 'Course', index: true })
  courseId: string;

  @Prop({ required: true, default: Date.now })
  issuedAt: Date;

  @Prop({ required: true, unique: true })
  credentialId: string;
}

export const CertificateSchema = SchemaFactory.createForClass(Certificate);
