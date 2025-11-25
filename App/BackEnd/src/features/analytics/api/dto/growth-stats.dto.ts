import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsIn } from 'class-validator';

/**
 * Query parameters for growth statistics endpoint.
 */
export class GrowthQueryDto {
  @ApiPropertyOptional({
    description: 'Time period for growth data',
    enum: ['week', 'month', 'quarter'],
    default: 'month',
    example: 'month',
  })
  @IsOptional()
  @IsIn(['week', 'month', 'quarter'])
  period?: 'week' | 'month' | 'quarter' = 'month';
}

/**
 * Single data point in the growth time series.
 */
export class GrowthDataPointDto {
  @ApiProperty({
    description: 'Period label (date range or period name)',
    example: '2024-01-15',
  })
  period: string;

  @ApiProperty({
    description: 'Number of businesses created in this period',
    example: 23,
  })
  businesses: number;

  @ApiProperty({
    description: 'Number of enriched businesses in this period',
    example: 18,
  })
  enriched: number;
}

/**
 * Response DTO for growth statistics endpoint.
 *
 * Returns time series data showing business acquisition and enrichment over time.
 */
export class GrowthStatsDto {
  @ApiProperty({
    description: 'Array of time series data points',
    type: [GrowthDataPointDto],
  })
  data: GrowthDataPointDto[];

  @ApiProperty({
    description: 'Total number of businesses in the period',
    example: 271,
  })
  total: number;

  @ApiProperty({
    description: 'Overall enrichment rate as percentage',
    example: 78.2,
  })
  enrichmentRate: number;
}
