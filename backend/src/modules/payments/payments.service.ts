import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Course } from '../../schemas/course.schema';
import { Order } from '../../schemas/order.schema';
import { Enrollment } from '../../schemas/enrollment.schema';
import { User } from '../../schemas/user.schema';
import { NotificationsService } from '../notifications/notifications.service';
import Stripe from 'stripe';

@Injectable()
export class PaymentsService {
  private stripe: any = null;
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @InjectModel(Course.name) private courseModel: Model<Course>,
    @InjectModel(Order.name) private orderModel: Model<Order>,
    @InjectModel(Enrollment.name) private enrollmentModel: Model<Enrollment>,
    @InjectModel(User.name) private userModel: Model<User>,
    private notificationsService: NotificationsService,
    private config: ConfigService,
  ) {
    const key = this.config.get<string>('STRIPE_SECRET_KEY');
    if (key && !key.startsWith('sk_test_mock')) {
      try {
        this.stripe = new Stripe(key, { apiVersion: '2023-10-16' as any });
      } catch (err) {
        this.logger.warn(
          'Failed to initialize Stripe client. Using Mock checkout fallback.',
        );
      }
    } else {
      this.logger.log(
        'Stripe secret key is mock or missing. Using Mock checkout fallback.',
      );
    }
  }

  async createCheckoutSession(userId: string, courseId: string) {
    const course = await this.courseModel.findById(courseId);
    if (!course) throw new Error('Course not found');

    const price = Number(course.discountPrice ?? course.price);
    const frontendUrl =
      this.config.get('FRONTEND_URL') || 'http://localhost:3000';

    if (this.stripe) {
      try {
        const session = await this.stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          line_items: [
            {
              price_data: {
                currency: 'usd',
                product_data: {
                  name: course.title,
                  images: course.thumbnail ? [course.thumbnail] : [],
                },
                unit_amount: Math.round(price * 100),
              },
              quantity: 1,
            },
          ],
          mode: 'payment',
          success_url: `${frontendUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}&course_id=${courseId}`,
          cancel_url: `${frontendUrl}/courses/${course.slug}`,
          metadata: { userId, courseId },
        });

        await this.orderModel.create({
          userId,
          courseId,
          amount: price,
          status: 'PENDING',
          stripeId: session.id,
        });

        return { url: session.url };
      } catch (err) {
        this.logger.error(
          'Stripe session creation failed, falling back to mock.',
          err,
        );
      }
    }

    // Mock checkout fallback
    const orderId = `mock_order_${Date.now()}`;
    await this.orderModel.create({
      userId,
      courseId,
      amount: price,
      status: 'PAID',
      stripeId: orderId,
    });

    // Auto-enroll on mock payment
    try {
      await this.enrollmentModel.create({
        userId,
        courseId,
      });
      await this.triggerPurchaseNotifications(userId, courseId);
    } catch (e) {
      // already enrolled
    }

    return {
      url: `${frontendUrl}/checkout/success?session_id=${orderId}&course_id=${courseId}`,
    };
  }

  async handleWebhook(payload: Buffer, sig: string) {
    const webhookSecret = this.config.get<string>('STRIPE_WEBHOOK_SECRET');
    if (!this.stripe || !webhookSecret) {
      return { received: true, mock: true };
    }

    try {
      const event = this.stripe.webhooks.constructEvent(
        payload,
        sig,
        webhookSecret,
      );
      if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const { userId, courseId } = session.metadata!;

        await this.orderModel.updateMany(
          { stripeId: session.id },
          { status: 'PAID' },
        );

        try {
          await this.enrollmentModel.create({
            userId,
            courseId,
          });
          await this.triggerPurchaseNotifications(userId, courseId);
        } catch {}
      }
      return { received: true };
    } catch (err) {
      this.logger.error('Stripe webhook handling failed.', err);
      throw err;
    }
  }

  private async triggerPurchaseNotifications(userId: string, courseId: string) {
    try {
      const course = await this.courseModel.findById(courseId);
      if (!course) return;

      const student = await this.userModel.findById(userId);
      const studentName = student
        ? student.fullName || student.username
        : 'A student';

      // 1. Notify Student: Payment Success & Course Enrollment
      await this.notificationsService.createNotification(
        userId,
        'Payment Successful',
        `You have successfully purchased and enrolled in "${course.title}".`,
        'PAYMENT',
      );

      // 2. Notify Instructor: Course Enrollment
      if (course.instructorId) {
        await this.notificationsService.createNotification(
          course.instructorId,
          'New Enrollment',
          `${studentName} has enrolled in your course "${course.title}".`,
          'COURSE',
        );
      }

      // 3. Notify Admins: Payment Success & Course Enrollment
      const admins = await this.userModel.find({ role: 'ADMIN' });
      for (const admin of admins) {
        await this.notificationsService.createNotification(
          admin._id.toString(),
          'New Course Sale',
          `User ${studentName} purchased "${course.title}" for $${course.discountPrice ?? course.price}.`,
          'PAYMENT',
        );
      }
    } catch (err) {
      this.logger.error('Failed to trigger purchase notifications', err);
    }
  }
}
