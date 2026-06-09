import { Controller, Post, UseInterceptors, UploadedFile, UseGuards, Get, Param, Res } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { memoryStorage } from 'multer';
import { ApiTags, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { Response } from 'express';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('upload')
@Controller('upload')
export class UploadController {
  constructor(private uploadService: UploadService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
      },
    }),
  )
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    return this.uploadService.handleUpload(file);
  }

  @Public()
  @Get('file/:filename')
  serveFile(@Param('filename') filename: string, @Res() res: any) {
    return res.status(404).json({ message: 'Local file serving is disabled in production. Files are served via Cloudinary.' });
  }
}
