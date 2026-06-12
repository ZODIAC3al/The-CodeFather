import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CoursesService } from './courses.service';
import { CourseFilterDto } from './dto/course-filter.dto';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';

@ApiTags('courses')
@Controller('courses')
export class CoursesController {
  constructor(private coursesService: CoursesService) {}

  @Public()
  @Get()
  findAll(@Query() filters: CourseFilterDto) {
    return this.coursesService.findAll(filters);
  }

  @Public()
  @Get('categories')
  getCategories() {
    return this.coursesService.getCategories();
  }

  @Public()
  @Get('recommended')
  getRecommended(@Query('limit') limit?: number) {
    return this.coursesService.getRecommended(
      undefined,
      limit ? Number(limit) : undefined,
    );
  }

  @Public()
  @Get(':slug')
  findOne(@Param('slug') slug: string) {
    return this.coursesService.findOne(slug);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('INSTRUCTOR', 'ADMIN')
  @Post()
  create(@Body() dto: CreateCourseDto, @Request() req: any) {
    return this.coursesService.create(dto, req.user.sub);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCourseDto,
    @Request() req: any,
  ) {
    return this.coursesService.update(id, dto, req.user.sub, req.user.role);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @Request() req: any) {
    return this.coursesService.remove(id, req.user.sub, req.user.role);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post(':id/lessons')
  createLesson(
    @Param('id') courseId: string,
    @Body() body: any,
    @Request() req: any,
  ) {
    return this.coursesService.createLesson(
      courseId,
      body,
      req.user.sub,
      req.user.role,
    );
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch('lessons/:lessonId')
  updateLesson(
    @Param('lessonId') lessonId: string,
    @Body() body: any,
    @Request() req: any,
  ) {
    return this.coursesService.updateLesson(
      lessonId,
      body,
      req.user.sub,
      req.user.role,
    );
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete('lessons/:lessonId')
  deleteLesson(@Param('lessonId') lessonId: string, @Request() req: any) {
    return this.coursesService.deleteLesson(
      lessonId,
      req.user.sub,
      req.user.role,
    );
  }
}
