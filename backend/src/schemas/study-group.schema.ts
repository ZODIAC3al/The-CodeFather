import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class StudyGroup extends Document {
  @Prop({ required: true })
  name: string;

  @Prop()
  description?: string;

  @Prop({ type: String, ref: 'Course', index: true })
  courseId: string;

  @Prop({ type: String, ref: 'User' })
  createdBy: string;

  @Prop({ type: [String], default: [] })
  members: string[];

  @Prop({
    type: [{
      username: String,
      avatar: String,
      content: String,
      createdAt: { type: Date, default: Date.now },
    }],
    default: [],
  })
  chat: Array<{
    username: string;
    avatar: string;
    content: string;
    createdAt: Date;
  }>;

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

export const StudyGroupSchema = SchemaFactory.createForClass(StudyGroup);
