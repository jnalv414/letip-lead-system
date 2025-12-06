import { ApiProperty } from '@nestjs/swagger';

/**
 * Statistics for a single data source/platform.
 */
export class SourceStatsDto {
  @ApiProperty({
    description: 'Source/platform name',
    example: 'Google Maps',
    enum: ['Google Maps', 'Hunter.io', 'AbstractAPI', 'Manual'],
  })
  source: string;

  @ApiProperty({
    description: 'Number of searches/API calls made',
    example: 127,
    required: false,
  })
  searches?: number;

  @ApiProperty({
    description: 'Number of businesses/results found',
    example: 847,
    required: false,
  })
  businesses?: number;

  @ApiProperty({
    description: 'Number of contacts found (email enrichment)',
    example: 234,
    required: false,
  })
  contactsFound?: number;

  @ApiProperty({
    description: 'Total cost for this source (USD)',
    example: 8.47,
  })
  cost: number;

  @ApiProperty({
    description: 'Success rate percentage',
    example: 87.5,
    required: false,
  })
  successRate?: number;
}

/**
 * Breakdown of performance metrics by data source.
 *
 * Provides per-source statistics for:
 * - Google Maps: Scraping jobs, businesses found, Apify cost
 * - Hunter.io: Email searches, contacts discovered, API cost
 * - AbstractAPI: Company lookups, enriched records, API cost
 * - Manual: Manually entered businesses, $0 cost
 */
export class SourceBreakdownDto {
  @ApiProperty({
    description: 'Array of source statistics (4 sources)',
    type: [SourceStatsDto],
  })
  sources: SourceStatsDto[];

  @ApiProperty({
    description: 'Total cost across all sources',
    example: 47.23,
  })
  total: number;
}
