import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsDateString } from 'class-validator';

/**
 * Query parameters for date range filtering.
 *
 * Used across all dashboard analytics endpoints to filter data by time period.
 * If not provided, defaults to last 30 days.
 */
export class DateRangeDto {
  @ApiProperty({
    description:
      'Start date for filtering (ISO 8601 format). Defaults to 30 days ago.',
    example: '2025-01-01T00:00:00.000Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({
    description: 'End date for filtering (ISO 8601 format). Defaults to now.',
    example: '2025-01-31T23:59:59.999Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
