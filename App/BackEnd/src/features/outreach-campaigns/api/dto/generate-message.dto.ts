import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsBoolean, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class GenerateMessageDto {
  @ApiProperty({
    description: 'Business ID for which to generate the outreach message',
    example: 1,
    type: Number,
  })
  @IsInt()
  @Type(() => Number)
  businessId: number;

  @ApiProperty({
    description: 'Force regeneration of message even if one exists',
    example: false,
    required: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  regenerate?: boolean = false;
}
