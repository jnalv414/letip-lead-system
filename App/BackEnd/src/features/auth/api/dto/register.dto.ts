/**
 * Register DTO
 *
 * Validates user registration request body.
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, IsOptional, IsEnum } from 'class-validator';
import { Role } from '@prisma/client';

export class RegisterDto {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @ApiProperty({
    description: 'User password (min 8 chars, must include uppercase, lowercase, number)',
    example: 'Password123',
    minLength: 8,
  })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  password: string;

  @ApiProperty({
    description: 'User display name',
    example: 'John Doe',
  })
  @IsString()
  @MinLength(2, { message: 'Name must be at least 2 characters' })
  name: string;

  @ApiPropertyOptional({
    description: 'User role (admin only can set this)',
    enum: Role,
    default: Role.MEMBER,
  })
  @IsOptional()
  @IsEnum(Role, { message: 'Invalid role' })
  role?: Role;
}
