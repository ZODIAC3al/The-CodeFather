import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SeedService } from './seed.service';
import { Category, CategorySchema } from '../../schemas/category.schema';
import {
  MembershipPlan,
  MembershipPlanSchema,
} from '../../schemas/membership-plan.schema';
import { Course, CourseSchema } from '../../schemas/course.schema';
import { Lesson, LessonSchema } from '../../schemas/lesson.schema';
import { User, UserSchema } from '../../schemas/user.schema';
import { Center, CenterSchema } from '../../schemas/center.schema';
import { Submission, SubmissionSchema } from '../../schemas/submission.schema';
import { Meeting, MeetingSchema } from '../../schemas/meeting.schema';
import { Enrollment, EnrollmentSchema } from '../../schemas/enrollment.schema';
import { Review, ReviewSchema } from '../../schemas/review.schema';
import { Order, OrderSchema } from '../../schemas/order.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Category.name, schema: CategorySchema },
      { name: MembershipPlan.name, schema: MembershipPlanSchema },
      { name: Course.name, schema: CourseSchema },
      { name: Lesson.name, schema: LessonSchema },
      { name: User.name, schema: UserSchema },
      { name: Center.name, schema: CenterSchema },
      { name: Submission.name, schema: SubmissionSchema },
      { name: Meeting.name, schema: MeetingSchema },
      { name: Enrollment.name, schema: EnrollmentSchema },
      { name: Review.name, schema: ReviewSchema },
      { name: Order.name, schema: OrderSchema },
    ]),
  ],
  providers: [SeedService],
  exports: [SeedService],
})
export class SeedModule {}
