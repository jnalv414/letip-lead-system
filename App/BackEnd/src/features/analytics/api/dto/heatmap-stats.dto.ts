import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsIn } from 'class-validator';

/**
 * Query parameters for heatmap endpoint.
 */
export class HeatmapQueryDto {
  @ApiProperty({
    description: 'Type of activity to show in heatmap',
    enum: ['scraping_jobs', 'enrichments', 'business_created'],
    default: 'business_created',
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsIn(['scraping_jobs', 'enrichments', 'business_created'])
  activityType?: 'scraping_jobs' | 'enrichments' | 'business_created' =
    'business_created';
}

/**
 * Single data point in the activity heatmap.
 */
export class HeatmapDataPointDto {
  @ApiProperty({
    description: 'Day of week (0 = Sunday, 6 = Saturday)',
    example: 1,
    minimum: 0,
    maximum: 6,
  })
  dayOfWeek: number;

  @ApiProperty({
    description: 'Hour of day (0-23)',
    example: 14,
    minimum: 0,
    maximum: 23,
  })
  hour: number;

  @ApiProperty({
    description: 'Number of activities at this time slot',
    example: 42,
  })
  count: number;

  @ApiProperty({
    description: 'Normalized intensity (0-1) for visualization',
    example: 0.85,
    minimum: 0,
    maximum: 1,
  })
  intensity: number;
}

/**
 * Response DTO for GET /api/analytics/heatmap.
 *
 * Returns activity heatmap data for visualizing
 * when business activities occur during the week.
 */
export class HeatmapStatsDto {
  @ApiProperty({
    description: 'Array of heatmap data points',
    type: [HeatmapDataPointDto],
  })
  data: HeatmapDataPointDto[];

  @ApiProperty({
    description: 'Maximum value in the dataset (for scaling)',
    example: 125,
  })
  maxValue: number;

  @ApiProperty({
    description: 'Type of activity displayed',
    example: 'business_created',
  })
  activityType: string;
}
