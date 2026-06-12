import {
  Controller,
  Get,
  Param,
  UseGuards,
  Request,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Lesson } from '../../schemas/lesson.schema';
import { Enrollment } from '../../schemas/enrollment.schema';
import { Course } from '../../schemas/course.schema';
import { Membership } from '../../schemas/membership.schema';

@ApiTags('lessons')
@Controller('courses/lessons')
export class LessonsController {
  constructor(
    @InjectModel(Lesson.name) private lessonModel: Model<Lesson>,
    @InjectModel(Enrollment.name) private enrollmentModel: Model<Enrollment>,
    @InjectModel(Course.name) private courseModel: Model<Course>,
    @InjectModel(Membership.name) private membershipModel: Model<Membership>,
  ) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get(':id/content')
  async getLessonContent(@Param('id') lessonId: string, @Request() req: any) {
    const lesson = await this.lessonModel.findById(lessonId);
    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    // 1. Free lessons can be accessed by any authenticated user
    if (lesson.isFree) {
      return lesson;
    }

    const userId = req.user.sub;
    const userRole = req.user.role;

    // 2. Admins get access to everything
    if (userRole === 'ADMIN') {
      return lesson;
    }

    // 3. Course instructors get access to their own course lessons
    const course = await this.courseModel.findById(lesson.courseId);
    if (!course) {
      throw new NotFoundException('Course not found');
    }
    if (course.instructorId.toString() === userId) {
      return lesson;
    }

    // 4. Direct course enrollment
    const enrollment = await this.enrollmentModel.findOne({
      userId,
      courseId: lesson.courseId,
    });
    if (enrollment) {
      return lesson;
    }

    // 5. Active membership subscription
    const membership = await this.membershipModel.findOne({
      userId,
      status: 'ACTIVE',
      expiresAt: { $gt: new Date() },
    });
    if (membership) {
      return lesson;
    }

    throw new ForbiddenException(
      'Not authorized to view this lesson. You must be enrolled in this course or have an active membership.',
    );
  }
}
