import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsIn, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Query parameters for top-performers endpoint.
 */
export class TopPerformersQueryDto {
  @ApiProperty({
    description: 'Metric to rank by',
    enum: ['businesses', 'enriched', 'cost_efficiency'],
    default: 'businesses',
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsIn(['businesses', 'enriched', 'cost_efficiency'])
  metric?: 'businesses' | 'enriched' | 'cost_efficiency' = 'businesses';

  @ApiProperty({
    description: 'Dimension to rank (city, industry, source)',
    enum: ['city', 'industry', 'source'],
    default: 'city',
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsIn(['city', 'industry', 'source'])
  dimension?: 'city' | 'industry' | 'source' = 'city';

  @ApiProperty({
    description: 'Number of top performers to return',
    default: 5,
    minimum: 1,
    maximum: 20,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(20)
  @Type(() => Number)
  limit?: number = 5;
}

/**
 * Single top performer entry.
 */
export class TopPerformerDto {
  @ApiProperty({
    description: 'Rank position (1 = top)',
    example: 1,
  })
  rank: number;

  @ApiProperty({
    description: 'Name of the entity (city, industry, or source)',
    example: 'Freehold',
  })
  name: string;

  @ApiProperty({
    description: 'Total number of businesses',
    example: 150,
  })
  totalBusinesses: number;

  @ApiProperty({
    description: 'Number of enriched businesses',
    example: 120,
  })
  enrichedCount: number;

  @ApiProperty({
    description: 'Enrichment rate percentage',
    example: 80.0,
  })
  enrichmentRate: number;

  @ApiProperty({
    description: 'Change from previous period (percentage)',
    example: 12.5,
  })
  change: number;

  @ApiProperty({
    description: 'Trend direction',
    enum: ['up', 'down', 'stable'],
    example: 'up',
  })
  trend: 'up' | 'down' | 'stable';
}

/**
 * Response DTO for GET /api/analytics/top-performers.
 *
 * Returns ranked list of top performing segments.
 */
export class TopPerformersDto {
  @ApiProperty({
    description: 'Metric used for ranking',
    example: 'businesses',
  })
  metric: string;

  @ApiProperty({
    description: 'Dimension being ranked',
    example: 'city',
  })
  dimension: string;

  @ApiProperty({
    description: 'Array of top performers',
    type: [TopPerformerDto],
  })
  performers: TopPerformerDto[];

  @ApiProperty({
    description: 'Total unique segments in dimension',
    example: 25,
  })
  totalSegments: number;
}
