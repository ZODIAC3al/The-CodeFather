import { Model } from 'mongoose';

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

import { Faq } from '../../schemas/faq.schema';

@Injectable()
export class HelpService {
  constructor(@InjectModel(Faq.name) private faqModel: Model<Faq>) {}

  getHelp() {
    return {
      email: 'support@thecodefather.com',
      phone: '+1-555-0123',
      hours: 'Mon-Fri 9AM-6PM EST',
    };
  }

  async createTicket(body: { subject: string; message: string }) {
    // In production, this would send an email or create a ticket in a system
    console.log('Support ticket created:', body);
    return { success: true, subject: body.subject };
  }

  async getFaqs() {
    return this.faqModel.find().sort({ order: 1 }).exec();
  }
}
