import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MembershipPlan } from '../../schemas/membership-plan.schema';
import { Membership } from '../../schemas/membership.schema';

@Injectable()
export class MembershipsService {
  constructor(
    @InjectModel(MembershipPlan.name)
    private membershipPlanModel: Model<MembershipPlan>,
    @InjectModel(Membership.name) private membershipModel: Model<Membership>,
  ) {}

  async findAllPlans() {
    return this.membershipPlanModel.find().exec();
  }

  async findOnePlan(id: string) {
    return this.membershipPlanModel.findById(id).exec();
  }

  async getMyMembership(userId: string) {
    const mem = await this.membershipModel
      .findOne({ userId })
      .populate('planId')
      .exec();

    if (!mem) return null;

    const obj = mem.toObject();
    return {
      ...obj,
      id: mem._id.toString(),
      plan: obj.planId,
    };
  }

  async purchaseMembership(userId: string, planId: string) {
    const plan = await this.membershipPlanModel.findById(planId);
    if (!plan) throw new NotFoundException('Plan not found');

    const expiresAt = new Date();
    if (plan.interval === 'year') {
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    } else {
      expiresAt.setMonth(expiresAt.getMonth() + 1);
    }

    return this.membershipModel
      .findOneAndUpdate(
        { userId },
        {
          planId: plan._id,
          expiresAt,
          status: 'ACTIVE',
        },
        { upsert: true, new: true },
      )
      .exec();
  }

  async cancelMembership(userId: string) {
    return this.membershipModel
      .findOneAndUpdate({ userId }, { status: 'CANCELLED' }, { new: true })
      .exec();
  }
}
