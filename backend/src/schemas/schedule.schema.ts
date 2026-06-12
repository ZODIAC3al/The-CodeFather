import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Schedule extends Document {
  @Prop({ required: true, type: String, ref: 'User', index: true })
  userId: string;

  @Prop({ default: 30 })
  dailyGoalMinutes: number;

  @Prop({ default: 150 })
  weeklyGoalMinutes: number;

  @Prop({
    type: [{
      text: String,
      completed: Boolean,
      dueDate: Date,
    }],
    default: [],
  })
  todos: Array<{
    text: string;
    completed: boolean;
    dueDate?: Date;
  }>;
}

export const ScheduleSchema = SchemaFactory.createForClass(Schedule);
