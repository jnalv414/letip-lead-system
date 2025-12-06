import { ApiProperty } from '@nestjs/swagger';

/**
 * Single stage in the conversion funnel.
 */
export class FunnelStageDto {
  @ApiProperty({
    description: 'Name of the funnel stage',
    example: 'Scraped',
  })
  stage: string;

  @ApiProperty({
    description: 'Number of businesses at this stage',
    example: 1000,
  })
  count: number;

  @ApiProperty({
    description: 'Conversion rate from first stage (percentage)',
    example: 85.5,
  })
  conversionRate: number;

  @ApiProperty({
    description: 'Number of businesses that dropped off at this stage',
    example: 150,
  })
  dropOff: number;
}

/**
 * Response DTO for GET /api/analytics/funnel.
 *
 * Returns conversion funnel data showing how businesses
 * progress through the lead lifecycle stages.
 */
export class FunnelStatsDto {
  @ApiProperty({
    description: 'Array of funnel stages with conversion metrics',
    type: [FunnelStageDto],
  })
  stages: FunnelStageDto[];

  @ApiProperty({
    description: 'Overall conversion rate from first to last stage (percentage)',
    example: 40.0,
  })
  overallConversion: number;

  @ApiProperty({
    description: 'Total businesses at the top of funnel',
    example: 1000,
  })
  totalAtTop: number;
}
