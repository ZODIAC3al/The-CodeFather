import { Injectable, ConflictException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Enrollment } from '../../schemas/enrollment.schema';
import { Course } from '../../schemas/course.schema';
import { Order } from '../../schemas/order.schema';
import { Membership } from '../../schemas/membership.schema';
import { Certificate } from '../../schemas/certificate.schema';

@Injectable()
export class EnrollmentsService {
  constructor(
    @InjectModel(Enrollment.name) private enrollmentModel: Model<Enrollment>,
    @InjectModel(Course.name) private courseModel: Model<Course>,
    @InjectModel(Order.name) private orderModel: Model<Order>,
    @InjectModel(Membership.name) private membershipModel: Model<Membership>,
    @InjectModel(Certificate.name) private certificateModel: Model<Certificate>,
  ) {}

  async enroll(userId: string, courseId: string) {
    const course = await this.courseModel.findById(courseId);
    if (!course) {
      throw new ForbiddenException('Course not found');
    }

    const price = Number(course.discountPrice ?? course.price ?? 0);
    if (price > 0) {
      // Check for direct purchase
      const hasOrder = await this.orderModel.findOne({
        userId,
        courseId,
        status: 'PAID',
      });

      // Check for active membership
      const hasMembership = await this.membershipModel.findOne({
        userId,
        status: 'ACTIVE',
        expiresAt: { $gt: new Date() },
      });

      // Check if user is the course instructor
      const isInstructor = course.instructorId === userId;

      if (!hasOrder && !hasMembership && !isInstructor) {
        throw new ForbiddenException(
          'Not authorized to enroll in this course. Please purchase the course or subscribe to a membership.',
        );
      }
    }

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
    const updated = await this.enrollmentModel
      .findOneAndUpdate(
        { userId, courseId },
        {
          progress,
          completedAt: progress >= 100 ? new Date() : null,
        },
        { new: true },
      )
      .exec();

    if (progress >= 100) {
      const existingCert = await this.certificateModel.findOne({ userId, courseId });
      if (!existingCert) {
        const credentialId = 'CF-' + Math.random().toString(36).substring(2, 10).toUpperCase() + '-' + Date.now().toString().slice(-4);
        await new this.certificateModel({
          userId,
          courseId,
          credentialId,
        }).save();
      }
    }

    return updated;
  }

  async getCertificate(userId: string, courseId: string) {
    return this.certificateModel
      .findOne({ userId, courseId })
      .populate('courseId', 'title description')
      .populate('userId', 'username fullName')
      .exec();
  }
}
