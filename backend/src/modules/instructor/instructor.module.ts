import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { InstructorController } from './instructor.controller';
import { InstructorService } from './instructor.service';
import { Course, CourseSchema } from '../../schemas/course.schema';
import { Enrollment, EnrollmentSchema } from '../../schemas/enrollment.schema';
import { Submission, SubmissionSchema } from '../../schemas/submission.schema';
import { Meeting, MeetingSchema } from '../../schemas/meeting.schema';
import { User, UserSchema } from '../../schemas/user.schema';
import { Center, CenterSchema } from '../../schemas/center.schema';
import { Order, OrderSchema } from '../../schemas/order.schema';
import { Review, ReviewSchema } from '../../schemas/review.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Course.name, schema: CourseSchema },
      { name: Enrollment.name, schema: EnrollmentSchema },
      { name: Submission.name, schema: SubmissionSchema },
      { name: Meeting.name, schema: MeetingSchema },
      { name: User.name, schema: UserSchema },
      { name: Center.name, schema: CenterSchema },
      { name: Order.name, schema: OrderSchema },
      { name: Review.name, schema: ReviewSchema },
    ]),
  ],
  controllers: [InstructorController],
  providers: [InstructorService],
  exports: [InstructorService],
})
export class InstructorModule {}
