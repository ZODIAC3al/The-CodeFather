import { IsString, IsNumber, IsOptional, IsArray, Min, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCourseDto {
  @ApiProperty({ example: 'Introduction to Next.js' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'Learn Next.js from scratch, including App Router, SSR, and ISR.' })
  @IsString()
  description: string;

  @ApiProperty({ example: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3' })
  @IsOptional()
  @IsString()
  thumbnail?: string;

  @ApiProperty({ example: 49.99 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ example: 29.99, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discountPrice?: number;

  @ApiProperty({ example: 'cuid-category-id-123' })
  @IsString()
  categoryId: string;

  @ApiProperty({ example: ['NextJS', 'WebDev'], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  @IsBoolean()
  published?: boolean;
}
