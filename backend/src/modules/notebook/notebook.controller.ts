import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NotebookService } from './notebook.service';

@ApiTags('notebook')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notebook')
export class NotebookController {
  constructor(private notebookService: NotebookService) {}

  @Post()
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        courseId: { type: 'string' },
        lessonId: { type: 'string' },
        title: { type: 'string' },
        content: { type: 'string' },
        type: { type: 'string', enum: ['scratch', 'notes', 'code'] },
      },
    },
  })
  saveEntry(@Body() body: any, @Request() req: any) {
    return this.notebookService.saveEntry(req.user.sub, body.courseId, body);
  }

  @Get()
  getUserEntries(@Query('courseId') courseId: string, @Request() req: any) {
    return this.notebookService.getUserEntries(req.user.sub, courseId);
  }

  @Get(':id')
  getEntry(@Param('id') id: string, @Request() req: any) {
    return this.notebookService.getEntry(id, req.user.sub);
  }

  @Patch(':id')
  updateEntry(@Param('id') id: string, @Body() body: any, @Request() req: any) {
    return this.notebookService.updateEntry(id, req.user.sub, body);
  }

  @Delete(':id')
  deleteEntry(@Param('id') id: string, @Request() req: any) {
    return this.notebookService.deleteEntry(id, req.user.sub);
  }

  @Get('export/markdown')
  exportMarkdown(@Query('courseId') courseId: string, @Request() req: any) {
    return this.notebookService.exportToMarkdown(req.user.sub, courseId);
  }

  @Post('export/pdf')
  exportPdf(@Body() body: { courseId: string }, @Request() req: any) {
    return this.notebookService.exportToPdf(req.user.sub, body.courseId);
  }
}