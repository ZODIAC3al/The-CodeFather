import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Meeting } from '../../schemas/meeting.schema';

@Injectable()
export class MeetingsService {
  constructor(
    @InjectModel(Meeting.name) private meetingModel: Model<Meeting>,
  ) {}

  async findAll() {
    const list = await this.meetingModel.find()
      .populate('hostId', 'id username avatar')
      .sort({ startAt: 1 })
      .exec();

    return list.map((item) => {
      const obj = item.toObject();
      return {
        ...obj,
        id: item._id.toString(),
        host: obj.hostId,
      };
    });
  }

  async findOne(id: string) {
    const meeting = await this.meetingModel.findById(id)
      .populate('hostId', 'id username avatar')
      .exec();
    
    if (!meeting) throw new NotFoundException('Meeting not found');

    const obj = meeting.toObject();
    return {
      ...obj,
      id: meeting._id.toString(),
      host: obj.hostId,
    };
  }

  async create(dto: any, hostId: string) {
    const meeting = new this.meetingModel({
      title: dto.title,
      description: dto.description,
      courseId: dto.courseId,
      hostId,
      startAt: new Date(dto.startAt),
      endAt: dto.endAt ? new Date(dto.endAt) : null,
      roomUrl: dto.roomUrl || `https://meet.jit.si/learnlocal-${Date.now()}`,
    });
    return meeting.save();
  }
}
