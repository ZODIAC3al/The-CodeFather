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
import { EnrollmentsService } from './enrollments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiBody } from '@nestjs/swagger';

@ApiTags('enrollments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('enrollments')
export class EnrollmentsController {
  constructor(private enrollmentsService: EnrollmentsService) {}

  @Get('my')
  findMyEnrollments(@Request() req: any) {
    return this.enrollmentsService.findMyEnrollments(req.user.sub);
  }

  @Post('enroll')
  @ApiBody({
    schema: { type: 'object', properties: { courseId: { type: 'string' } } },
  })
  enroll(@Body('courseId') courseId: string, @Request() req: any) {
    return this.enrollmentsService.enroll(req.user.sub, courseId);
  }

  @Patch('progress')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        courseId: { type: 'string' },
        progress: { type: 'number' },
      },
    },
  })
  updateProgress(
    @Body('courseId') courseId: string,
    @Body('progress') progress: number,
    @Request() req: any,
  ) {
    return this.enrollmentsService.updateProgress(
      req.user.sub,
      courseId,
      progress,
    );
  }

  @Get('courses/:id/certificate')
  getCertificate(@Param('id') courseId: string, @Request() req: any) {
    return this.enrollmentsService.getCertificate(req.user.sub, courseId);
  }
}
