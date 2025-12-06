import { ApiProperty } from '@nestjs/swagger';

/**
 * Date range boundaries for filter options.
 */
export class DateRangeBoundsDto {
  @ApiProperty({
    description: 'Earliest date in dataset',
    example: '2024-01-01',
  })
  earliest: string;

  @ApiProperty({
    description: 'Latest date in dataset',
    example: '2025-01-21',
  })
  latest: string;
}

/**
 * Response DTO for GET /api/analytics/filter-options.
 *
 * Returns all available filter values for frontend dropdowns,
 * enabling dynamic multi-select filter population.
 */
export class FilterOptionsDto {
  @ApiProperty({
    description: 'Available cities',
    type: [String],
    example: ['Freehold', 'Manalapan', 'Marlboro', 'Howell'],
  })
  cities: string[];

  @ApiProperty({
    description: 'Available industries',
    type: [String],
    example: ['plumbing', 'hvac', 'electrical', 'landscaping'],
  })
  industries: string[];

  @ApiProperty({
    description: 'Available enrichment statuses',
    type: [String],
    example: ['pending', 'enriched', 'failed'],
  })
  enrichmentStatuses: string[];

  @ApiProperty({
    description: 'Available lead sources',
    type: [String],
    example: ['google_maps', 'manual', 'csv_import'],
  })
  sources: string[];

  @ApiProperty({
    description: 'Date range boundaries of available data',
    type: DateRangeBoundsDto,
  })
  dateRange: DateRangeBoundsDto;

  @ApiProperty({
    description: 'Total number of business records',
    example: 1500,
  })
  totalRecords: number;
}
