import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Schedule } from '../../schemas/schedule.schema';

@UseGuards(JwtAuthGuard)
@Controller('schedules')
export class SchedulesController {
  constructor(
    @InjectModel(Schedule.name) private scheduleModel: Model<Schedule>,
  ) {}

  @Get('me')
  async getSchedule(@Request() req: any) {
    const userId = req.user.sub;
    let schedule = await this.scheduleModel.findOne({ userId }).exec();
    if (!schedule) {
      // Create a default schedule with dummy visual calendar items if not found
      schedule = new this.scheduleModel({
        userId,
        dailyGoalMinutes: 30,
        weeklyGoalMinutes: 150,
        todos: [
          { text: 'Set up NextJS compile options', completed: true },
          { text: 'Learn Turbopack architecture', completed: false },
          { text: 'Complete dynamic layouts assignment', completed: false },
        ],
      });
      await schedule.save();
    }
    return schedule;
  }

  @Post('me/goals')
  async updateGoals(
    @Request() req: any,
    @Body() body: { dailyGoalMinutes?: number; weeklyGoalMinutes?: number },
  ) {
    const userId = req.user.sub;
    let schedule = await this.scheduleModel.findOne({ userId }).exec();
    if (!schedule) {
      schedule = new this.scheduleModel({ userId });
    }

    if (body.dailyGoalMinutes !== undefined) {
      schedule.dailyGoalMinutes = body.dailyGoalMinutes;
    }
    if (body.weeklyGoalMinutes !== undefined) {
      schedule.weeklyGoalMinutes = body.weeklyGoalMinutes;
    }

    return schedule.save();
  }

  @Post('me/todos')
  async addTodo(@Request() req: any, @Body() body: { text: string }) {
    const userId = req.user.sub;
    let schedule = await this.scheduleModel.findOne({ userId }).exec();
    if (!schedule) {
      schedule = new this.scheduleModel({ userId });
    }

    const todo = {
      text: body.text,
      completed: false,
      dueDate: new Date(),
    };

    schedule.todos.push(todo);
    await schedule.save();
    return todo;
  }

  @Patch('me/todos/:index')
  async toggleTodo(
    @Request() req: any,
    @Param('index') todoIndex: string,
    @Body() body: { completed: boolean },
  ) {
    const userId = req.user.sub;
    const schedule = await this.scheduleModel.findOne({ userId }).exec();
    if (!schedule) return null;

    const idx = parseInt(todoIndex, 10);
    if (schedule.todos[idx]) {
      schedule.todos[idx].completed = body.completed;
      schedule.markModified('todos');
      await schedule.save();
    }
    return schedule;
  }
}
