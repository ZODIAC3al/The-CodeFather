import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CoursesService } from './courses.service';
import { CoursesController } from './courses.controller';
import { Course, CourseSchema } from '../../schemas/course.schema';
import { Category, CategorySchema } from '../../schemas/category.schema';
import { Lesson, LessonSchema } from '../../schemas/lesson.schema';
import { Enrollment, EnrollmentSchema } from '../../schemas/enrollment.schema';
import { Review, ReviewSchema } from '../../schemas/review.schema';
import { Membership, MembershipSchema } from '../../schemas/membership.schema';
import { LessonsController } from './lessons.controller';
import { Quiz, QuizSchema } from '../../schemas/quiz.schema';
import { StudyGroup, StudyGroupSchema } from '../../schemas/study-group.schema';
import { QuizzesController } from './quizzes.controller';
import { StudyGroupsController } from './study-groups.controller';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    UsersModule,
    MongooseModule.forFeature([
      { name: Course.name, schema: CourseSchema },
      { name: Category.name, schema: CategorySchema },
      { name: Lesson.name, schema: LessonSchema },
      { name: Enrollment.name, schema: EnrollmentSchema },
      { name: Review.name, schema: ReviewSchema },
      { name: Membership.name, schema: MembershipSchema },
      { name: Quiz.name, schema: QuizSchema },
      { name: StudyGroup.name, schema: StudyGroupSchema },
    ]),
  ],
  controllers: [CoursesController, LessonsController, QuizzesController, StudyGroupsController],
  providers: [CoursesService],
  exports: [CoursesService, MongooseModule],
})
export class CoursesModule {}
