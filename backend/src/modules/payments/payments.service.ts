import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Course } from '../../schemas/course.schema';
import { Order } from '../../schemas/order.schema';
import { Enrollment } from '../../schemas/enrollment.schema';
import { User } from '../../schemas/user.schema';
import { MembershipPlan } from '../../schemas/membership-plan.schema';
import { NotificationsService } from '../notifications/notifications.service';
import Stripe from 'stripe';

@Injectable()
export class PaymentsService {
  private stripe: any = null;
  private paypalClient: any = null;
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @InjectModel(Course.name) private courseModel: Model<Course>,
    @InjectModel(Order.name) private orderModel: Model<Order>,
    @InjectModel(Enrollment.name) private enrollmentModel: Model<Enrollment>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(MembershipPlan.name) private planModel: Model<MembershipPlan>,
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
    this.initPayPal();
  }

  private initPayPal() {
    const clientId = this.config.get<string>('PAYPAL_CLIENT_ID');
    const secret = this.config.get<string>('PAYPAL_SECRET');
    if (clientId && secret) {
      this.logger.log('PayPal client initialized');
    } else {
      this.logger.log(
        'PayPal credentials missing. Using Mock PayPal fallback.',
      );
    }
  }

  private getPayPalApiBase() {
    const isSandbox = this.config.get<string>('PAYPAL_ENV') !== 'live';
    return isSandbox
      ? 'https://api-m.sandbox.paypal.com'
      : 'https://api-m.paypal.com';
  }

  private async getPayPalToken() {
    const clientId = this.config.get<string>('PAYPAL_CLIENT_ID');
    const secret = this.config.get<string>('PAYPAL_SECRET');
    const base = this.getPayPalApiBase();
    
    const auth = Buffer.from(`${clientId}:${secret}`).toString('base64');
    const res = await fetch(`${base}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });
    
    if (!res.ok) throw new Error('Failed to get PayPal token');
    const data = await res.json();
    return data.access_token;
  }

  private generateGroupToken(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  async createCheckoutSession(userId: string, itemId: string, accessType: 'SINGLE' | 'GROUP' | 'SUBSCRIPTION' = 'SINGLE', quantity: number = 1) {
    const frontendUrl =
      this.config.get('FRONTEND_URL') || 'http://localhost:3000';

    if (accessType === 'SUBSCRIPTION') {
      const plan = await this.planModel.findById(itemId);
      if (!plan) throw new Error('Membership plan not found');
      const price = plan.price;

      if (this.stripe) {
        try {
          const session = await this.stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
              {
                price_data: {
                  currency: 'usd',
                  product_data: { name: plan.name },
                  unit_amount: Math.round(price * 100),
                  recurring: { interval: plan.interval },
                },
                quantity: 1,
              },
            ],
            mode: 'subscription',
            success_url: `${frontendUrl}/membership/success?session_id={CHECKOUT_SESSION_ID}&plan_id=${itemId}`,
            cancel_url: `${frontendUrl}/membership`,
            metadata: { userId, planId: itemId, accessType },
          });

          await this.orderModel.create({
            userId,
            planId: itemId,
            amount: price,
            status: 'PENDING',
            stripeId: session.id,
            accessType,
          });

          return { url: session.url };
        } catch (err) {
          this.logger.error('Stripe subscription failed, falling back to mock.', err);
        }
      }

      const orderId = `mock_sub_${Date.now()}`;
      await this.orderModel.create({
        userId,
        planId: itemId,
        amount: price,
        status: 'PAID',
        stripeId: orderId,
        accessType,
        authorizationExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });

      return {
        url: `${frontendUrl}/membership/success?session_id=${orderId}&plan_id=${itemId}`,
      };
    }

    const course = await this.courseModel.findById(itemId);
    if (!course) throw new Error('Course not found');

    const price = Number(course.discountPrice ?? course.price);
    const totalAmount = price * quantity;

    if (this.stripe) {
      try {
        const session = await this.stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          line_items: [
            {
              price_data: {
                currency: 'usd',
                product_data: {
                  name: quantity > 1 ? `${course.title} (Team of ${quantity})` : course.title,
                  images: course.thumbnail ? [course.thumbnail] : [],
                },
                unit_amount: Math.round(price * 100),
              },
              quantity: quantity,
            },
          ],
          mode: 'payment',
          success_url: `${frontendUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}&course_id=${itemId}&quantity=${quantity}`,
          cancel_url: `${frontendUrl}/courses/${course.slug}`,
          metadata: { userId, courseId: itemId, accessType, quantity: quantity.toString() },
        });

        const groupToken = accessType === 'GROUP' ? this.generateGroupToken() : undefined;
        await this.orderModel.create({
          userId,
          courseId: itemId,
          amount: totalAmount,
          status: 'PENDING',
          stripeId: session.id,
          accessType,
          quantity,
          groupToken,
        });

        return { url: session.url };
      } catch (err) {
        this.logger.error(
          'Stripe session creation failed, falling back to mock.',
          err,
        );
      }
    }

    const orderId = `mock_order_${Date.now()}`;
    const groupToken = accessType === 'GROUP' ? this.generateGroupToken() : undefined;
    await this.orderModel.create({
      userId,
      courseId: itemId,
      amount: totalAmount,
      status: 'PAID',
      stripeId: orderId,
      accessType,
      quantity,
      groupToken,
      authorizationExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    try {
      await this.enrollmentModel.create({ userId, courseId: itemId });
      await this.triggerPurchaseNotifications(userId, itemId, 'course');
    } catch {}

    return {
      url: `${frontendUrl}/checkout/success?session_id=${orderId}&course_id=${itemId}&quantity=${quantity}`,
    };
  }

  async createPayPalOrder(userId: string, courseId?: string, planId?: string, accessType: 'SINGLE' | 'GROUP' | 'SUBSCRIPTION' = 'SINGLE', quantity: number = 1) {
    const frontendUrl = this.config.get('FRONTEND_URL') || 'http://localhost:3000';
    let itemName: string;
    let price: number;

    if (planId) {
      const plan = await this.planModel.findById(planId);
      if (!plan) throw new Error('Membership plan not found');
      itemName = plan.name;
      price = plan.price;
    } else if (courseId) {
      const course = await this.courseModel.findById(courseId);
      if (!course) throw new Error('Course not found');
      itemName = quantity > 1 ? `${course.title} (Team of ${quantity})` : course.title;
      price = Number(course.discountPrice ?? course.price);
    } else {
      throw new Error('Either courseId or planId is required');
    }

    const totalAmount = price * quantity;

    const base = this.getPayPalApiBase();
    const accessToken = await this.getPayPalToken();

    const requestBody = {
      intent: 'AUTHORIZE',
      purchase_units: [
        {
          description: itemName,
          amount: {
            currency_code: 'USD',
            value: totalAmount.toFixed(2),
          },
        },
      ],
      application_context: {
        brand_name: 'The Codefather',
        landing_page: 'BILLING',
        user_action: 'PAY_NOW',
        return_url: `${frontendUrl}/checkout/success?paypal_return=true&course_id=${courseId || ''}&quantity=${quantity}`,
        cancel_url: `${frontendUrl}/membership`,
      },
    };

    const res = await fetch(`${base}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!res.ok) {
      const error = await res.text();
      this.logger.error('PayPal order creation failed', error);
      throw new Error('Failed to create PayPal order');
    }

    const order = await res.json();
    const orderId = order.id;

    const groupToken = accessType === 'GROUP' ? this.generateGroupToken() : undefined;
    await this.orderModel.create({
      userId,
      courseId: accessType !== 'SUBSCRIPTION' ? courseId : undefined,
      planId: accessType === 'SUBSCRIPTION' ? planId : undefined,
      amount: totalAmount,
      status: 'AUTHORIZED',
      paypalOrderId: orderId,
      paypalAuthorizationId: `auth_${orderId}`,
      accessType,
      quantity,
      groupToken,
      authorizationExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    return { orderId, status: order.status, links: order.links };
  }

  async authorizePayPalPayment(userId: string, orderID: string) {
    const order = await this.orderModel.findOne({ paypalOrderId: orderID, userId });
    if (!order) throw new Error('Order not found');

    const base = this.getPayPalApiBase();
    const accessToken = await this.getPayPalToken();

    const res = await fetch(`${base}/v2/checkout/orders/${orderID}/authorize`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        payment_source: {
          paypal: {
            attributes: {
              usage_type: 'MERCHANT',
              setup_future_usage: 'PERMISSION',
            },
          },
        },
      }),
    });

    if (!res.ok) {
      this.logger.error('PayPal authorization failed');
      throw new Error('Authorization failed');
    }

    const authData = await res.json();
    const authorization = authData.purchase_units?.[0]?.payments?.authorizations?.[0];

    if (authorization) {
      order.paypalAuthorizationId = authorization.id;
      order.status = 'AUTHORIZED';
      order.authorizationExpiry = authorization.seller_payable_breakdown?.expires_at
        ? new Date(authorization.seller_payable_breakdown.expires_at)
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      await order.save();

      if (order.courseId) {
        try {
          await this.enrollmentModel.create({ userId: order.userId, courseId: order.courseId });
        } catch {}
      }
    }

    return { success: true, authorization: authData };
  }

  async handlePayPalWebhook(payload: any) {
    try {
      const event = payload;

      if (event.event_type === 'PAYMENTS.AUTHORIZATION.CREATED' || event.event_type === 'CHECKOUT.ORDER.COMPLETED') {
        const orderId = event.resource?.id;
        const payerId = event.resource?.payer?.payer_id;

        await this.orderModel.updateMany(
          { paypalOrderId: orderId },
          { status: 'PAID' },
        );
      }

      return { received: true };
    } catch (err) {
      this.logger.error('PayPal webhook handling failed', err);
      throw err;
    }
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
        const { userId, courseId, planId, accessType, quantity } = session.metadata as any;

        await this.orderModel.updateMany(
          { stripeId: session.id },
          { status: 'PAID' },
        );

        if (accessType === 'SUBSCRIPTION' && planId) {
          await this.userModel.findByIdAndUpdate(userId, {
            $setOnInsert: { membershipStartedAt: new Date() },
          });
        } else if (courseId) {
          try {
            await this.enrollmentModel.create({ userId, courseId });
            await this.triggerPurchaseNotifications(userId, courseId, 'course');
          } catch {}
        }
      }
      return { received: true };
    } catch (err) {
      this.logger.error('Stripe webhook handling failed.', err);
      throw err;
    }
  }

  private async triggerPurchaseNotifications(userId: string, itemId: string, type: 'course' | 'subscription') {
    try {
      const student = await this.userModel.findById(userId);
      const studentName = student
        ? student.fullName || student.username
        : 'A student';

      if (type === 'course') {
        const course = await this.courseModel.findById(itemId);
        if (!course) return;

        await this.notificationsService.createNotification(
          userId,
          'Payment Successful',
          `You have successfully purchased and enrolled in "${course.title}".`,
          'PAYMENT',
        );

        if (course.instructorId) {
          await this.notificationsService.createNotification(
            course.instructorId,
            'New Enrollment',
            `${studentName} has enrolled in your course "${course.title}".`,
            'COURSE',
          );
        }

        const admins = await this.userModel.find({ role: 'ADMIN' });
        for (const admin of admins) {
          await this.notificationsService.createNotification(
            admin._id.toString(),
            'New Course Sale',
            `User ${studentName} purchased "${course.title}" for $${course.discountPrice ?? course.price}.`,
            'PAYMENT',
          );
        }
      } else {
        const plan = await this.planModel.findById(itemId);
        if (!plan) return;

        await this.notificationsService.createNotification(
          userId,
          'Subscription Activated',
          `Your ${plan.name} subscription has been activated successfully.`,
          'PAYMENT',
        );

        const admins = await this.userModel.find({ role: 'ADMIN' });
        for (const admin of admins) {
          await this.notificationsService.createNotification(
            admin._id.toString(),
            'New Subscription',
            `User ${studentName} subscribed to ${plan.name} plan.`,
            'PAYMENT',
          );
        }
      }
    } catch (err) {
      this.logger.error('Failed to trigger purchase notifications', err);
    }
  }

  async getGroupByToken(token: string) {
    const order = await this.orderModel.findOne({ groupToken: token, status: 'PAID' })
      .populate('courseId')
      .lean();
    if (!order) return null;
    return order;
  }

  async joinGroupByToken(token: string, userId: string) {
    const order = await this.orderModel.findOne({ groupToken: token, status: 'PAID' });
    if (!order || !order.courseId) return null;

    const existingEnrollment = await this.enrollmentModel.findOne({ userId, courseId: order.courseId });
    if (existingEnrollment) return { alreadyEnrolled: true, order };

    await this.enrollmentModel.create({ userId, courseId: order.courseId });
    return { order, enrolled: true };
  }
}