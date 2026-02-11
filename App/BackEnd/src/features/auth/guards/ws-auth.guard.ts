/**
 * WebSocket Auth Guard
 *
 * Validates JWT tokens on WebSocket connections during the handshake phase.
 * Extracts the token from the `auth.token` field in the Socket.io handshake
 * or from the `Authorization` header, verifies it, and attaches the user
 * payload to the socket's `data` property.
 *
 * Usage in gateway:
 *   handleConnection(client: Socket) {
 *     // client.data.user is available after guard validation
 *   }
 */

import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { TokenService } from '../domain/token.service';
import { AuthService } from '../domain/auth.service';

@Injectable()
export class WsAuthGuard implements CanActivate {
  private readonly logger = new Logger(WsAuthGuard.name);

  constructor(
    private readonly tokenService: TokenService,
    private readonly authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client: Socket = context.switchToWs().getClient();
    const user = await this.validateClient(client);

    if (!user) {
      throw new WsException('Unauthorized');
    }

    return true;
  }

  /**
   * Validate a WebSocket client connection.
   *
   * Extracts JWT from handshake auth or headers, verifies it,
   * and attaches user data to socket.data.user.
   *
   * @param client - Socket.io client
   * @returns User payload or null if invalid
   */
  async validateClient(client: Socket): Promise<Record<string, any> | null> {
    try {
      const token = this.extractToken(client);

      if (!token) {
        this.logger.warn(`WebSocket connection rejected: no token provided (${client.id})`);
        return null;
      }

      // Verify the JWT token
      const payload = this.tokenService.verifyAccessToken(token);

      // Validate user still exists and is active
      const user = await this.authService.validateUser(payload.sub);

      if (!user) {
        this.logger.warn(`WebSocket connection rejected: user not found (${client.id})`);
        return null;
      }

      const userData = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      };

      // Attach user to socket data for downstream access
      client.data.user = userData;

      return userData;
    } catch (error) {
      this.logger.warn(
        `WebSocket authentication failed (${client.id}): ${error.message}`,
      );
      return null;
    }
  }

  /**
   * Extract JWT token from Socket.io handshake.
   *
   * Checks in order:
   * 1. handshake.auth.token (Socket.io v3+ recommended)
   * 2. handshake.headers.authorization (Bearer token)
   * 3. handshake.query.token (fallback for legacy clients)
   */
  private extractToken(client: Socket): string | null {
    // 1. Socket.io auth object (preferred)
    const authToken = client.handshake?.auth?.token;
    if (authToken && typeof authToken === 'string') {
      return authToken;
    }

    // 2. Authorization header
    const authHeader = client.handshake?.headers?.authorization;
    if (authHeader) {
      return this.tokenService.extractTokenFromHeader(authHeader);
    }

    // 3. Query parameter (fallback)
    const queryToken = client.handshake?.query?.token;
    if (queryToken && typeof queryToken === 'string') {
      return queryToken;
    }

    return null;
  }
}
