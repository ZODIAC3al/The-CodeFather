import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Course } from '../../schemas/course.schema';
import { Enrollment } from '../../schemas/enrollment.schema';
import { Submission } from '../../schemas/submission.schema';
import { Meeting } from '../../schemas/meeting.schema';
import { User } from '../../schemas/user.schema';
import { Center } from '../../schemas/center.schema';
import { Order } from '../../schemas/order.schema';
import { Review } from '../../schemas/review.schema';

import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class InstructorService {
  constructor(
    @InjectModel(Course.name) private courseModel: Model<Course>,
    @InjectModel(Enrollment.name) private enrollmentModel: Model<Enrollment>,
    @InjectModel(Submission.name) private submissionModel: Model<Submission>,
    @InjectModel(Meeting.name) private meetingModel: Model<Meeting>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Center.name) private centerModel: Model<Center>,
    @InjectModel(Order.name) private orderModel: Model<Order>,
    @InjectModel(Review.name) private reviewModel: Model<Review>,
    private notificationsService: NotificationsService,
  ) {}

  async getCohorts(instructorId: string) {
    const courses = await this.courseModel.find({ instructorId }).exec();

    return Promise.all(
      courses.map(async (course) => {
        const enrollments = await this.enrollmentModel
          .find({ courseId: course._id.toString() })
          .exec();
        const studentCount = enrollments.length;

        // Average progress
        let avgProgress = 0;
        if (studentCount > 0) {
          avgProgress = Math.round(
            enrollments.reduce((acc, curr) => acc + (curr.progress || 0), 0) /
              studentCount,
          );
        }

        return {
          id: course._id.toString(),
          title: course.title,
          slug: course.slug,
          thumbnail: course.thumbnail,
          published: course.published,
          studentCount,
          avgProgress,
        };
      }),
    );
  }

  async getPendingReviews(instructorId: string) {
    const courses = await this.courseModel.find({ instructorId }).exec();
    const courseIds = courses.map((c) => c._id.toString());

    return this.submissionModel
      .find({
        courseId: { $in: courseIds },
        status: 'PENDING',
      })
      .populate('userId', 'id username avatar')
      .populate('courseId', 'id title')
      .populate('lessonId', 'id title order')
      .sort({ createdAt: 1 })
      .exec();
  }

  async gradeSubmission(
    submissionId: string,
    instructorId: string,
    grade: number,
    feedback: string,
  ) {
    const submission = await this.submissionModel.findById(submissionId);
    if (!submission) throw new NotFoundException('Submission not found');

    const course = await this.courseModel.findById(submission.courseId);
    if (!course || course.instructorId.toString() !== instructorId) {
      throw new ConflictException(
        'Not authorized to grade submissions for this course',
      );
    }

    submission.grade = grade;
    submission.feedback = feedback;
    submission.status = 'GRADED';

    // Update enrollment progress
    // Simple logic: increment enrollment progress when assignment is graded
    const enrollment = await this.enrollmentModel.findOne({
      userId: submission.userId,
      courseId: submission.courseId,
    });
    if (enrollment) {
      enrollment.progress = Math.min(100, (enrollment.progress || 0) + 15);
      await enrollment.save();
    }

    try {
      await this.notificationsService.createNotification(
        submission.userId.toString(),
        'Assignment Graded',
        `Your assignment submission for course "${course.title}" has been graded. Score: ${grade}/100.`,
        'ASSIGNMENT',
      );
    } catch (err) {
      // ignore websocket/notification broadcast failure
    }

    return submission.save();
  }

  async getSchedule(instructorId: string) {
    return this.meetingModel
      .find({ hostId: instructorId })
      .populate('courseId', 'id title')
      .populate('centerId', 'id name location')
      .sort({ startAt: 1 })
      .exec();
  }

  async createMeeting(instructorId: string, dto: any) {
    // Overlap validation if scheduling a physical slot
    if (dto.isOffline) {
      if (!dto.centerId || !dto.roomName) {
        throw new BadRequestException(
          'Center ID and Room Name are required for physical cohort sessions',
        );
      }

      // Check center exists
      const center = await this.centerModel.findById(dto.centerId);
      if (!center) throw new NotFoundException('Center not found');

      // Check classroom exists
      const classroom = center.classrooms.find((r) => r.name === dto.roomName);
      if (!classroom)
        throw new NotFoundException('Classroom not found in center');

      const start = new Date(dto.startAt);
      const end = dto.endAt
        ? new Date(dto.endAt)
        : new Date(start.getTime() + 2 * 60 * 60 * 1000); // 2 hours default

      // Find overlapping meetings in the same room of the same center
      const overlapping = await this.meetingModel
        .findOne({
          isOffline: true,
          centerId: dto.centerId,
          roomName: dto.roomName,
          $or: [{ startAt: { $lt: end }, endAt: { $gt: start } }],
        })
        .exec();

      if (overlapping) {
        throw new ConflictException(
          `Classroom '${dto.roomName}' at '${center.name}' is already booked during this time slot (collides with session: ${overlapping.title})`,
        );
      }
    }

    const startAt = new Date(dto.startAt);
    const endAt = dto.endAt
      ? new Date(dto.endAt)
      : new Date(startAt.getTime() + 2 * 60 * 60 * 1000);

    const meeting = new this.meetingModel({
      title: dto.title,
      description: dto.description,
      courseId: dto.courseId || null,
      hostId: instructorId,
      startAt,
      endAt,
      isOffline: !!dto.isOffline,
      centerId: dto.centerId || null,
      roomName: dto.roomName || null,
      capacity: dto.capacity || 20,
      roomUrl: dto.roomUrl || `https://meet.jit.si/learnlocal-${Date.now()}`,
    });

    const savedMeeting = await meeting.save();

    if (savedMeeting.courseId) {
      try {
        const course = await this.courseModel.findById(savedMeeting.courseId);
        const courseTitle = course ? course.title : 'Course';
        const enrollments = await this.enrollmentModel
          .find({ courseId: savedMeeting.courseId })
          .exec();

        for (const enrollment of enrollments) {
          await this.notificationsService.createNotification(
            enrollment.userId.toString(),
            'New Class Meeting Scheduled',
            `A new session "${savedMeeting.title}" has been scheduled for "${courseTitle}".`,
            'MEETING',
          );
        }
      } catch (err) {
        // ignore errors
      }
    }

    return savedMeeting;
  }

  async getStudents(instructorId: string) {
    const courses = await this.courseModel.find({ instructorId }).exec();
    const courseIds = courses.map((c) => c._id.toString());
    const enrollments = await this.enrollmentModel
      .find({ courseId: { $in: courseIds } } as any)
      .populate('userId', 'id username email avatar')
      .populate('courseId', 'id title')
      .sort({ createdAt: -1 })
      .exec();

    return enrollments.map((e) => {
      const eObj = e.toObject();
      return {
        id: e._id.toString(),
        progress: eObj.progress,
        completedAt: eObj.completedAt,
        student: eObj.userId,
        course: eObj.courseId,
        createdAt: (e as any).createdAt,
      };
    });
  }

  async getReviews(instructorId: string) {
    const courses = await this.courseModel.find({ instructorId }).exec();
    const courseIds = courses.map((c) => c._id.toString());
    const reviews = await this.reviewModel
      .find({ courseId: { $in: courseIds } } as any)
      .populate('userId', 'id username avatar')
      .populate('courseId', 'id title')
      .sort({ createdAt: -1 })
      .exec();

    return reviews.map((r) => {
      const rObj = r.toObject();
      return {
        id: r._id.toString(),
        rating: rObj.rating,
        comment: rObj.comment,
        createdAt: (r as any).createdAt,
        user: rObj.userId,
        course: rObj.courseId,
      };
    });
  }

  async getPayments(instructorId: string) {
    const courses = await this.courseModel.find({ instructorId }).exec();
    const courseIds = courses.map((c) => c._id.toString());
    const orders = await this.orderModel
      .find({ courseId: { $in: courseIds }, status: 'PAID' } as any)
      .populate('userId', 'id username email')
      .populate('courseId', 'id title price')
      .sort({ createdAt: -1 })
      .exec();

    return orders.map((o) => {
      const oObj = o.toObject();
      return {
        id: o._id.toString(),
        amount: oObj.amount,
        status: oObj.status,
        createdAt: (o as any).createdAt,
        user: oObj.userId,
        course: oObj.courseId,
      };
    });
  }

  async getCenters() {
    return this.centerModel.find().exec();
  }
}
