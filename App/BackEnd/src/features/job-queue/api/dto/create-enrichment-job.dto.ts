import { ApiProperty } from '@nestjs/swagger';
import {
  IsNumber,
  IsArray,
  IsOptional,
  IsEnum,
  IsString,
  ArrayMinSize,
  ArrayMaxSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { JobPriority } from '../../config/queue.config';

/**
 * DTO for creating a business enrichment job.
 *
 * Supports single or batch enrichment with external APIs (Hunter.io, AbstractAPI).
 */
export class CreateEnrichmentJobDto {
  @ApiProperty({
    description:
      'Business ID(s) to enrich. Single ID or array for batch processing.',
    example: [123, 456, 789],
    required: true,
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100) // Limit batch size
  @IsNumber({}, { each: true })
  @Type(() => Number)
  businessIds: number[];

  @ApiProperty({
    description: 'Enrichment services to use',
    example: ['hunter', 'abstract'],
    enum: ['hunter', 'abstract', 'all'],
    isArray: true,
    default: ['all'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  services?: string[] = ['all'];

  @ApiProperty({
    description: 'Job priority',
    example: 'NORMAL',
    enum: JobPriority,
    default: JobPriority.NORMAL,
    required: false,
  })
  @IsOptional()
  @IsEnum(JobPriority)
  priority?: JobPriority = JobPriority.NORMAL;

  @ApiProperty({
    description: 'User ID initiating the enrichment job',
    example: 'user123',
    required: false,
  })
  @IsOptional()
  @IsString()
  userId?: string;
}
