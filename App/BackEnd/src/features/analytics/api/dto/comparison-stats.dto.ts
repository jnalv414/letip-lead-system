import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsIn } from 'class-validator';

/**
 * Query parameters for comparison endpoint.
 */
export class ComparisonQueryDto {
  @ApiProperty({
    description: 'Dimension to compare segments by',
    enum: ['city', 'industry', 'source'],
    default: 'city',
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsIn(['city', 'industry', 'source'])
  dimension?: 'city' | 'industry' | 'source' = 'city';
}

/**
 * Single segment in the comparison.
 */
export class ComparisonSegmentDto {
  @ApiProperty({
    description: 'Name of the segment',
    example: 'Freehold',
  })
  segment: string;

  @ApiProperty({
    description: 'Total number of businesses in segment',
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
    description: 'Total cost for this segment',
    example: 45.5,
  })
  totalCost: number;

  @ApiProperty({
    description: 'Average cost per lead',
    example: 0.3,
  })
  costPerLead: number;
}

/**
 * Response DTO for GET /api/analytics/comparison.
 *
 * Returns segment comparison data for analyzing
 * performance across different dimensions.
 */
export class ComparisonStatsDto {
  @ApiProperty({
    description: 'Dimension being compared',
    example: 'city',
  })
  dimension: string;

  @ApiProperty({
    description: 'Array of segment comparisons',
    type: [ComparisonSegmentDto],
  })
  segments: ComparisonSegmentDto[];

  @ApiProperty({
    description: 'Total segments in comparison',
    example: 10,
  })
  totalSegments: number;
}
