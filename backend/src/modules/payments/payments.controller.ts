import { Controller, Post, Body, UseGuards, Request, Headers } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';
import { ApiTags, ApiBearerAuth, ApiBody } from '@nestjs/swagger';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('checkout')
  @ApiBody({ schema: { type: 'object', properties: { courseId: { type: 'string' } } } })
  createCheckoutSession(@Body('courseId') courseId: string, @Request() req: any) {
    return this.paymentsService.createCheckoutSession(req.user.sub, courseId);
  }

  @Public()
  @Post('webhook')
  handleWebhook(
    @Body() payload: any,
    @Headers('stripe-signature') sig: string,
  ) {
    // If webhook is raw buffer, parse inside NestJS custom middleware or raw controller
    const buffer = Buffer.isBuffer(payload) ? payload : Buffer.from(JSON.stringify(payload));
    return this.paymentsService.handleWebhook(buffer, sig);
  }
}
