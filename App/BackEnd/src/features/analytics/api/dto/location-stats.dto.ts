import { ApiProperty } from '@nestjs/swagger';

/**
 * Single location item in the location statistics response.
 */
export class LocationItemDto {
  @ApiProperty({
    description: 'City name',
    example: 'Freehold',
  })
  city: string;

  @ApiProperty({
    description: 'Number of businesses in this city',
    example: 42,
  })
  count: number;

  @ApiProperty({
    description: 'Percentage of total businesses',
    example: 15.5,
  })
  percentage: number;
}

/**
 * Response DTO for location statistics endpoint.
 *
 * Returns businesses grouped by city with counts and percentages.
 */
export class LocationStatsDto {
  @ApiProperty({
    description: 'Array of locations with business counts',
    type: [LocationItemDto],
  })
  locations: LocationItemDto[];

  @ApiProperty({
    description: 'Total number of businesses with city data',
    example: 271,
  })
  total: number;
}
