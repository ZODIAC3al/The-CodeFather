import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Quiz extends Document {
  @Prop({ required: true, type: String, ref: 'Lesson', index: true })
  lessonId: string;

  @Prop({
    type: [{
      questionText: String,
      options: [String],
      correctAnswerIndex: Number,
    }],
    default: [],
  })
  questions: Array<{
    questionText: string;
    options: string[];
    correctAnswerIndex: number;
  }>;
}

export const QuizSchema = SchemaFactory.createForClass(Quiz);
