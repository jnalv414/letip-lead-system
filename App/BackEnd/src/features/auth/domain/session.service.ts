/**
 * Session Service
 *
 * Manages user sessions and refresh tokens.
 * Handles token rotation, revocation, and cleanup.
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { TokenService } from './token.service';

export interface CreateSessionData {
  userId: string;
  userAgent?: string;
  ipAddress?: string;
}

export interface SessionInfo {
  id: string;
  userId: string;
  userAgent: string | null;
  ipAddress: string | null;
  createdAt: Date;
  expiresAt: Date;
}

@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tokenService: TokenService,
  ) {}

  /**
   * Create a new session for a user
   *
   * @param data - Session creation data
   * @returns Refresh token for the new session
   */
  async createSession(data: CreateSessionData): Promise<string> {
    const refreshToken = this.tokenService.generateRefreshToken();
    const expiresAt = this.tokenService.getRefreshTokenExpiry();

    await this.prisma.session.create({
      data: {
        user_id: data.userId,
        refresh_token: refreshToken,
        user_agent: data.userAgent || null,
        ip_address: data.ipAddress || null,
        expires_at: expiresAt,
      },
    });

    this.logger.log(`Session created for user ${data.userId}`);
    return refreshToken;
  }

  /**
   * Find a session by refresh token
   *
   * @param refreshToken - The refresh token to look up
   * @returns Session with user data or null
   */
  async findByRefreshToken(refreshToken: string) {
    return this.prisma.session.findUnique({
      where: { refresh_token: refreshToken },
      include: { user: true },
    });
  }

  /**
   * Rotate a refresh token (one-time use pattern)
   *
   * Creates a new refresh token and invalidates the old one.
   * This prevents token reuse attacks.
   *
   * @param oldRefreshToken - The current refresh token
   * @param userAgent - Optional user agent for the new session
   * @param ipAddress - Optional IP address for the new session
   * @returns New refresh token or null if old token not found
   */
  async rotateRefreshToken(
    oldRefreshToken: string,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<string | null> {
    const session = await this.findByRefreshToken(oldRefreshToken);

    if (!session) {
      this.logger.warn('Refresh token rotation failed: token not found');
      return null;
    }

    // Check if session is expired
    if (session.expires_at < new Date()) {
      await this.revokeSession(session.id);
      this.logger.warn('Refresh token rotation failed: session expired');
      return null;
    }

    // Generate new refresh token
    const newRefreshToken = this.tokenService.generateRefreshToken();
    const newExpiresAt = this.tokenService.getRefreshTokenExpiry();

    // Update session with new token
    await this.prisma.session.update({
      where: { id: session.id },
      data: {
        refresh_token: newRefreshToken,
        expires_at: newExpiresAt,
        user_agent: userAgent || session.user_agent,
        ip_address: ipAddress || session.ip_address,
      },
    });

    this.logger.log(`Refresh token rotated for user ${session.user_id}`);
    return newRefreshToken;
  }

  /**
   * Revoke a single session
   *
   * @param sessionId - Session UUID to revoke
   */
  async revokeSession(sessionId: string): Promise<void> {
    await this.prisma.session.delete({
      where: { id: sessionId },
    });
    this.logger.log(`Session ${sessionId} revoked`);
  }

  /**
   * Revoke all sessions for a user (logout from all devices)
   *
   * @param userId - User UUID
   * @returns Number of sessions revoked
   */
  async revokeAllUserSessions(userId: string): Promise<number> {
    const result = await this.prisma.session.deleteMany({
      where: { user_id: userId },
    });
    this.logger.log(`All sessions revoked for user ${userId}: ${result.count} sessions`);
    return result.count;
  }

  /**
   * Get all active sessions for a user
   *
   * @param userId - User UUID
   * @returns List of active sessions
   */
  async getUserSessions(userId: string): Promise<SessionInfo[]> {
    const sessions = await this.prisma.session.findMany({
      where: {
        user_id: userId,
        expires_at: { gt: new Date() },
      },
      select: {
        id: true,
        user_id: true,
        user_agent: true,
        ip_address: true,
        created_at: true,
        expires_at: true,
      },
      orderBy: { created_at: 'desc' },
    });

    return sessions.map((s) => ({
      id: s.id,
      userId: s.user_id,
      userAgent: s.user_agent,
      ipAddress: s.ip_address,
      createdAt: s.created_at,
      expiresAt: s.expires_at,
    }));
  }

  /**
   * Clean up expired sessions
   *
   * Should be called periodically (e.g., via cron job)
   *
   * @returns Number of sessions cleaned up
   */
  async cleanExpiredSessions(): Promise<number> {
    const result = await this.prisma.session.deleteMany({
      where: {
        expires_at: { lt: new Date() },
      },
    });
    this.logger.log(`Cleaned up ${result.count} expired sessions`);
    return result.count;
  }
}
