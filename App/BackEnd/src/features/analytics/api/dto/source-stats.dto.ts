import { ApiProperty } from '@nestjs/swagger';

/**
 * Single source item in the source statistics response.
 */
export class SourceItemDto {
  @ApiProperty({
    description: 'Lead source name',
    example: 'google_maps',
  })
  source: string;

  @ApiProperty({
    description: 'Number of businesses from this source',
    example: 156,
  })
  count: number;

  @ApiProperty({
    description: 'Percentage of total businesses',
    example: 57.6,
  })
  percentage: number;
}

/**
 * Response DTO for source statistics endpoint.
 *
 * Returns businesses grouped by source with counts and percentages.
 */
export class SourceStatsDto {
  @ApiProperty({
    description: 'Array of sources with business counts',
    type: [SourceItemDto],
  })
  sources: SourceItemDto[];

  @ApiProperty({
    description: 'Total number of businesses',
    example: 271,
  })
  total: number;
}
