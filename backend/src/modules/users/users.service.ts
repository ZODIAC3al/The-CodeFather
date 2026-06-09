import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../../schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async findOneByUsername(username: string) {
    return this.userModel.findOne({ username }).exec();
  }

  async findOneByEmail(email: string) {
    return this.userModel.findOne({ email }).exec();
  }

  async findById(id: string) {
    return this.userModel.findById(id).select('-passwordHash').exec();
  }

  async create(email: string, username: string, passwordHash: string, role: string = 'STUDENT') {
    const createdUser = new this.userModel({
      email,
      username,
      passwordHash,
      role,
    });
    return createdUser.save();
  }

  async updateProfile(id: string, data: { 
    bio?: string; 
    avatar?: string; 
    email?: string; 
    username?: string;
    fullName?: string;
    nickName?: string;
    gender?: string;
    country?: string;
    language?: string;
    timeZone?: string;
  }) {
    return this.userModel.findByIdAndUpdate(id, data, { new: true }).select('-passwordHash').exec();
  }
}
