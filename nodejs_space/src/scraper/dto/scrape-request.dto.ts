
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, Min, Max } from 'class-validator';

export class ScrapeRequestDto {
  @ApiProperty({ 
    description: 'Location to scrape (e.g., "Route 9, Freehold, NJ")',
    example: 'Route 9, Freehold, NJ'
  })
  @IsString()
  location: string;

  @ApiPropertyOptional({ 
    description: 'Search radius in miles',
    default: 1,
    minimum: 0.5,
    maximum: 5
  })
  @IsOptional()
  @IsNumber()
  @Min(0.5)
  @Max(5)
  radius?: number;

  @ApiPropertyOptional({ 
    description: 'Business type filter',
    example: 'restaurant'
  })
  @IsOptional()
  @IsString()
  business_type?: string;

  @ApiPropertyOptional({ 
    description: 'Maximum number of results',
    default: 50,
    minimum: 1,
    maximum: 500
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(500)
  max_results?: number;
}
