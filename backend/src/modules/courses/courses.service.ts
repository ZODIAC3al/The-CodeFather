import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Course } from '../../schemas/course.schema';
import { Category } from '../../schemas/category.schema';
import { Lesson } from '../../schemas/lesson.schema';
import { Enrollment } from '../../schemas/enrollment.schema';
import { Review } from '../../schemas/review.schema';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { CourseFilterDto } from './dto/course-filter.dto';

@Injectable()
export class CoursesService {
  constructor(
    @InjectModel(Course.name) private courseModel: Model<Course>,
    @InjectModel(Category.name) private categoryModel: Model<Category>,
    @InjectModel(Lesson.name) private lessonModel: Model<Lesson>,
    @InjectModel(Enrollment.name) private enrollmentModel: Model<Enrollment>,
    @InjectModel(Review.name) private reviewModel: Model<Review>,
  ) {}

  async findAll(filters: CourseFilterDto) {
    const {
      category,
      minPrice,
      maxPrice,
      search,
      page = 1,
      limit = 12,
      instructorId,
      showAll,
    } = filters;
    const skip = (page - 1) * limit;

    const query: any = {};
    if (showAll !== 'true') {
      query.published = true;
    }
    if (instructorId) {
      query.instructorId = instructorId;
    }

    if (category) {
      const cat = await this.categoryModel.findOne({
        name: { $regex: category, $options: 'i' },
      });
      if (cat) {
        query.categoryId = cat._id.toString();
      } else {
        // Return empty result set if category filter was provided but doesn't exist
        return { data: [], total: 0, page, limit, totalPages: 0 };
      }
    }

    if (minPrice !== undefined) {
      query.price = { $gte: minPrice };
    }

    if (maxPrice !== undefined) {
      query.price = { ...query.price, $lte: maxPrice };
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.courseModel
        .find(query)
        .skip(skip)
        .limit(limit)
        .populate('instructorId', 'id username avatar')
        .populate('categoryId')
        .sort({ createdAt: -1 })
        .exec(),
      this.courseModel.countDocuments(query).exec(),
    ]);

    const mappedData = await Promise.all(
      data.map(async (c) => {
        const enrollmentsCount = await this.enrollmentModel.countDocuments({
          courseId: c._id.toString(),
        });
        const reviewsCount = await this.reviewModel.countDocuments({
          courseId: c._id.toString(),
        });
        const obj = c.toObject();
        return {
          ...obj,
          id: c._id.toString(),
          instructor: obj.instructorId,
          category: obj.categoryId,
          _count: { enrollments: enrollmentsCount, reviews: reviewsCount },
        };
      }),
    );

    return {
      data: mappedData,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(slug: string) {
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(slug);
    const query = isObjectId ? { _id: slug } : { slug };
    const course = await this.courseModel
      .findOne(query)
      .populate('instructorId', 'id username avatar bio')
      .populate('categoryId')
      .exec();

    if (!course) throw new NotFoundException('Course not found');

    const lessons = await this.lessonModel
      .find({ courseId: course._id.toString() })
      .sort({ order: 1 })
      .exec();
    const reviews = await this.reviewModel
      .find({ courseId: course._id.toString() } as any)
      .populate('userId', 'id username avatar')
      .limit(10)
      .sort({ createdAt: -1 })
      .exec();

    const enrollmentsCount = await this.enrollmentModel.countDocuments({
      courseId: course._id.toString(),
    });

    const obj = course.toObject();
    return {
      ...obj,
      id: course._id.toString(),
      instructor: obj.instructorId,
      category: obj.categoryId,
      lessons: lessons.map((l) => ({ ...l.toObject(), id: l._id.toString() })),
      reviews: reviews.map((r: any) => {
        const rObj = r.toObject();
        return {
          ...rObj,
          id: r._id.toString(),
          user: rObj.userId,
        };
      }),
      _count: { enrollments: enrollmentsCount },
    };
  }

  async findById(id: string) {
    const course = await this.courseModel
      .findOne({ _id: id })
      .populate('instructorId', 'id username avatar bio')
      .populate('categoryId')
      .exec();

    if (!course) return null;

    const lessons = await this.lessonModel
      .find({ courseId: course._id.toString() })
      .sort({ order: 1 })
      .exec();
    const obj = course.toObject();
    return {
      ...obj,
      id: course._id.toString(),
      instructor: obj.instructorId,
      category: obj.categoryId,
      lessons: lessons.map((l) => ({ ...l.toObject(), id: l._id.toString() })),
      reviews: [],
      _count: { enrollments: 0 },
    };
  }

  async create(dto: CreateCourseDto, instructorId: string) {
    const slug =
      dto.title
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '') +
      '-' +
      Date.now();

    const category = await this.categoryModel.findById(dto.categoryId);
    if (!category) throw new NotFoundException('Category not found');

    const created = new this.courseModel({
      ...dto,
      slug,
      instructorId,
    });

    return created.save();
  }

  async update(id: string, dto: UpdateCourseDto, userId: string, role: string) {
    const course = await this.courseModel.findById(id);
    if (!course) throw new NotFoundException('Course not found');

    if (course.instructorId.toString() !== userId && role !== 'ADMIN') {
      throw new ForbiddenException('Not authorized to edit this course');
    }

    return this.courseModel.findByIdAndUpdate(id, dto, { new: true }).exec();
  }

  async remove(id: string, userId: string, role: string) {
    const course = await this.courseModel.findById(id);
    if (!course) throw new NotFoundException('Course not found');

    if (course.instructorId.toString() !== userId && role !== 'ADMIN') {
      throw new ForbiddenException('Not authorized to delete this course');
    }

    await this.lessonModel.deleteMany({
      courseId: course._id.toString(),
    });
    return this.courseModel.findByIdAndDelete(id).exec();
  }

  async getCategories() {
    const categories = await this.categoryModel.find().exec();
    return Promise.all(
      categories.map(async (cat) => {
        const coursesCount = await this.courseModel.countDocuments({
          categoryId: cat._id.toString(),
        });
        return {
          ...cat.toObject(),
          id: cat._id.toString(),
          _count: { courses: coursesCount },
        };
      }),
    );
  }

  async getRecommended(userId?: string, limit = 8) {
    const courses = await this.courseModel
      .find({ published: true })
      .limit(limit)
      .populate('instructorId', 'id username avatar')
      .populate('categoryId')
      .exec();

    return Promise.all(
      courses.map(async (c) => {
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
  }

  async createLesson(courseId: string, dto: any, userId: string, role: string) {
    const course = await this.courseModel.findById(courseId);
    if (!course) throw new NotFoundException('Course not found');

    if (course.instructorId.toString() !== userId && role !== 'ADMIN') {
      throw new ForbiddenException(
        'Not authorized to manage lessons for this course',
      );
    }

    const count = await this.lessonModel.countDocuments({ courseId });
    const lesson = new this.lessonModel({
      ...dto,
      courseId,
      order: count + 1,
    });
    return lesson.save();
  }

  async updateLesson(lessonId: string, dto: any, userId: string, role: string) {
    const lesson = await this.lessonModel.findById(lessonId);
    if (!lesson) throw new NotFoundException('Lesson not found');

    const course = await this.courseModel.findById(lesson.courseId);
    if (!course) throw new NotFoundException('Course not found');

    if (course.instructorId.toString() !== userId && role !== 'ADMIN') {
      throw new ForbiddenException(
        'Not authorized to manage lessons for this course',
      );
    }

    return this.lessonModel
      .findByIdAndUpdate(lessonId, dto, { new: true })
      .exec();
  }

  async deleteLesson(lessonId: string, userId: string, role: string) {
    const lesson = await this.lessonModel.findById(lessonId);
    if (!lesson) throw new NotFoundException('Lesson not found');

    const course = await this.courseModel.findById(lesson.courseId);
    if (!course) throw new NotFoundException('Course not found');

    if (course.instructorId.toString() !== userId && role !== 'ADMIN') {
      throw new ForbiddenException(
        'Not authorized to manage lessons for this course',
      );
    }

    await this.lessonModel.findByIdAndDelete(lessonId).exec();

    // Recalculate order numbers for remaining course lessons
    const remaining = await this.lessonModel
      .find({ courseId: course._id.toString() })
      .sort({ order: 1 })
      .exec();
    for (let i = 0; i < remaining.length; i++) {
      remaining[i].order = i + 1;
      await remaining[i].save();
    }

    return { success: true };
  }
}
