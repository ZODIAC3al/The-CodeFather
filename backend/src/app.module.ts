import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AdminModule } from './modules/admin/admin.module';
import { AuthModule } from './modules/auth/auth.module';
import { BlogModule } from './modules/blog/blog.module';
import { CoursesModule } from './modules/courses/courses.module';
import { EnrollmentsModule } from './modules/enrollments/enrollments.module';
import { InstructorModule } from './modules/instructor/instructor.module';
import { MeetingsModule } from './modules/meetings/meetings.module';
import { MembershipsModule } from './modules/memberships/memberships.module';
import { MessagesModule } from './modules/messages/messages.module';
import { NotebookModule } from './modules/notebook/notebook.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { SearchModule } from './modules/search/search.module';
import { SeedModule } from './modules/seed/seed.module';
import { UploadModule } from './modules/upload/upload.module';
import { UsersModule } from './modules/users/users.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { HelpModule } from './modules/help/help.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const uri = configService.get<string>('DATABASE_URL');
        if (!uri && process.env.NODE_ENV === 'production') {
          throw new Error(
            'DATABASE_URL environment variable is required in production.',
          );
        }
        return {
          uri: uri || 'mongodb://127.0.0.1:27017/learnlocal',
        };
      },
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
    NotificationsModule,
    HelpModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
