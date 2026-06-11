import { Injectable, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Enrollment } from '../../schemas/enrollment.schema';

@Injectable()
export class EnrollmentsService {
  constructor(
    @InjectModel(Enrollment.name) private enrollmentModel: Model<Enrollment>,
  ) {}

  async enroll(userId: string, courseId: string) {
    const existing = await this.enrollmentModel
      .findOne({ userId, courseId })
      .exec();
    if (existing) {
      throw new ConflictException('Already enrolled in this course');
    }
    const created = new this.enrollmentModel({ userId, courseId });
    return created.save();
  }

  async findMyEnrollments(userId: string) {
    const list = await this.enrollmentModel
      .find({ userId })
      .populate({
        path: 'courseId',
        populate: [
          { path: 'instructorId', select: 'id username avatar' },
          { path: 'categoryId' },
        ],
      })
      .sort({ createdAt: -1 })
      .exec();

    return list.map((item) => {
      const obj = item.toObject();
      const courseObj: any = obj.courseId;
      return {
        ...obj,
        id: item._id.toString(),
        course: courseObj
          ? {
              ...courseObj,
              id: courseObj._id.toString(),
              instructor: courseObj.instructorId,
              category: courseObj.categoryId,
            }
          : null,
      };
    });
  }

  async updateProgress(userId: string, courseId: string, progress: number) {
    return this.enrollmentModel
      .findOneAndUpdate(
        { userId, courseId },
        {
          progress,
          completedAt: progress >= 100 ? new Date() : null,
        },
        { new: true },
      )
      .exec();
  }
}
