import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';
import { ApiTags, ApiBearerAuth, ApiBody } from '@nestjs/swagger';

@ApiTags('messages')
@Controller('messages')
export class MessagesController {
  constructor(private messagesService: MessagesService) {}

  @Public()
  @Get(':lessonId')
  getMessages(@Param('lessonId') lessonId: string) {
    return this.messagesService.getMessages(lessonId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        courseId: { type: 'string' },
        lessonId: { type: 'string' },
        content: { type: 'string' },
        language: { type: 'string' },
        codeSnippet: { type: 'string' },
      },
      required: ['courseId', 'lessonId', 'content'],
    },
  })
  createMessage(
    @Body('courseId') courseId: string,
    @Body('lessonId') lessonId: string,
    @Body('content') content: string,
    @Body('language') language: string,
    @Body('codeSnippet') codeSnippet: string,
    @Request() req: any,
  ) {
    return this.messagesService.createMessage(
      req.user.sub,
      courseId,
      lessonId,
      content,
      language,
      codeSnippet,
    );
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post(':messageId/like')
  likeMessage(@Param('messageId') messageId: string, @Request() req: any) {
    return this.messagesService.likeMessage(req.user.sub, messageId);
  }
}
