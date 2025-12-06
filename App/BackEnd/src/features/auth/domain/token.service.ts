/**
 * Token Service
 *
 * Handles JWT token generation, validation, and extraction.
 * Manages both access tokens (short-lived) and refresh tokens (long-lived).
 */

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '../../../config/config.service';
import { Role } from '@prisma/client';
import { randomBytes } from 'crypto';

export interface JwtPayload {
  sub: string; // User ID
  email: string;
  role: Role;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class TokenService {
  private readonly accessTokenExpiry = '15m';
  private readonly refreshTokenExpiry = '7d';
  private readonly jwtSecret: string;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    // Use environment variable or fallback to a secure default for development
    this.jwtSecret =
      this.configService.get('JWT_SECRET') || 'letip-lead-system-jwt-secret-change-in-production';
  }

  /**
   * Generate an access token for a user
   *
   * @param userId - User's UUID
   * @param email - User's email
   * @param role - User's role
   * @returns JWT access token string
   */
  generateAccessToken(userId: string, email: string, role: Role): string {
    const payload: JwtPayload = {
      sub: userId,
      email,
      role,
    };

    return this.jwtService.sign(payload, {
      secret: this.jwtSecret,
      expiresIn: this.accessTokenExpiry,
    });
  }

  /**
   * Generate a cryptographically secure refresh token
   *
   * @returns Random 64-character hex string
   */
  generateRefreshToken(): string {
    return randomBytes(32).toString('hex');
  }

  /**
   * Generate both access and refresh tokens
   *
   * @param userId - User's UUID
   * @param email - User's email
   * @param role - User's role
   * @returns Token pair with access and refresh tokens
   */
  generateTokenPair(userId: string, email: string, role: Role): TokenPair {
    return {
      accessToken: this.generateAccessToken(userId, email, role),
      refreshToken: this.generateRefreshToken(),
    };
  }

  /**
   * Verify and decode an access token
   *
   * @param token - JWT access token
   * @returns Decoded payload
   * @throws UnauthorizedException if token is invalid or expired
   */
  verifyAccessToken(token: string): JwtPayload {
    try {
      return this.jwtService.verify<JwtPayload>(token, {
        secret: this.jwtSecret,
      });
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired access token');
    }
  }

  /**
   * Decode a token without verifying (for extracting payload from expired tokens)
   *
   * @param token - JWT token
   * @returns Decoded payload or null if invalid
   */
  decodeToken(token: string): JwtPayload | null {
    try {
      return this.jwtService.decode(token) as JwtPayload;
    } catch {
      return null;
    }
  }

  /**
   * Extract token from Authorization header
   *
   * @param authHeader - Authorization header value
   * @returns Token string or null if not found
   */
  extractTokenFromHeader(authHeader: string | undefined): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.slice(7);
  }

  /**
   * Calculate refresh token expiration date
   *
   * @returns Date 7 days from now
   */
  getRefreshTokenExpiry(): Date {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 7);
    return expiryDate;
  }
}
