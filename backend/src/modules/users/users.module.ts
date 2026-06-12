import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User, UserSchema } from '../../schemas/user.schema';
import { Schedule, ScheduleSchema } from '../../schemas/schedule.schema';
import { Certificate, CertificateSchema } from '../../schemas/certificate.schema';
import { SchedulesController } from './schedules.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Schedule.name, schema: ScheduleSchema },
      { name: Certificate.name, schema: CertificateSchema },
    ]),
  ],
  controllers: [UsersController, SchedulesController],
  providers: [UsersService],
  exports: [UsersService, MongooseModule],
})
export class UsersModule {}
