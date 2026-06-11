import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Notification } from '../../schemas/notification.schema';
import { NotificationsGateway } from './notifications.gateway';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectModel(Notification.name)
    private notificationModel: Model<Notification>,
    private gateway: NotificationsGateway,
  ) {}

  async createNotification(
    userId: string,
    title: string,
    message: string,
    type: string,
  ): Promise<Notification> {
    this.logger.log(
      `Creating notification: [${type}] user=${userId} title=${title}`,
    );
    const notification = await this.notificationModel.create({
      userId,
      title,
      message,
      type,
    });

    try {
      this.gateway.sendToUser(userId, notification);
    } catch (err) {
      this.logger.error('Failed to emit WebSocket notification', err);
    }

    return notification;
  }

  async getNotifications(userId: string): Promise<Notification[]> {
    return this.notificationModel
      .find({ userId })
      .sort({ createdAt: -1 })
      .exec();
  }

  async markAsRead(
    userId: string,
    notificationId: string,
  ): Promise<Notification | null> {
    return this.notificationModel
      .findOneAndUpdate(
        { _id: notificationId, userId },
        { read: true },
        { new: true },
      )
      .exec();
  }

  async markAllAsRead(userId: string): Promise<any> {
    return this.notificationModel
      .updateMany({ userId, read: false }, { read: true })
      .exec();
  }
}
