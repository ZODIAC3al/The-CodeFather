import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EnrollmentsService } from './enrollments.service';
import { EnrollmentsController } from './enrollments.controller';
import { Enrollment, EnrollmentSchema } from '../../schemas/enrollment.schema';
import { Course, CourseSchema } from '../../schemas/course.schema';
import { Order, OrderSchema } from '../../schemas/order.schema';
import { Membership, MembershipSchema } from '../../schemas/membership.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Enrollment.name, schema: EnrollmentSchema },
      { name: Course.name, schema: CourseSchema },
      { name: Order.name, schema: OrderSchema },
      { name: Membership.name, schema: MembershipSchema },
    ]),
  ],
  controllers: [EnrollmentsController],
  providers: [EnrollmentsService],
  exports: [EnrollmentsService],
})
export class EnrollmentsModule {}
