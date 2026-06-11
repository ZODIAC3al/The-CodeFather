import {
  Body,
  Controller,
  Headers,
  Post,
  Req,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';

import { Public } from '../../common/decorators/public.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PaymentsService } from './payments.service';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('checkout')
  @ApiBody({
    schema: { type: 'object', properties: { courseId: { type: 'string' } } },
  })
  createCheckoutSession(
    @Body('courseId') courseId: string,
    @Request() req: any,
  ) {
    return this.paymentsService.createCheckoutSession(req.user.sub, courseId, 'SINGLE');
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
    schema: { type: 'object', properties: { courseId: { type: 'string' }, planId: { type: 'string' }, accessType: { type: 'string' } } },
  })
  createPayPalOrder(
    @Body() body: { courseId?: string; planId?: string; accessType?: 'SINGLE' | 'SUBSCRIPTION' },
    @Request() req: any,
  ) {
    return this.paymentsService.createPayPalOrder(req.user.sub, body.courseId, body.planId, body.accessType || 'SINGLE');
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
}
