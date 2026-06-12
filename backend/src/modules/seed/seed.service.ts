import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Category } from '../../schemas/category.schema';
import { MembershipPlan } from '../../schemas/membership-plan.schema';
import { Course } from '../../schemas/course.schema';
import { Lesson } from '../../schemas/lesson.schema';
import { User } from '../../schemas/user.schema';
import { Center } from '../../schemas/center.schema';
import { Submission } from '../../schemas/submission.schema';
import { Meeting } from '../../schemas/meeting.schema';
import { Enrollment } from '../../schemas/enrollment.schema';
import { Review } from '../../schemas/review.schema';
import { Order } from '../../schemas/order.schema';
import { Quiz } from '../../schemas/quiz.schema';
import { StudyGroup } from '../../schemas/study-group.schema';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectModel(Category.name) private categoryModel: Model<Category>,
    @InjectModel(MembershipPlan.name)
    private membershipPlanModel: Model<MembershipPlan>,
    @InjectModel(Course.name) private courseModel: Model<Course>,
    @InjectModel(Lesson.name) private lessonModel: Model<Lesson>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Center.name) private centerModel: Model<Center>,
    @InjectModel(Submission.name) private submissionModel: Model<Submission>,
    @InjectModel(Meeting.name) private meetingModel: Model<Meeting>,
    @InjectModel(Enrollment.name) private enrollmentModel: Model<Enrollment>,
    @InjectModel(Review.name) private reviewModel: Model<Review>,
    @InjectModel(Order.name) private orderModel: Model<Order>,
    @InjectModel(Quiz.name) private quizModel: Model<Quiz>,
    @InjectModel(StudyGroup.name) private studyGroupModel: Model<StudyGroup>,
  ) {}

  async onModuleInit() {
    try {
      this.logger.log('Checking database seed requirements...');
      await this.seedCategories();
      const users = await this.seedUsers();
      await this.seedMembershipPlans();
      const courseAndLesson = await this.seedCoursesAndLessons(
        users.instructor,
      );
      await this.seedCenters();
      await this.seedMockAnalyticsData(
        users.student,
        courseAndLesson.course,
        courseAndLesson.lesson,
      );
      await this.seedQuizzesAndGroups();
      this.logger.log('Database check/seeding completed successfully.');
    } catch (error) {
      this.logger.error('Failed to run database seeding scripts', error);
    }
  }

  private async seedCategories() {
    const count = await this.categoryModel.countDocuments();
    if (count > 0) return;

    this.logger.log('Seeding categories...');
    const defaultCategories = [
      { name: 'Web Development', icon: 'Code' },
      { name: 'Design & UX', icon: 'Palette' },
      { name: 'Photography', icon: 'Camera' },
      { name: 'Music Production', icon: 'Music' },
      { name: 'Culinary Arts', icon: 'Coffee' },
      { name: 'Language Learning', icon: 'Globe' },
    ];
    await this.categoryModel.insertMany(defaultCategories);
  }

  private async seedUsers() {
    // Seed admin, instructor, student
    const passwordHash = await bcrypt.hash('password123', 12);

    let instructor = await this.userModel.findOne({ role: 'INSTRUCTOR' });
    if (!instructor) {
      this.logger.log('Seeding mock instructor user...');
      instructor = await this.userModel.create({
        username: 'john_mentor',
        email: 'mentor@learnlocal.com',
        passwordHash,
        role: 'INSTRUCTOR',
        avatar: '',
        bio: 'Senior Software Engineer and local programming circle mentor.',
      });
    }

    let admin = await this.userModel.findOne({ role: 'ADMIN' });
    if (!admin) {
      this.logger.log('Seeding mock admin user...');
      admin = await this.userModel.create({
        username: 'admin_master',
        email: 'admin@learnlocal.com',
        passwordHash,
        role: 'ADMIN',
        avatar: '',
        bio: 'Platform Administrator.',
      });
    }

    let student = await this.userModel.findOne({ username: 'bob_student' });
    if (!student) {
      this.logger.log('Seeding mock student user...');
      student = await this.userModel.create({
        username: 'bob_student',
        email: 'bob@example.com',
        passwordHash,
        role: 'STUDENT',
        avatar: '',
        bio: 'Avid software learner based locally.',
      });
    }

    return { instructor, admin, student };
  }

  private async seedMembershipPlans() {
    const count = await this.membershipPlanModel.countDocuments();
    if (count > 0) return;

    this.logger.log('Seeding membership plans...');
    const defaultPlans = [
      {
        _id: 'mock_plan_monthly',
        name: 'Monthly Study Circle',
        price: 19.99,
        interval: 'month',
        features: [
          'Access to all premium course outlines',
          'Join unlimited virtual classrooms',
          'Attend 2 local study meetups per month',
          'Direct mentor review chat support',
        ],
      },
      {
        _id: 'mock_plan_annual',
        name: 'Annual Mentor Pass',
        price: 149.99,
        interval: 'year',
        features: [
          'Everything in Monthly plan',
          'Attend unlimited local meetups',
          'Earn certified learning platform awards',
          'Priority seat scheduling for physical circles',
          'Save 35% compared to monthly pass',
        ],
      },
    ];

    await this.membershipPlanModel.insertMany(defaultPlans);
  }

  private async seedCoursesAndLessons(instructor: any) {
    const count = await this.courseModel.countDocuments();
    let course = await this.courseModel.findOne({
      slug: 'intro-to-nextjs-app-router-1234',
    });
    const category = await this.categoryModel.findOne({
      name: 'Web Development',
    });

    if (count === 0 && category) {
      this.logger.log('Seeding mock course with lessons...');
      course = await this.courseModel.create({
        slug: 'intro-to-nextjs-app-router-1234',
        title: 'Introduction to Next.js App Router',
        description:
          'Learn dynamic layouts, service worker caching strategies, and SEO meta controls inside Next.js 16/React 19.',
        thumbnail:
          'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&q=80',
        price: 29.99,
        discountPrice: 19.99,
        categoryId: category._id.toString(),
        instructorId: instructor._id.toString(),
        published: true,
        tags: ['NextJS', 'React', 'PWA'],
      });

      const defaultLessons = [
        {
          courseId: course._id.toString(),
          title: 'Welcome to the Course & Project Setup',
          content:
            'In this lesson, we will cover the core architectural stack of Next.js 16 and structure our workspace directories.',
          videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
          order: 1,
          duration: 8,
          isFree: true,
          resources: [
            { name: 'Course_Syllabus.pdf', type: 'pdf', url: 'https://example.com/syllabus.pdf' },
            { name: 'Project_Boilerplate.zip', type: 'code', url: 'https://example.com/boilerplate.zip' },
            { name: 'Introduction_Slides.pdf', type: 'slides', url: 'https://example.com/slides.pdf' }
          ]
        },
        {
          courseId: course._id.toString(),
          title: 'Understanding Turbopack and Webpack Compiler Configs',
          content:
            'We will configure our app layout and resolve Turbopack configuration warnings when utilizing offline service worker generators.',
          videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
          order: 2,
          duration: 12,
          isFree: false,
          resources: [
            { name: 'Turbopack_Deep_Dive.pdf', type: 'pdf', url: 'https://example.com/turbopack.pdf' },
            { name: 'Compiler_Configurations.zip', type: 'code', url: 'https://example.com/configs.zip' }
          ]
        },
      ];

      await this.lessonModel.insertMany(defaultLessons);

      // Seed a Course Blueprint (Unpublished)
      await this.courseModel.create({
        slug: 'enterprise-backend-architecture-5678',
        title: 'Enterprise Backend Architecture with NestJS',
        description:
          'Design REST APIs, dependency injection patterns, Mongoose schemas, and route guards for large applications.',
        thumbnail:
          'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=600&q=80',
        price: 49.99,
        categoryId: category._id.toString(),
        instructorId: instructor._id.toString(),
        published: false,
        tags: ['NestJS', 'MongoDB', 'Architecture'],
      });
    }

    const firstLesson = await this.lessonModel.findOne({
      courseId: course?._id?.toString(),
    });
    return { course, lesson: firstLesson };
  }

  private async seedCenters() {
    const count = await this.centerModel.countDocuments();
    if (count > 0) return;

    this.logger.log('Seeding local center configurations...');
    await this.centerModel.create({
      name: 'Downtown Tech Hub',
      location: '128 Innovation Way, Sector 4',
      classrooms: [
        { name: 'Room 101', capacity: 15 },
        { name: 'Room 102', capacity: 25 },
      ],
    });
    await this.centerModel.create({
      name: 'Suburban Study Circle',
      location: '44 Library Lane, West End',
      classrooms: [{ name: 'Lab A', capacity: 10 }],
    });
  }

  private async seedMockAnalyticsData(student: any, course: any, lesson: any) {
    if (!student || !course) return;

    // Enroll student in Course if not exists
    const hasEnrollment = await this.enrollmentModel.findOne({
      userId: student._id.toString(),
      courseId: course._id.toString(),
    });
    if (!hasEnrollment) {
      this.logger.log('Seeding mock enrollment and review details...');
      await this.enrollmentModel.create({
        userId: student._id.toString(),
        courseId: course._id.toString(),
        progress: 50,
      });

      await this.reviewModel.create({
        userId: student._id.toString(),
        courseId: course._id.toString(),
        rating: 5,
        comment:
          'Very interactive sessions and the offline app is extremely responsive!',
      });
    }

    // Mock Order
    const hasOrder = await this.orderModel.findOne({
      userId: student._id.toString(),
      courseId: course._id.toString(),
    });
    if (!hasOrder) {
      this.logger.log('Seeding mock orders for revenue calculations...');
      await this.orderModel.create({
        userId: student._id.toString(),
        courseId: course._id.toString(),
        amount: course.price || 29.99,
        status: 'PAID',
        stripeId: 'ch_mock_' + Math.random().toString(36).substring(7),
      });
    }

    // Mock Assignment Submission
    if (lesson) {
      const hasSubmission = await this.submissionModel.findOne({
        userId: student._id.toString(),
        lessonId: lesson._id.toString(),
      });
      if (!hasSubmission) {
        this.logger.log('Seeding mock assignment submission...');
        await this.submissionModel.create({
          userId: student._id.toString(),
          courseId: course._id.toString(),
          lessonId: lesson._id.toString(),
          content:
            '```typescript\n// Strict mode check\nconst config: string = "Hello LearnLocal";\nconsole.log(config);\n```',
          status: 'PENDING',
        });
      }
    }
  }

  private async seedQuizzesAndGroups() {
    this.logger.log('Seeding mock quizzes and study circles...');
    const lessons = await this.lessonModel.find().exec();
    for (const lesson of lessons) {
      const existingQuiz = await this.quizModel.findOne({ lessonId: lesson._id.toString() });
      if (!existingQuiz) {
        await this.quizModel.create({
          lessonId: lesson._id.toString(),
          questions: [
            {
              questionText: `Which is a key architecture concept of ${lesson.title}?`,
              options: ['Strict Types Compilation', 'Monolithic Routing', 'Client-side Local Hydration', 'Single-threaded Callbacks'],
              correctAnswerIndex: 0,
            },
            {
              questionText: `What benefit does ${lesson.title} introduce in performance?`,
              options: ['Optimized bundle sizes', 'Increased payload latency', 'Synchronous thread locks', 'Shared state mutations'],
              correctAnswerIndex: 0,
            },
            {
              questionText: `How should you manage code configurations for ${lesson.title}?`,
              options: ['Declarative environments config', 'Inline variables scope', 'Dynamic database polling', 'Static global memory'],
              correctAnswerIndex: 0,
            }
          ]
        });
      }
    }

    const courses = await this.courseModel.find().exec();
    for (const course of courses) {
      const existingGroup = await this.studyGroupModel.findOne({ courseId: course._id.toString() });
      if (!existingGroup) {
        await this.studyGroupModel.create({
          name: `${course.title} Study Circle`,
          description: `Collaborative study classroom group for sharing worksheets and solutions in ${course.title}.`,
          courseId: course._id.toString(),
          createdBy: 'default_seeder',
          members: [],
          chat: [
            { username: 'john_mentor', avatar: '', content: `Welcome to the ${course.title} Study Circle!`, createdAt: new Date() },
            { username: 'bob_student', avatar: '', content: `Excited to collaborate and check out the dynamic layout resources here!`, createdAt: new Date() }
          ],
          resources: [
            { name: 'Complete_Boilerplate.zip', type: 'code', url: 'https://example.com/boilerplate.zip' },
            { name: 'Syllabus_Mindmap.pdf', type: 'pdf', url: 'https://example.com/syllabus.pdf' }
          ]
        });
      }
    }
  }
}
