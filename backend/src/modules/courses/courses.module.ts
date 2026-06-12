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

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Course.name, schema: CourseSchema },
      { name: Category.name, schema: CategorySchema },
      { name: Lesson.name, schema: LessonSchema },
      { name: Enrollment.name, schema: EnrollmentSchema },
      { name: Review.name, schema: ReviewSchema },
      { name: Membership.name, schema: MembershipSchema },
    ]),
  ],
  controllers: [CoursesController, LessonsController],
  providers: [CoursesService],
  exports: [CoursesService, MongooseModule],
})
export class CoursesModule {}
