import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { CoursesModule } from './modules/courses/courses.module';
import { EnrollmentsModule } from './modules/enrollments/enrollments.module';
import { MeetingsModule } from './modules/meetings/meetings.module';
import { BlogModule } from './modules/blog/blog.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { MembershipsModule } from './modules/memberships/memberships.module';
import { SearchModule } from './modules/search/search.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { MessagesModule } from './modules/messages/messages.module';
import { UploadModule } from './modules/upload/upload.module';
import { SeedModule } from './modules/seed/seed.module';
import { AdminModule } from './modules/admin/admin.module';
import { InstructorModule } from './modules/instructor/instructor.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('DATABASE_URL') || 'mongodb://127.0.0.1:27017/learnlocal',
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    UsersModule,
    CoursesModule,
    EnrollmentsModule,
    MeetingsModule,
    BlogModule,
    PaymentsModule,
    MembershipsModule,
    SearchModule,
    ReviewsModule,
    MessagesModule,
    UploadModule,
    SeedModule,
    AdminModule,
    InstructorModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
