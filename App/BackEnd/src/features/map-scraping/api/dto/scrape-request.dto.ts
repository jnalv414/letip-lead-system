import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class ScrapeRequestDto {
  @ApiProperty({
    description: 'Location to scrape (e.g., "Route 9, Freehold, NJ")',
    example: 'Route 9, Freehold, NJ'
  })
  @IsString()
  location: string;

  @ApiPropertyOptional({
    description: 'Search radius in miles',
    default: 10,
    minimum: 1,
    maximum: 50
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(50)
  @Type(() => Number)
  radius?: number = 10;

  @ApiPropertyOptional({
    description: 'Business type/category to filter',
    example: 'restaurant',
    examples: ['restaurant', 'plumber', 'dentist', 'lawyer']
  })
  @IsOptional()
  @IsString()
  business_type?: string;

  @ApiPropertyOptional({
    description: 'Maximum number of results to scrape',
    default: 50,
    minimum: 1,
    maximum: 500
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(500)
  @Type(() => Number)
  max_results?: number = 50;
}