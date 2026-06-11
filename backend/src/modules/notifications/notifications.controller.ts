import {
  Controller,
  Get,
  Patch,
  Param,
  UseGuards,
  Request,
  Post,
  Body,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NotificationsService } from './notifications.service';

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Get()
  getNotifications(@Request() req: any) {
    return this.notificationsService.getNotifications(req.user.sub);
  }

  @Post('test')
  triggerTestNotification(
    @Request() req: any,
    @Body() body: { title?: string; message?: string; type?: string },
  ) {
    return this.notificationsService.createNotification(
      req.user.sub,
      body.title || 'Test Notification',
      body.message ||
        'This is a test notification generated via the developer console.',
      body.type || 'SYSTEM',
    );
  }

  @Patch('read-all')
  markAllAsRead(@Request() req: any) {
    return this.notificationsService.markAllAsRead(req.user.sub);
  }

  @Patch(':id/read')
  markAsRead(@Param('id') id: string, @Request() req: any) {
    return this.notificationsService.markAsRead(req.user.sub, id);
  }
}
