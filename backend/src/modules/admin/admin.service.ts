import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../../schemas/user.schema';
import { Course } from '../../schemas/course.schema';
import { Enrollment } from '../../schemas/enrollment.schema';
import { Review } from '../../schemas/review.schema';
import { Order } from '../../schemas/order.schema';
import { Center } from '../../schemas/center.schema';
import { Meeting } from '../../schemas/meeting.schema';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Course.name) private courseModel: Model<Course>,
    @InjectModel(Enrollment.name) private enrollmentModel: Model<Enrollment>,
    @InjectModel(Review.name) private reviewModel: Model<Review>,
    @InjectModel(Order.name) private orderModel: Model<Order>,
    @InjectModel(Center.name) private centerModel: Model<Center>,
    @InjectModel(Meeting.name) private meetingModel: Model<Meeting>,
  ) {}

  async getAnalytics() {
    const enrollments = await this.enrollmentModel.find().exec();
    const activeStudents = enrollments.length;

    // Global pass rate is the average of progress across all enrollments
    let globalPassRate = 0;
    if (activeStudents > 0) {
      const totalProgress = enrollments.reduce((acc, curr) => acc + (curr.progress || 0), 0);
      globalPassRate = Math.round(totalProgress / activeStudents);
    }

    const physicalCohorts = await this.meetingModel.countDocuments({ isOffline: true });

    // Platform revenue: sum of amounts from PAID orders
    const paidOrders = await this.orderModel.find({ status: 'PAID' }).exec();
    const platformRevenue = paidOrders.reduce((acc, curr) => acc + (curr.amount || 0), 0);

    // Dynamic 12-day revenue chart data
    const now = Date.now();
    const DAY = 86_400_000;
    
    const revenueData = Array.from({ length: 12 }, (_, idx) => {
      const i = 11 - idx;
      const d = new Date(now - i * DAY);
      const dayStr = String(d.getDate()).padStart(2, '0');
      
      // Filter orders on this day in current period vs prev period
      const startCurrent = new Date(d.setHours(0, 0, 0, 0)).getTime();
      const endCurrent = new Date(d.setHours(23, 59, 59, 999)).getTime();
      
      const startPrev = startCurrent - 12 * DAY;
      const endPrev = endCurrent - 12 * DAY;
      
      const currentRevenue = paidOrders
        .filter(o => {
          const ts = new Date((o as any).createdAt).getTime();
          return ts >= startCurrent && ts <= endCurrent;
        })
        .reduce((sum, o) => sum + (o.amount || 0), 0);
        
      const prevRevenue = paidOrders
        .filter(o => {
          const ts = new Date((o as any).createdAt).getTime();
          return ts >= startPrev && ts <= endPrev;
        })
        .reduce((sum, o) => sum + (o.amount || 0), 0);

      return {
        day: dayStr,
        current: parseFloat(currentRevenue.toFixed(2)),
        prev: parseFloat(prevRevenue.toFixed(2)),
      };
    });

    // Dynamic 6-day user registration chart data
    const allUsers = await this.userModel.find().exec();
    const userGrowthData = Array.from({ length: 6 }, (_, idx) => {
      const i = 5 - idx;
      const d = new Date(now - i * DAY);
      const dayStr = String(d.getDate()).padStart(2, '0');
      
      const startCurrent = new Date(d.setHours(0, 0, 0, 0)).getTime();
      const endCurrent = new Date(d.setHours(23, 59, 59, 999)).getTime();
      
      const startPrev = startCurrent - 6 * DAY;
      const endPrev = endCurrent - 6 * DAY;

      const currentCount = allUsers.filter(u => {
        const ts = new Date((u as any).createdAt).getTime();
        return ts >= startCurrent && ts <= endCurrent;
      }).length;

      const prevCount = allUsers.filter(u => {
        const ts = new Date((u as any).createdAt).getTime();
        return ts >= startPrev && ts <= endPrev;
      }).length;

      return {
        day: dayStr,
        current: currentCount,
        prev: prevCount,
      };
    });

    return {
      activeStudents,
      globalPassRate,
      physicalCohorts,
      platformRevenue: parseFloat(platformRevenue.toFixed(2)),
      revenueData,
      userGrowthData,
    };
  }

  async getLeaderboard() {
    const students = await this.userModel.find({ role: 'STUDENT' }).select('-passwordHash').exec();
    
    const leaderboard = await Promise.all(
      students.map(async (student) => {
        const enrollments = await this.enrollmentModel.find({ userId: student._id.toString() }).exec();
        const xp = enrollments.reduce((acc, curr) => acc + (curr.progress || 0), 0) * 10;
        
        return {
          username: student.username,
          score: xp,
          user: {
            username: student.username,
            avatar: student.avatar,
          }
        };
      })
    );

    return leaderboard.sort((a, b) => b.score - a.score).slice(0, 10);
  }

  async getAllUsers() {
    return this.userModel.find().select('-passwordHash').sort({ createdAt: -1 }).exec();
  }

  async updateUserRoleOrSuspension(userId: string, data: { role?: string; suspended?: boolean }) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    
    if (data.role !== undefined) user.role = data.role;
    if (data.suspended !== undefined) user.suspended = data.suspended;
    
    return user.save();
  }

  async getCenters() {
    return this.centerModel.find().sort({ createdAt: -1 }).exec();
  }

  async createCenter(dto: { name: string; location: string; classrooms: Array<{ name: string; capacity: number }> }) {
    const center = new this.centerModel(dto);
    return center.save();
  }

  async deleteCenter(id: string) {
    const center = await this.centerModel.findById(id);
    if (!center) throw new NotFoundException('Center not found');
    return this.centerModel.findByIdAndDelete(id).exec();
  }

  async getPendingCourses() {
    return this.courseModel.find({ published: false })
      .populate('instructorId', 'id username avatar')
      .sort({ createdAt: -1 })
      .exec();
  }

  async approveCourse(courseId: string) {
    const course = await this.courseModel.findById(courseId);
    if (!course) throw new NotFoundException('Course not found');
    course.published = true;
    return course.save();
  }

  async rejectCourse(courseId: string) {
    const course = await this.courseModel.findById(courseId);
    if (!course) throw new NotFoundException('Course not found');
    return this.courseModel.findByIdAndDelete(courseId).exec();
  }

  async assignBlueprintToSlot(dto: { courseId: string; centerId: string; roomName: string; startAt: string; durationHours: number }) {
    const course = await this.courseModel.findById(dto.courseId);
    if (!course) throw new NotFoundException('Course blueprint not found');

    const center = await this.centerModel.findById(dto.centerId);
    if (!center) throw new NotFoundException('Center not found');

    const classroom = center.classrooms.find(r => r.name === dto.roomName);
    if (!classroom) throw new NotFoundException('Classroom not found in center');

    // Create the meeting slot (representing physical cohort scheduling)
    const startAt = new Date(dto.startAt);
    const endAt = new Date(startAt.getTime() + dto.durationHours * 60 * 60 * 1000);

    const meeting = new this.meetingModel({
      title: `${course.title} - Lecture Hour`,
      description: `Physical Cohort session held at ${center.name}, ${classroom.name}`,
      courseId: course._id.toString(),
      hostId: course.instructorId,
      startAt,
      endAt,
      isOffline: true,
      centerId: center._id.toString(),
      roomName: classroom.name,
      capacity: classroom.capacity,
    });

    // Make sure course is published when scheduled
    course.published = true;
    await course.save();

    return meeting.save();
  }
}
