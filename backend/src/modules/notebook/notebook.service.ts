import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { NotebookEntry } from '../../schemas/notebook-entry.schema';

@Injectable()
export class NotebookService {
  constructor(
    @InjectModel(NotebookEntry.name) private notebookModel: Model<NotebookEntry>,
  ) {}

  async saveEntry(userId: string, courseId: string, entry: { title: string; content: string; lessonId?: string; type?: 'scratch' | 'notes' | 'code' }) {
    return this.notebookModel.create({
      userId,
      courseId,
      lessonId: entry.lessonId,
      title: entry.title || 'Untitled',
      content: entry.content,
      type: entry.type || 'scratch',
    });
  }

  async getUserEntries(userId: string, courseId: string) {
    return this.notebookModel.find({ userId, courseId }).sort({ createdAt: -1 }).exec();
  }

  async getEntry(entryId: string, userId: string) {
    return this.notebookModel.findOne({ _id: entryId, userId }).exec();
  }

  async updateEntry(entryId: string, userId: string, updates: { title?: string; content?: string }) {
    return this.notebookModel.findOneAndUpdate(
      { _id: entryId, userId },
      updates,
      { new: true },
    ).exec();
  }

  async deleteEntry(entryId: string, userId: string) {
    return this.notebookModel.deleteOne({ _id: entryId, userId }).exec();
  }

  async exportToMarkdown(userId: string, courseId: string) {
    const entries = await this.getUserEntries(userId, courseId);
    let markdown = `# Course Notes Export\n\nExported on ${new Date().toISOString()}\n\n---\n\n`;
    
    entries.forEach((entry) => {
      markdown += `## ${entry.title || 'Untitled'}\n\n`;
      if (entry.type) markdown += `*Type: ${entry.type}*\n\n`;
      markdown += `${entry.content}\n\n---\n\n`;
    });

    return markdown;
  }

  async exportToPdf(userId: string, courseId: string) {
    const markdown = await this.exportToMarkdown(userId, courseId);
    return { markdown, format: 'pdf' };
  }
}