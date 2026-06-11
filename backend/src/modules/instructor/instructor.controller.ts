import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { InstructorService } from './instructor.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('instructor')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('INSTRUCTOR', 'ADMIN')
@Controller('instructor')
export class InstructorController {
  constructor(private instructorService: InstructorService) {}

  @Get('cohorts')
  getCohorts(@Request() req: any) {
    return this.instructorService.getCohorts(req.user.sub);
  }

  @Get('pending-reviews')
  getPendingReviews(@Request() req: any) {
    return this.instructorService.getPendingReviews(req.user.sub);
  }

  @Patch('submissions/:id/grade')
  gradeSubmission(
    @Param('id') submissionId: string,
    @Body() body: { grade: number; feedback: string },
    @Request() req: any,
  ) {
    return this.instructorService.gradeSubmission(
      submissionId,
      req.user.sub,
      body.grade,
      body.feedback,
    );
  }

  @Get('schedule')
  getSchedule(@Request() req: any) {
    return this.instructorService.getSchedule(req.user.sub);
  }

  @Post('meetings')
  createMeeting(@Body() body: any, @Request() req: any) {
    return this.instructorService.createMeeting(req.user.sub, body);
  }

  @Get('students')
  getStudents(@Request() req: any) {
    return this.instructorService.getStudents(req.user.sub);
  }

  @Get('reviews')
  getReviews(@Request() req: any) {
    return this.instructorService.getReviews(req.user.sub);
  }

  @Get('payments')
  getPayments(@Request() req: any) {
    return this.instructorService.getPayments(req.user.sub);
  }

  @Get('centers')
  getCenters() {
    return this.instructorService.getCenters();
  }
}
