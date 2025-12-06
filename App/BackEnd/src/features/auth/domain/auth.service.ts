/**
 * Auth Service
 *
 * Core authentication logic including registration, login, logout,
 * token refresh, and user profile management.
 *
 * @side-effects
 * - Creates/updates user records
 * - Creates/manages sessions
 * - Updates last_login timestamp
 */

import {
  Injectable,
  Logger,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { PasswordService } from './password.service';
import { TokenService } from './token.service';
import { SessionService } from './session.service';
import { RegisterDto, LoginDto, AuthResponseDto, UserResponseDto } from '../api/dto';
import { Role } from '@prisma/client';

export interface AuthResult {
  user: UserResponseDto;
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordService: PasswordService,
    private readonly tokenService: TokenService,
    private readonly sessionService: SessionService,
  ) {}

  /**
   * Register a new user
   *
   * First user automatically becomes ADMIN.
   * After that, only ADMINs can create new users (or set role).
   *
   * @param dto - Registration data
   * @param creatorRole - Role of the user creating this account (null for first user)
   * @returns Auth result with user, tokens
   */
  async register(
    dto: RegisterDto,
    creatorRole?: Role,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<AuthResult> {
    // Check if email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // Validate password strength
    const passwordValidation = this.passwordService.validateStrength(dto.password);
    if (!passwordValidation.isValid) {
      throw new BadRequestException(passwordValidation.errors.join(', '));
    }

    // Determine if this is the first user (auto-admin)
    const userCount = await this.prisma.user.count();
    const isFirstUser = userCount === 0;

    // Determine role
    let role: Role = Role.MEMBER;
    if (isFirstUser) {
      role = Role.ADMIN; // First user is always admin
    } else if (dto.role && creatorRole === Role.ADMIN) {
      role = dto.role; // Admin can set any role
    } else if (dto.role && creatorRole !== Role.ADMIN) {
      throw new ForbiddenException('Only admins can assign roles');
    }

    // Hash password
    const passwordHash = await this.passwordService.hash(dto.password);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        password_hash: passwordHash,
        name: dto.name,
        role,
        last_login: new Date(),
      },
    });

    this.logger.log(`User registered: ${user.email} (${user.role})`);

    // Generate tokens
    const accessToken = this.tokenService.generateAccessToken(user.id, user.email, user.role);
    const refreshToken = await this.sessionService.createSession({
      userId: user.id,
      userAgent,
      ipAddress,
    });

    return {
      user: this.mapUserToResponse(user),
      accessToken,
      refreshToken,
    };
  }

  /**
   * Authenticate user with email and password
   *
   * @param dto - Login credentials
   * @returns Auth result with user, tokens
   * @throws UnauthorizedException if credentials invalid
   */
  async login(dto: LoginDto, userAgent?: string, ipAddress?: string): Promise<AuthResult> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.is_active) {
      throw new UnauthorizedException('Account is disabled');
    }

    const isPasswordValid = await this.passwordService.compare(dto.password, user.password_hash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { last_login: new Date() },
    });

    this.logger.log(`User logged in: ${user.email}`);

    // Generate tokens
    const accessToken = this.tokenService.generateAccessToken(user.id, user.email, user.role);
    const refreshToken = await this.sessionService.createSession({
      userId: user.id,
      userAgent,
      ipAddress,
    });

    return {
      user: this.mapUserToResponse(user),
      accessToken,
      refreshToken,
    };
  }

  /**
   * Refresh access token using refresh token
   *
   * Rotates refresh token (one-time use)
   *
   * @param refreshToken - Current refresh token
   * @returns New access and refresh tokens
   */
  async refresh(
    refreshToken: string,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const session = await this.sessionService.findByRefreshToken(refreshToken);

    if (!session) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (session.expires_at < new Date()) {
      await this.sessionService.revokeSession(session.id);
      throw new UnauthorizedException('Refresh token expired');
    }

    if (!session.user.is_active) {
      throw new UnauthorizedException('Account is disabled');
    }

    // Generate new tokens
    const newAccessToken = this.tokenService.generateAccessToken(
      session.user.id,
      session.user.email,
      session.user.role,
    );

    const newRefreshToken = await this.sessionService.rotateRefreshToken(
      refreshToken,
      userAgent,
      ipAddress,
    );

    if (!newRefreshToken) {
      throw new UnauthorizedException('Failed to rotate refresh token');
    }

    this.logger.log(`Token refreshed for user: ${session.user.email}`);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  /**
   * Logout user by revoking their session
   *
   * @param refreshToken - Refresh token to revoke
   */
  async logout(refreshToken: string): Promise<void> {
    const session = await this.sessionService.findByRefreshToken(refreshToken);

    if (session) {
      await this.sessionService.revokeSession(session.id);
      this.logger.log(`User logged out: ${session.user.email}`);
    }
  }

  /**
   * Logout from all devices by revoking all sessions
   *
   * @param userId - User to logout
   * @returns Number of sessions revoked
   */
  async logoutAll(userId: string): Promise<number> {
    const count = await this.sessionService.revokeAllUserSessions(userId);
    this.logger.log(`User logged out from all devices: ${userId}`);
    return count;
  }

  /**
   * Get user profile by ID
   *
   * @param userId - User UUID
   * @returns User response DTO
   */
  async getProfile(userId: string): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return this.mapUserToResponse(user);
  }

  /**
   * Update user profile
   *
   * @param userId - User UUID
   * @param data - Fields to update
   * @returns Updated user
   */
  async updateProfile(
    userId: string,
    data: { name?: string; email?: string },
  ): Promise<UserResponseDto> {
    // Check for email conflict if updating email
    if (data.email) {
      const existing = await this.prisma.user.findUnique({
        where: { email: data.email.toLowerCase() },
      });

      if (existing && existing.id !== userId) {
        throw new ConflictException('Email already in use');
      }
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.email && { email: data.email.toLowerCase() }),
      },
    });

    this.logger.log(`Profile updated for user: ${user.email}`);
    return this.mapUserToResponse(user);
  }

  /**
   * Validate user exists and is active (for JWT strategy)
   *
   * @param userId - User UUID
   * @returns User or null
   */
  async validateUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        is_active: true,
      },
    });

    if (!user || !user.is_active) {
      return null;
    }

    return user;
  }

  /**
   * Map Prisma user to response DTO
   */
  private mapUserToResponse(user: any): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.created_at,
      lastLogin: user.last_login,
    };
  }
}
