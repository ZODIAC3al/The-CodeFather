import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import * as fs from 'fs';

@Injectable()
export class UploadService {
  private useCloudinary = false;

  constructor(private config: ConfigService) {
    const cloudName = this.config.get<string>('CLOUDINARY_CLOUD_NAME');
    const apiKey = this.config.get<string>('CLOUDINARY_API_KEY');
    const apiSecret = this.config.get<string>('CLOUDINARY_API_SECRET');

    if (cloudName && apiKey && apiSecret) {
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
      });
      this.useCloudinary = true;
    }
    console.log('--- CLOUDINARY INITIALIZATION STATUS ---', {
      useCloudinary: this.useCloudinary,
      cloudName,
      hasApiKey: !!apiKey,
      hasApiSecret: !!apiSecret,
    });
  }

  async handleUpload(file: Express.Multer.File) {
    if (this.useCloudinary) {
      try {
        const uploadResult = await new Promise<any>((resolve, reject) => {
          cloudinary.uploader.upload(
            file.path,
            { folder: 'e-learning' },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            },
          );
        });

        // Delete local temp file after success
        try {
          fs.unlinkSync(file.path);
        } catch (err) {
          console.error('Failed to delete local temp file', err);
        }

        return {
          url: uploadResult.secure_url,
          originalName: file.originalname,
          filename: file.filename,
        };
      } catch (error) {
        console.error('Cloudinary upload failed, falling back to local storage', error);
      }
    }

    // Local storage fallback
    const port = this.config.get('PORT') || 3001;
    const host = this.config.get('API_URL') || `http://localhost:${port}`;
    return {
      url: `${host}/upload/file/${file.filename}`,
      originalName: file.originalname,
      filename: file.filename,
    };
  }
}

