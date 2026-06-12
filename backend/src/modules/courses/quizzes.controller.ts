import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Quiz } from '../../schemas/quiz.schema';
import { UsersService } from '../users/users.service';

@UseGuards(JwtAuthGuard)
@Controller('quizzes')
export class QuizzesController {
  constructor(
    @InjectModel(Quiz.name) private quizModel: Model<Quiz>,
    private usersService: UsersService,
  ) {}

  @Get('lesson/:lessonId')
  async getQuiz(@Param('lessonId') lessonId: string) {
    const quiz = await this.quizModel.findOne({ lessonId }).exec();
    if (!quiz) {
      // Return a default mock quiz if not seeded yet
      return {
        lessonId,
        questions: [
          {
            questionText: 'Which Next.js compiler is standard starting in v16?',
            options: ['Turbopack', 'Babel', 'Vite', 'Webpack'],
            correctAnswerIndex: 0,
          },
          {
            questionText: 'What is the default rendering mode of Next.js App Router layout components?',
            options: ['Server Components', 'Client Components', 'Static Pages', 'SSR Elements'],
            correctAnswerIndex: 0,
          },
          {
            questionText: 'Which NextJS function handles custom SEO metadata structure statically?',
            options: ['generateMetadata', 'getStaticProps', 'seoConfig', 'getInitialProps'],
            correctAnswerIndex: 0,
          }
        ]
      };
    }
    return quiz;
  }

  @Post('lesson/:lessonId/submit')
  async submitQuiz(
    @Param('lessonId') lessonId: string,
    @Request() req: any,
    @Body() body: { answers: number[] },
  ) {
    let quiz = await this.quizModel.findOne({ lessonId }).exec();
    if (!quiz) {
      // Standard fallback matching getQuiz mock questions
      quiz = new this.quizModel({
        lessonId,
        questions: [
          {
            questionText: 'Which Next.js compiler is standard starting in v16?',
            options: ['Turbopack', 'Babel', 'Vite', 'Webpack'],
            correctAnswerIndex: 0,
          },
          {
            questionText: 'What is the default rendering mode of Next.js App Router layout components?',
            options: ['Server Components', 'Client Components', 'Static Pages', 'SSR Elements'],
            correctAnswerIndex: 0,
          },
          {
            questionText: 'Which NextJS function handles custom SEO metadata structure statically?',
            options: ['generateMetadata', 'getStaticProps', 'seoConfig', 'getInitialProps'],
            correctAnswerIndex: 0,
          }
        ]
      });
    }

    const { answers } = body;
    let score = 0;
    const feedback = quiz.questions.map((q, idx) => {
      const isCorrect = answers[idx] === q.correctAnswerIndex;
      if (isCorrect) score += 1;
      return {
        questionText: q.questionText,
        selected: answers[idx],
        correct: q.correctAnswerIndex,
        isCorrect,
      };
    });

    const percent = Math.round((score / quiz.questions.length) * 100);
    const passed = percent >= 70;

    let xpEarned = 0;
    if (passed) {
      xpEarned = 50; // Reward 50 XP if they pass
      await this.usersService.earnXp(req.user.sub, xpEarned);
    }

    return {
      score,
      total: quiz.questions.length,
      percent,
      passed,
      feedback,
      xpEarned,
    };
  }
}
