import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';
import { ApiTags, ApiBearerAuth, ApiBody } from '@nestjs/swagger';

@ApiTags('reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private reviewsService: ReviewsService) {}

  @Public()
  @Get(':courseId')
  getCourseReviews(@Param('courseId') courseId: string) {
    return this.reviewsService.getCourseReviews(courseId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiBody({ schema: { type: 'object', properties: { courseId: { type: 'string' }, rating: { type: 'number' }, comment: { type: 'string' } }, required: ['courseId', 'rating'] } })
  createReview(
    @Body('courseId') courseId: string,
    @Body('rating') rating: number,
    @Body('comment') comment: string,
    @Request() req: any,
  ) {
    return this.reviewsService.createReview(req.user.sub, courseId, Number(rating), comment);
  }
}
