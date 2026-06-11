import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { User, UserSchema } from '../../schemas/user.schema';
import { Course, CourseSchema } from '../../schemas/course.schema';
import { Enrollment, EnrollmentSchema } from '../../schemas/enrollment.schema';
import { Review, ReviewSchema } from '../../schemas/review.schema';
import { Order, OrderSchema } from '../../schemas/order.schema';
import { Center, CenterSchema } from '../../schemas/center.schema';
import { Meeting, MeetingSchema } from '../../schemas/meeting.schema';
import { Settings, SettingsSchema } from '../../schemas/settings.schema';
import { Faq, FaqSchema } from '../../schemas/faq.schema';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Course.name, schema: CourseSchema },
      { name: Enrollment.name, schema: EnrollmentSchema },
      { name: Review.name, schema: ReviewSchema },
      { name: Order.name, schema: OrderSchema },
      { name: Center.name, schema: CenterSchema },
      { name: Meeting.name, schema: MeetingSchema },
      { name: Settings.name, schema: SettingsSchema },
      { name: Faq.name, schema: FaqSchema },
    ]),
    NotificationsModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
