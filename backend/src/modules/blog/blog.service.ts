import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BlogPost } from '../../schemas/blog-post.schema';

@Injectable()
export class BlogService {
  constructor(
    @InjectModel(BlogPost.name) private blogPostModel: Model<BlogPost>,
  ) {}

  async findAll(page = 1, limit = 9) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.blogPostModel
        .find({ publishedAt: { $ne: null } })
        .skip(skip)
        .limit(limit)
        .populate('authorId', 'id username avatar')
        .sort({ publishedAt: -1 })
        .exec(),
      this.blogPostModel.countDocuments({ publishedAt: { $ne: null } }).exec(),
    ]);

    const mapped = data.map((item) => {
      const obj = item.toObject();
      return {
        ...obj,
        id: item._id.toString(),
        author: obj.authorId,
      };
    });

    return { data: mapped, total, page, limit };
  }

  async findOne(slug: string) {
    const post = await this.blogPostModel
      .findOne({ slug })
      .populate('authorId', 'id username avatar bio')
      .exec();

    if (!post) throw new NotFoundException('Post not found');

    await this.blogPostModel.updateOne({ slug }, { $inc: { views: 1 } });

    const obj = post.toObject();
    return {
      ...obj,
      id: post._id.toString(),
      author: obj.authorId,
    };
  }

  async create(dto: any, authorId: string) {
    const slug =
      dto.title
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '') +
      '-' +
      Date.now();
    const post = new this.blogPostModel({
      title: dto.title,
      body: dto.body,
      slug,
      thumbnail: dto.thumbnail,
      authorId,
      tags: dto.tags || [],
      publishedAt: dto.published ? new Date() : null,
    });
    return post.save();
  }

  async update(id: string, dto: any) {
    const { published, ...rest } = dto;
    const data: any = { ...rest };
    if (published !== undefined) {
      data.publishedAt = published ? new Date() : null;
    }
    return this.blogPostModel.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  async remove(id: string) {
    return this.blogPostModel.findByIdAndDelete(id).exec();
  }
}
