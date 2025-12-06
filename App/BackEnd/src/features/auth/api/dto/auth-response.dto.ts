/**
 * Auth Response DTOs
 *
 * Response shapes for authentication endpoints.
 */

import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class UserResponseDto {
  @ApiProperty({ description: 'User UUID' })
  id: string;

  @ApiProperty({ description: 'User email' })
  email: string;

  @ApiProperty({ description: 'User display name' })
  name: string;

  @ApiProperty({ description: 'User role', enum: Role })
  role: Role;

  @ApiProperty({ description: 'Account creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Last login date', nullable: true })
  lastLogin: Date | null;
}

export class AuthResponseDto {
  @ApiProperty({ description: 'User information' })
  user: UserResponseDto;

  @ApiProperty({ description: 'JWT access token (15 min expiry)' })
  accessToken: string;
}

export class RefreshResponseDto {
  @ApiProperty({ description: 'New JWT access token' })
  accessToken: string;
}

export class MessageResponseDto {
  @ApiProperty({ description: 'Response message' })
  message: string;
}
