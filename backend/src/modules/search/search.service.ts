import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Course } from '../../schemas/course.schema';
import { Enrollment } from '../../schemas/enrollment.schema';

@Injectable()
export class SearchService {
  constructor(
    @InjectModel(Course.name) private courseModel: Model<Course>,
    @InjectModel(Enrollment.name) private enrollmentModel: Model<Enrollment>,
  ) {}

  async search(q: string, page = 1, limit = 12) {
    const skip = (page - 1) * limit;

    const query = {
      published: true,
      $or: [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { tags: { $regex: q, $options: 'i' } },
      ],
    };

    const [data, total] = await Promise.all([
      this.courseModel
        .find(query)
        .skip(skip)
        .limit(limit)
        .populate('instructorId', 'id username avatar')
        .populate('categoryId')
        .exec(),
      this.courseModel.countDocuments(query).exec(),
    ]);

    const mapped = await Promise.all(
      data.map(async (c) => {
        const enrollmentsCount = await this.enrollmentModel.countDocuments({
          courseId: c._id.toString(),
        });
        const obj = c.toObject();
        return {
          ...obj,
          id: c._id.toString(),
          instructor: obj.instructorId,
          category: obj.categoryId,
          _count: { enrollments: enrollmentsCount },
        };
      }),
    );

    return { data: mapped, total, page, limit, query: q };
  }
}
