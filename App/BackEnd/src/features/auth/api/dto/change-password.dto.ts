import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({ description: 'Current password', example: 'OldPass123' })
  @IsString()
  @MinLength(1)
  oldPassword: string;

  @ApiProperty({ description: 'New password (min 8 chars, 1 uppercase, 1 lowercase, 1 number)', example: 'NewPass123' })
  @IsString()
  @MinLength(8)
  newPassword: string;
}
