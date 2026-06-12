import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { MembershipsService } from './memberships.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';
import { ApiTags, ApiBearerAuth, ApiBody } from '@nestjs/swagger';

@ApiTags('memberships')
@Controller('memberships')
export class MembershipsController {
  constructor(private membershipsService: MembershipsService) {}

  @Public()
  @Get('plans')
  findAllPlans() {
    return this.membershipsService.findAllPlans();
  }

  @Public()
  @Get('plans/:id')
  findOnePlan(@Param('id') id: string) {
    return this.membershipsService.findOnePlan(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('my')
  getMyMembership(@Request() req: any) {
    return this.membershipsService.getMyMembership(req.user.sub);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('subscribe')
  @ApiBody({
    schema: { type: 'object', properties: { planId: { type: 'string' } } },
  })
  purchaseMembership(@Body('planId') planId: string, @Request() req: any) {
    return this.membershipsService.purchaseMembership(req.user.sub, planId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('cancel')
  cancelMembership(@Request() req: any) {
    return this.membershipsService.cancelMembership(req.user.sub);
  }
}
