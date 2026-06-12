import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { StudyGroup } from '../../schemas/study-group.schema';

@UseGuards(JwtAuthGuard)
@Controller('study-groups')
export class StudyGroupsController {
  constructor(
    @InjectModel(StudyGroup.name) private studyGroupModel: Model<StudyGroup>,
  ) {}

  @Get()
  async getGroups() {
    return this.studyGroupModel.find().exec();
  }

  @Post()
  async createGroup(
    @Request() req: any,
    @Body() body: { name: string; description?: string; courseId: string },
  ) {
    const group = new this.studyGroupModel({
      name: body.name,
      description: body.description,
      courseId: body.courseId,
      createdBy: req.user.sub,
      members: [req.user.sub],
    });
    return group.save();
  }

  @Post(':id/join')
  async joinGroup(@Param('id') groupId: string, @Request() req: any) {
    const group = await this.studyGroupModel.findById(groupId);
    if (!group) throw new NotFoundException('Study group not found');

    const userId = req.user.sub;
    if (!group.members.includes(userId)) {
      group.members.push(userId);
      await group.save();
    }
    return group;
  }

  @Get(':id/chat')
  async getChat(@Param('id') groupId: string) {
    const group = await this.studyGroupModel.findById(groupId);
    if (!group) throw new NotFoundException('Study group not found');
    return group.chat;
  }

  @Post(':id/chat')
  async sendChatMessage(
    @Param('id') groupId: string,
    @Request() req: any,
    @Body() body: { content: string },
  ) {
    const group = await this.studyGroupModel.findById(groupId);
    if (!group) throw new NotFoundException('Study group not found');

    const chatMessage = {
      username: req.user.username || 'Student User',
      avatar: req.user.avatar || '',
      content: body.content,
      createdAt: new Date(),
    };

    group.chat.push(chatMessage);
    await group.save();
    return chatMessage;
  }

  @Post(':id/resources')
  async shareResource(
    @Param('id') groupId: string,
    @Body() body: { name: string; type: string; url: string },
  ) {
    const group = await this.studyGroupModel.findById(groupId);
    if (!group) throw new NotFoundException('Study group not found');

    const resource = {
      name: body.name,
      type: body.type,
      url: body.url,
    };

    group.resources.push(resource);
    await group.save();
    return resource;
  }
}
