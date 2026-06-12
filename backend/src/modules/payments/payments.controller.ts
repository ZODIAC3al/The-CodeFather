import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Req,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';

import { Public } from '../../common/decorators/public.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PaymentsService } from './payments.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order } from '../../schemas/order.schema';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(
    private paymentsService: PaymentsService,
    @InjectModel(Order.name) private orderModel: Model<Order>,
  ) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('checkout')
  @ApiBody({
    schema: { type: 'object', properties: { courseId: { type: 'string' }, accessType: { type: 'string' }, quantity: { type: 'number' } } },
  })
  createCheckoutSession(
    @Body() body: { courseId: string; accessType?: string; quantity?: number },
    @Request() req: any,
  ) {
    return this.paymentsService.createCheckoutSession(
      req.user.sub,
      body.courseId,
      body.accessType === 'GROUP' ? 'GROUP' : 'SINGLE',
      body.quantity || 1,
    );
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('checkout-subscription')
  @ApiBody({
    schema: { type: 'object', properties: { planId: { type: 'string' } } },
  })
  createSubscriptionCheckout(
    @Body('planId') planId: string,
    @Request() req: any,
  ) {
    return this.paymentsService.createCheckoutSession(req.user.sub, planId, 'SUBSCRIPTION');
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('paypal/create-order')
  @ApiBody({
    schema: { type: 'object', properties: { courseId: { type: 'string' }, planId: { type: 'string' }, accessType: { type: 'string' }, quantity: { type: 'number' } } },
  })
  createPayPalOrder(
    @Body() body: { courseId?: string; planId?: string; accessType?: string; quantity?: number },
    @Request() req: any,
  ) {
    return this.paymentsService.createPayPalOrder(
      req.user.sub,
      body.courseId,
      body.planId,
      body.accessType === 'GROUP' ? 'GROUP' : 'SINGLE',
      body.quantity || 1,
    );
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('paypal/authorize')
  @ApiBody({
    schema: { type: 'object', properties: { orderID: { type: 'string' } } },
  })
  authorizePayPalPayment(
    @Body('orderID') orderID: string,
    @Request() req: any,
  ) {
    return this.paymentsService.authorizePayPalPayment(req.user.sub, orderID);
  }

  @Public()
  @Post('paypal/webhook')
  handlePayPalWebhook(@Req() req: any, @Body() payload: any) {
    return this.paymentsService.handlePayPalWebhook(payload);
  }

  @Public()
  @Get('group/:token')
  getGroupByToken(@Param('token') token: string) {
    return this.paymentsService.getGroupByToken(token);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('group/:token/join')
  joinGroupByToken(@Param('token') token: string, @Request() req: any) {
    return this.paymentsService.joinGroupByToken(token, req.user.sub);
  }

  @Public()
  @Post('webhook')
  handleWebhook(
    @Req() req: any,
    @Body() payload: any,
    @Headers('stripe-signature') sig: string,
  ) {
    const rawBody =
      req.rawBody ??
      (Buffer.isBuffer(payload)
        ? payload
        : Buffer.from(JSON.stringify(payload)));
    return this.paymentsService.handleWebhook(rawBody, sig);
  }

  @Public()
  @Get('orders/:sessionId')
  getOrder(@Param('sessionId') sessionId: string) {
    return this.orderModel.findOne({ stripeId: sessionId })
      .populate('courseId')
      .lean();
  }

  @Public()
  @Get('course/:id')
  getCourseById(@Param('id') id: string) {
    return this.paymentsService.getCourseById(id);
  }
}
