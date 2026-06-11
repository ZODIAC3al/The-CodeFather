import { Injectable, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Review } from '../../schemas/review.schema';

@Injectable()
export class ReviewsService {
  constructor(@InjectModel(Review.name) private reviewModel: Model<Review>) {}

  async createReview(
    userId: string,
    courseId: string,
    rating: number,
    comment?: string,
  ) {
    const existing = await this.reviewModel
      .findOne({ userId, courseId })
      .exec();
    if (existing) {
      throw new ConflictException('You have already reviewed this course');
    }

    const created = new this.reviewModel({
      userId,
      courseId,
      rating,
      comment,
    });
    return created.save();
  }

  async getCourseReviews(courseId: string) {
    const reviews = await this.reviewModel
      .find({ courseId } as any)
      .populate('userId', 'id username avatar')
      .sort({ createdAt: -1 })
      .exec();

    return reviews.map((r) => {
      const obj = r.toObject();
      return {
        ...obj,
        id: r._id.toString(),
        user: obj.userId,
      };
    });
  }
}
