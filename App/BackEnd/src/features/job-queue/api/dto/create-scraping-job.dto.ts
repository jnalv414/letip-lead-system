import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  Min,
  Max,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { JobPriority } from '../../config/queue.config';

/**
 * DTO for creating a Google Maps scraping job.
 *
 * Validates scraping parameters and enqueues job to scraping queue.
 */
export class CreateScrapingJobDto {
  @ApiProperty({
    description:
      'Search query for businesses (e.g., "plumbers", "restaurants")',
    example: 'plumbers',
    required: true,
  })
  @IsString()
  searchQuery: string;

  @ApiProperty({
    description: 'Location to search (city, address, or landmark)',
    example: 'Freehold, NJ',
    required: true,
  })
  @IsString()
  location: string;

  @ApiProperty({
    description: 'Maximum number of businesses to scrape',
    example: 50,
    minimum: 1,
    maximum: 500,
    default: 50,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(500)
  @Type(() => Number)
  maxResults?: number = 50;

  @ApiProperty({
    description: 'Search radius in miles',
    example: 5,
    minimum: 0.5,
    maximum: 50,
    default: 5,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0.5)
  @Max(50)
  @Type(() => Number)
  radius?: number = 5;

  @ApiProperty({
    description: 'Job priority (higher priority jobs execute first)',
    example: 'NORMAL',
    enum: JobPriority,
    default: JobPriority.NORMAL,
    required: false,
  })
  @IsOptional()
  @IsEnum(JobPriority)
  priority?: JobPriority = JobPriority.NORMAL;

  @ApiProperty({
    description: 'User ID initiating the scraping job',
    example: 'user123',
    required: false,
  })
  @IsOptional()
  @IsString()
  userId?: string;
}
