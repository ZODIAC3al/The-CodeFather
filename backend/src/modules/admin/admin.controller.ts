import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin')
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('analytics')
  getAnalytics() {
    return this.adminService.getAnalytics();
  }

  @Get('payments')
  getPayments() {
    return this.adminService.getPayments();
  }

  @Get('payments/analytics')
  getPaymentsAnalytics() {
    return this.adminService.getPaymentsAnalytics();
  }

  @Post('payments/refund')
  refundPayment(@Body() body: { orderId: string; reason?: string }) {
    return this.adminService.refundPayment(body.orderId, body.reason);
  }

  @Get('payments/export')
  exportPayments() {
    return this.adminService.exportPayments();
  }

  @Get('settings')
  getSettings() {
    return this.adminService.getSettings();
  }

  @Patch('settings')
  updateSettings(@Body() body: Record<string, unknown>) {
    return this.adminService.updateSettings(body);
  }

  @Get('help')
  getHelp() {
    return this.adminService.getHelp();
  }

  @Post('help/ticket')
  createHelpTicket(@Body() body: { subject: string; message: string }) {
    return this.adminService.createHelpTicket(body);
  }

  @Get('faq')
  getFaqs() {
    return this.adminService.getFaqs();
  }

  @Get('leaderboard')
  getLeaderboard() {
    return this.adminService.getLeaderboard();
  }

  @Get('users')
  getAllUsers() {
    return this.adminService.getAllUsers();
  }

  @Patch('users/:id/role')
  updateUserRoleOrSuspension(
    @Param('id') userId: string,
    @Body() body: { role?: string; suspended?: boolean },
  ) {
    return this.adminService.updateUserRoleOrSuspension(userId, body);
  }

  @Get('centers')
  getCenters() {
    return this.adminService.getCenters();
  }

  @Post('centers')
  createCenter(
    @Body()
    body: {
      name: string;
      location: string;
      classrooms: Array<{ name: string; capacity: number }>;
    },
  ) {
    return this.adminService.createCenter(body);
  }

  @Delete('centers/:id')
  deleteCenter(@Param('id') id: string) {
    return this.adminService.deleteCenter(id);
  }

  @Get('pending-courses')
  getPendingCourses() {
    return this.adminService.getPendingCourses();
  }

  @Patch('courses/:id/approve')
  approveCourse(@Param('id') courseId: string) {
    return this.adminService.approveCourse(courseId);
  }

  @Patch('courses/:id/reject')
  rejectCourse(@Param('id') courseId: string) {
    return this.adminService.rejectCourse(courseId);
  }

  @Post('assign-blueprint')
  assignBlueprintToSlot(
    @Body()
    body: {
      courseId: string;
      centerId: string;
      roomName: string;
      startAt: string;
      durationHours: number;
    },
  ) {
    return this.adminService.assignBlueprintToSlot(body);
  }

  @Get('enrollments')
  getAllEnrollments() {
    return this.adminService.getAllEnrollments();
  }
}
