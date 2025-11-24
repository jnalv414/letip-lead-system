import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class EnrichBusinessDto {
  @ApiProperty({
    description: 'ID of the business to enrich',
    example: 1,
    minimum: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  businessId: number;
}