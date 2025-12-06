import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsArray, IsString, IsIn } from 'class-validator';
import { Transform } from 'class-transformer';
import { DateRangeDto } from './date-range.dto';

/**
 * Multi-select filter parameters for analytics endpoints.
 *
 * Extends DateRangeDto to include city, industry, enrichment status,
 * and source filtering. All filters support multi-select via arrays.
 *
 * Query format: ?cities[]=Freehold&cities[]=Manalapan&industries[]=plumbing
 */
export class AnalyticsFilterDto extends DateRangeDto {
  @ApiProperty({
    description: 'Filter by cities (multi-select)',
    type: [String],
    required: false,
    example: ['Freehold', 'Manalapan'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) =>
    Array.isArray(value) ? value : [value].filter(Boolean),
  )
  cities?: string[];

  @ApiProperty({
    description: 'Filter by industries (multi-select)',
    type: [String],
    required: false,
    example: ['plumbing', 'hvac', 'electrical'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) =>
    Array.isArray(value) ? value : [value].filter(Boolean),
  )
  industries?: string[];

  @ApiProperty({
    description: 'Filter by enrichment status (multi-select)',
    type: [String],
    required: false,
    enum: ['pending', 'enriched', 'failed'],
    example: ['pending', 'enriched'],
  })
  @IsOptional()
  @IsArray()
  @IsIn(['pending', 'enriched', 'failed'], { each: true })
  @Transform(({ value }) =>
    Array.isArray(value) ? value : [value].filter(Boolean),
  )
  enrichmentStatus?: ('pending' | 'enriched' | 'failed')[];

  @ApiProperty({
    description: 'Filter by lead sources (multi-select)',
    type: [String],
    required: false,
    example: ['google_maps', 'manual', 'csv_import'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) =>
    Array.isArray(value) ? value : [value].filter(Boolean),
  )
  sources?: string[];
}
