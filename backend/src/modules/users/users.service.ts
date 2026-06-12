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

  async create(
    email: string,
    username: string,
    passwordHash: string,
    role: string = 'STUDENT',
  ) {
    const createdUser = new this.userModel({
      email,
      username,
      passwordHash,
      role,
    });
    return createdUser.save();
  }

  async updateProfile(
    id: string,
    data: {
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
    },
  ) {
    return this.userModel
      .findByIdAndUpdate(id, data, { new: true })
      .select('-passwordHash')
      .exec();
  }

  async earnXp(id: string, amount: number) {
    const user = await this.userModel.findById(id);
    if (!user) return null;

    user.xp += amount;
    
    let nextLevel = user.level;
    const getXpRequired = (lvl: number) => {
      if (lvl === 1) return 100;
      if (lvl === 2) return 250;
      if (lvl === 3) return 500;
      if (lvl === 4) return 1000;
      return 1000 + (lvl - 4) * 1000;
    };

    while (user.xp >= getXpRequired(nextLevel)) {
      nextLevel++;
    }

    if (nextLevel > user.level) {
      user.level = nextLevel;
      if (!user.badges.includes('Fast Learner') && nextLevel >= 2) {
        user.badges.push('Fast Learner');
      }
    }

    await user.save();
    return user;
  }

  async updateStreak(id: string) {
    const user = await this.userModel.findById(id);
    if (!user) return null;

    const now = new Date();
    if (!user.lastActiveDate) {
      user.streak = 1;
      user.lastActiveDate = now;
      user.xp += 10;
    } else {
      const diffTime = Math.abs(now.getTime() - new Date(user.lastActiveDate).getTime());
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        user.streak += 1;
        user.lastActiveDate = now;
        user.xp += 10;
        
        if (user.streak >= 7 && !user.badges.includes('7-Day Streak')) {
          user.badges.push('7-Day Streak');
        }
      } else if (diffDays > 1) {
        user.streak = 1;
        user.lastActiveDate = now;
        user.xp += 10;
      }
    }
    await user.save();
    return user;
  }

  async getLeaderboard() {
    return this.userModel
      .find({ suspended: { $ne: true } })
      .sort({ xp: -1 })
      .limit(10)
      .select('username fullName avatar xp level badges streak')
      .exec();
  }
}
