import { ApiProperty } from '@nestjs/swagger';

/**
 * Single data point in timeline series.
 */
export class TimelineDataPointDto {
  @ApiProperty({
    description: 'Date string (YYYY-MM-DD)',
    example: '2025-01-15',
  })
  date: string;

  @ApiProperty({
    description: 'Number of scraping jobs on this date',
    example: 12,
  })
  searches: number;

  @ApiProperty({
    description: 'Number of businesses found on this date',
    example: 87,
  })
  businessesFound: number;

  @ApiProperty({
    description: 'Number of businesses enriched on this date',
    example: 45,
  })
  enriched: number;

  @ApiProperty({
    description: 'Total cost incurred on this date (USD)',
    example: 5.23,
  })
  cost: number;
}

/**
 * Time series metrics for dashboard charts.
 *
 * Provides daily aggregations of:
 * - Searches (scraping jobs initiated)
 * - Businesses Found (leads discovered)
 * - Enriched (leads enriched successfully)
 * - Cost (total API costs: Apify + Hunter + Abstract)
 *
 * Used for AreaChart visualization showing trends over time.
 */
export class TimelineDto {
  @ApiProperty({
    description: 'Array of daily metrics ordered by date ascending',
    type: [TimelineDataPointDto],
  })
  data: TimelineDataPointDto[];

  @ApiProperty({
    description: 'Date range applied to timeline',
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
