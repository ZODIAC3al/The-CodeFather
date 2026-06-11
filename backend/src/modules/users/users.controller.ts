import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
  Request,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  async getMe(@Request() req: any) {
    const user = await this.usersService.findById(req.user.sub);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  @Patch('profile')
  async updateProfile(
    @Request() req: any,
    @Body()
    body: {
      email?: string;
      username?: string;
      bio?: string;
      avatar?: string;
      fullName?: string;
      nickName?: string;
      gender?: string;
      country?: string;
      language?: string;
      timeZone?: string;
    },
  ) {
    const userId = req.user.sub;
    const currentUser = await this.usersService.findById(userId);
    if (!currentUser) throw new NotFoundException('User not found');

    // Email unique check
    if (body.email && body.email !== (currentUser as any).email) {
      const emailExists = await this.usersService.findOneByEmail(body.email);
      if (emailExists) throw new ConflictException('Email already taken');
    }

    // Username unique check
    if (body.username && body.username !== (currentUser as any).username) {
      const usernameExists = await this.usersService.findOneByUsername(
        body.username,
      );
      if (usernameExists) throw new ConflictException('Username already taken');
    }

    // Update profile in database
    const updateData: any = {};
    if (body.bio !== undefined) updateData.bio = body.bio;
    if (body.avatar !== undefined) updateData.avatar = body.avatar;
    if (body.email !== undefined) updateData.email = body.email;
    if (body.username !== undefined) updateData.username = body.username;
    if (body.fullName !== undefined) updateData.fullName = body.fullName;
    if (body.nickName !== undefined) updateData.nickName = body.nickName;
    if (body.gender !== undefined) updateData.gender = body.gender;
    if (body.country !== undefined) updateData.country = body.country;
    if (body.language !== undefined) updateData.language = body.language;
    if (body.timeZone !== undefined) updateData.timeZone = body.timeZone;

    return this.usersService.updateProfile(userId, updateData);
  }
}
