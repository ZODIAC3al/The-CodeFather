import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Message } from '../../schemas/message.schema';

@Injectable()
export class MessagesService {
  constructor(
    @InjectModel(Message.name) private messageModel: Model<Message>,
  ) {}

  async createMessage(
    userId: string,
    courseId: string,
    lessonId: string,
    content: string,
    language?: string,
    codeSnippet?: string,
  ) {
    const created = new this.messageModel({
      userId,
      courseId,
      lessonId,
      content,
      language,
      codeSnippet,
      likes: [],
    });
    const saved = await created.save();
    return saved.populate('userId', 'id username avatar');
  }

  async getMessages(lessonId: string) {
    const messages = await this.messageModel
      .find({ lessonId } as any)
      .populate('userId', 'id username avatar')
      .sort({ createdAt: 1 })
      .exec();

    return messages.map((m) => {
      const obj = m.toObject();
      return {
        ...obj,
        id: m._id.toString(),
        user: obj.userId,
      };
    });
  }

  async likeMessage(userId: string, messageId: string) {
    const message = await this.messageModel.findById(messageId);
    if (!message) {
      throw new NotFoundException('Message not found');
    }

    const index = message.likes.indexOf(userId);
    if (index > -1) {
      message.likes.splice(index, 1);
    } else {
      message.likes.push(userId);
    }

    const saved = await message.save();
    return saved.populate('userId', 'id username avatar');
  }
}
