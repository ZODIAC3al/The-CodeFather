import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { IdempotencyInterceptor } from './common/interceptors/idempotency.interceptor';
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
        const uri = configService.get<string>('DATABASE_URL') || process.env.DATABASE_URL;
        const fallbackUri = 'mongodb://127.0.0.1:27017/learnlocal';
        if (!uri && process.env.NODE_ENV === 'production') {
          // In production without DB, use the fallback but log warning
          console.warn('DATABASE_URL not set in production - using fallback connection');
        }
        return {
          uri: uri || fallbackUri,
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
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: IdempotencyInterceptor,
    },
  ],
})
export class AppModule {}
