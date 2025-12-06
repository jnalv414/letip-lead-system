import { ApiProperty } from '@nestjs/swagger';

/**
 * Individual metric for dashboard display.
 */
export class MetricDto {
  @ApiProperty({
    description: 'Metric name',
    example: 'Total Searches',
  })
  name: string;

  @ApiProperty({
    description: 'Current metric value',
    example: 847,
  })
  value: number;

  @ApiProperty({
    description: 'Percentage change from previous period',
    example: 12.5,
  })
  change: number;

  @ApiProperty({
    description: 'Sparkline data points for mini chart (last 7 days)',
    example: [120, 135, 142, 128, 156, 147, 152],
    type: [Number],
  })
  sparkline: number[];

  @ApiProperty({
    description: 'Accent color for visual display',
    example: '#9b6dff',
  })
  color: string;
}

/**
 * Dashboard overview response with 6 key metrics.
 *
 * Provides high-level performance metrics for lead generation dashboard:
 * 1. Total Searches (scraping jobs)
 * 2. Businesses Found (total leads discovered)
 * 3. Cost Per Lead (total cost / businesses)
 * 4. Enriched Leads (enrichment completed)
 * 5. Total Cost (Apify + Hunter + Abstract)
 * 6. Enrichment Rate (enriched / total * 100)
 */
export class DashboardOverviewDto {
  @ApiProperty({
    description: 'Array of 6 dashboard metrics with sparklines',
    type: [MetricDto],
  })
  metrics: MetricDto[];

  @ApiProperty({
    description: 'Date range applied to metrics',
    example: {
      start: '2025-01-01T00:00:00.000Z',
      end: '2025-01-31T23:59:59.999Z',
    },
  })
  dateRange: {
    start: string;
    end: string;
  };
}
