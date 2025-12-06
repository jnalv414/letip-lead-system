/**
 * Auth Controller
 *
 * HTTP endpoints for authentication:
 * - POST /api/auth/register - Create new user
 * - POST /api/auth/login - Authenticate user
 * - POST /api/auth/logout - Invalidate session
 * - POST /api/auth/refresh - Get new access token
 * - GET /api/auth/me - Get current user profile
 * - PATCH /api/auth/me - Update profile
 *
 * Refresh token is stored in HTTP-only cookie for security.
 */

import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiCookieAuth } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { AuthService } from '../domain/auth.service';
import { LoginDto, RegisterDto, AuthResponseDto, RefreshResponseDto, MessageResponseDto } from './dto';
import { Public } from '../decorators/public.decorator';
import { CurrentUser } from '../decorators/current-user.decorator';
import type { RequestUser } from '../decorators/current-user.decorator';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { Role } from '@prisma/client';

const REFRESH_TOKEN_COOKIE = 'refreshToken';

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/api/auth',
};

@ApiTags('Authentication')
@Controller('api/auth')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Register new user
   *
   * First user becomes admin automatically.
   * After that, only admins can set roles.
   */
  @Post('register')
  @Public()
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User created successfully', type: AuthResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid input or weak password' })
  @ApiResponse({ status: 409, description: 'Email already registered' })
  async register(
    @Body() dto: RegisterDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDto> {
    // Get creator role if authenticated (for admin registration)
    const creatorRole = (req as any).user?.role;

    const result = await this.authService.register(
      dto,
      creatorRole,
      req.headers['user-agent'],
      req.ip,
    );

    // Set refresh token cookie
    res.cookie(REFRESH_TOKEN_COOKIE, result.refreshToken, cookieOptions);

    return {
      user: result.user,
      accessToken: result.accessToken,
    };
  }

  /**
   * Admin-only registration endpoint
   *
   * Allows admins to create users with specific roles.
   */
  @Post('register/admin')
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: Register a new user with role' })
  @ApiResponse({ status: 201, description: 'User created successfully', type: AuthResponseDto })
  @ApiResponse({ status: 403, description: 'Admin access required' })
  async adminRegister(
    @Body() dto: RegisterDto,
    @CurrentUser() admin: RequestUser,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDto> {
    const result = await this.authService.register(
      dto,
      admin.role,
      req.headers['user-agent'],
      req.ip,
    );

    // Don't set cookie for admin-created users
    return {
      user: result.user,
      accessToken: result.accessToken,
    };
  }

  /**
   * Login with email and password
   */
  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({ status: 200, description: 'Login successful', type: AuthResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDto> {
    const result = await this.authService.login(dto, req.headers['user-agent'], req.ip);

    // Set refresh token cookie
    res.cookie(REFRESH_TOKEN_COOKIE, result.refreshToken, cookieOptions);

    return {
      user: result.user,
      accessToken: result.accessToken,
    };
  }

  /**
   * Logout and invalidate session
   */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout and invalidate session' })
  @ApiResponse({ status: 200, description: 'Logged out successfully', type: MessageResponseDto })
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<MessageResponseDto> {
    const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE];

    if (refreshToken) {
      await this.authService.logout(refreshToken);
    }

    // Clear cookie
    res.clearCookie(REFRESH_TOKEN_COOKIE, { path: '/api/auth' });

    return { message: 'Logged out successfully' };
  }

  /**
   * Logout from all devices
   */
  @Post('logout/all')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout from all devices' })
  @ApiResponse({ status: 200, description: 'Logged out from all devices', type: MessageResponseDto })
  async logoutAll(
    @CurrentUser('id') userId: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<MessageResponseDto> {
    const count = await this.authService.logoutAll(userId);

    // Clear cookie
    res.clearCookie(REFRESH_TOKEN_COOKIE, { path: '/api/auth' });

    return { message: `Logged out from ${count} device(s)` };
  }

  /**
   * Refresh access token using refresh token cookie
   */
  @Post('refresh')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Token refreshed', type: RefreshResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<RefreshResponseDto> {
    const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE];

    if (!refreshToken) {
      throw new Error('Refresh token not found');
    }

    const result = await this.authService.refresh(
      refreshToken,
      req.headers['user-agent'],
      req.ip,
    );

    // Set new refresh token cookie
    res.cookie(REFRESH_TOKEN_COOKIE, result.refreshToken, cookieOptions);

    return { accessToken: result.accessToken };
  }

  /**
   * Get current user profile
   */
  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'User profile' })
  async getProfile(@CurrentUser('id') userId: string) {
    return this.authService.getProfile(userId);
  }

  /**
   * Update current user profile
   */
  @Patch('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated' })
  async updateProfile(
    @CurrentUser('id') userId: string,
    @Body() data: { name?: string; email?: string },
  ) {
    return this.authService.updateProfile(userId, data);
  }
}
