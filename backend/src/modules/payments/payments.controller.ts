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
    return this.paymentsService.createCheckoutSession(req.user.sub, courseId);
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
