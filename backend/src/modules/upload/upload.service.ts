import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';

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
        // Upload from memory buffer using upload_stream
        const uploadResult = await new Promise<any>((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            { folder: 'e-learning' },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            },
          );
          uploadStream.end(file.buffer);
        });

        return {
          url: uploadResult.secure_url,
          originalName: file.originalname,
          filename: uploadResult.public_id,
        };
      } catch (error) {
        console.error('Cloudinary upload failed', error);
        throw error;
      }
    }

    // Fallback: return a data URI for development without Cloudinary
    const base64 = file.buffer.toString('base64');
    const dataUri = `data:${file.mimetype};base64,${base64}`;
    return {
      url: dataUri,
      originalName: file.originalname,
      filename: `upload-${Date.now()}`,
    };
  }
}
