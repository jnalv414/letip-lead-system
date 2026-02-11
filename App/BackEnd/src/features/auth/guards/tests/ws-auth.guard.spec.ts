/**
 * WsAuthGuard Unit Tests
 *
 * Tests for WebSocket authentication guard that validates JWT tokens
 * during Socket.io connection handshake.
 *
 * Test Categories:
 * - canActivate(): Guard interface for NestJS WebSocket gateway
 * - validateClient(): Direct client validation used by EventsGateway
 * - extractToken(): Token extraction from auth, headers, and query
 * - Error handling: Expired tokens, invalid tokens, missing users
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, Logger } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { Role } from '@prisma/client';
import { Socket } from 'socket.io';
import { WsAuthGuard } from '../ws-auth.guard';
import { TokenService } from '../../domain/token.service';
import { AuthService } from '../../domain/auth.service';

describe('WsAuthGuard', () => {
  let guard: WsAuthGuard;
  let tokenService: jest.Mocked<TokenService>;
  let authService: jest.Mocked<AuthService>;

  const mockUser = {
    id: 'user-uuid-123',
    email: 'test@example.com',
    name: 'Test User',
    role: Role.MEMBER,
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockPayload = {
    sub: 'user-uuid-123',
    email: 'test@example.com',
    role: Role.MEMBER,
  };

  const createMockSocket = (overrides: Partial<{
    auth: Record<string, any>;
    headers: Record<string, string>;
    query: Record<string, string>;
  }> = {}): Socket => {
    return {
      id: 'socket-123',
      handshake: {
        auth: overrides.auth || {},
        headers: overrides.headers || {},
        query: overrides.query || {},
      },
      data: {},
    } as unknown as Socket;
  };

  const createMockWsContext = (client: Socket): ExecutionContext => {
    return {
      switchToWs: () => ({
        getClient: () => client,
        getData: () => ({}),
        getPattern: () => '',
      }),
      switchToHttp: () => ({} as any),
      switchToRpc: () => ({} as any),
      getHandler: () => jest.fn(),
      getClass: () => jest.fn(),
      getArgs: () => [],
      getArgByIndex: () => null,
      getType: () => 'ws' as const,
    } as ExecutionContext;
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => {});

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WsAuthGuard,
        {
          provide: TokenService,
          useValue: {
            verifyAccessToken: jest.fn(),
            extractTokenFromHeader: jest.fn(),
          },
        },
        {
          provide: AuthService,
          useValue: {
            validateUser: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<WsAuthGuard>(WsAuthGuard);
    tokenService = module.get(TokenService);
    authService = module.get(AuthService);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  // ============================================================
  // canActivate() Tests
  // ============================================================
  describe('canActivate()', () => {
    it('should return true for valid authenticated client', async () => {
      const client = createMockSocket({ auth: { token: 'valid-jwt' } });
      const context = createMockWsContext(client);

      tokenService.verifyAccessToken.mockReturnValue(mockPayload as any);
      authService.validateUser.mockResolvedValue(mockUser as any);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should throw WsException for unauthenticated client', async () => {
      const client = createMockSocket(); // No token
      const context = createMockWsContext(client);

      await expect(guard.canActivate(context)).rejects.toThrow(WsException);
      await expect(guard.canActivate(context)).rejects.toThrow('Unauthorized');
    });

    it('should throw WsException when token is invalid', async () => {
      const client = createMockSocket({ auth: { token: 'invalid-jwt' } });
      const context = createMockWsContext(client);

      tokenService.verifyAccessToken.mockImplementation(() => {
        throw new Error('Invalid or expired access token');
      });

      await expect(guard.canActivate(context)).rejects.toThrow(WsException);
    });

    it('should throw WsException when user not found', async () => {
      const client = createMockSocket({ auth: { token: 'valid-jwt' } });
      const context = createMockWsContext(client);

      tokenService.verifyAccessToken.mockReturnValue(mockPayload as any);
      authService.validateUser.mockResolvedValue(null);

      await expect(guard.canActivate(context)).rejects.toThrow(WsException);
    });
  });

  // ============================================================
  // validateClient() Tests
  // ============================================================
  describe('validateClient()', () => {
    it('should return user data for valid token in auth object', async () => {
      const client = createMockSocket({ auth: { token: 'valid-jwt' } });

      tokenService.verifyAccessToken.mockReturnValue(mockPayload as any);
      authService.validateUser.mockResolvedValue(mockUser as any);

      const result = await guard.validateClient(client);

      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        role: mockUser.role,
      });
    });

    it('should attach user to socket.data.user', async () => {
      const client = createMockSocket({ auth: { token: 'valid-jwt' } });

      tokenService.verifyAccessToken.mockReturnValue(mockPayload as any);
      authService.validateUser.mockResolvedValue(mockUser as any);

      await guard.validateClient(client);

      expect(client.data.user).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        role: mockUser.role,
      });
    });

    it('should return null when no token provided', async () => {
      const client = createMockSocket();

      const result = await guard.validateClient(client);

      expect(result).toBeNull();
      expect(tokenService.verifyAccessToken).not.toHaveBeenCalled();
    });

    it('should return null when token verification fails', async () => {
      const client = createMockSocket({ auth: { token: 'expired-jwt' } });

      tokenService.verifyAccessToken.mockImplementation(() => {
        throw new Error('Token expired');
      });

      const result = await guard.validateClient(client);

      expect(result).toBeNull();
    });

    it('should return null when user not found', async () => {
      const client = createMockSocket({ auth: { token: 'valid-jwt' } });

      tokenService.verifyAccessToken.mockReturnValue(mockPayload as any);
      authService.validateUser.mockResolvedValue(null);

      const result = await guard.validateClient(client);

      expect(result).toBeNull();
    });

    it('should return null when user is inactive', async () => {
      const client = createMockSocket({ auth: { token: 'valid-jwt' } });

      tokenService.verifyAccessToken.mockReturnValue(mockPayload as any);
      // validateUser returns null for inactive users
      authService.validateUser.mockResolvedValue(null);

      const result = await guard.validateClient(client);

      expect(result).toBeNull();
    });

    it('should call tokenService.verifyAccessToken with extracted token', async () => {
      const client = createMockSocket({ auth: { token: 'my-jwt-token' } });

      tokenService.verifyAccessToken.mockReturnValue(mockPayload as any);
      authService.validateUser.mockResolvedValue(mockUser as any);

      await guard.validateClient(client);

      expect(tokenService.verifyAccessToken).toHaveBeenCalledWith('my-jwt-token');
    });

    it('should call authService.validateUser with user ID from payload', async () => {
      const client = createMockSocket({ auth: { token: 'valid-jwt' } });

      tokenService.verifyAccessToken.mockReturnValue(mockPayload as any);
      authService.validateUser.mockResolvedValue(mockUser as any);

      await guard.validateClient(client);

      expect(authService.validateUser).toHaveBeenCalledWith('user-uuid-123');
    });
  });

  // ============================================================
  // Token Extraction Tests
  // ============================================================
  describe('Token extraction (via validateClient)', () => {
    beforeEach(() => {
      tokenService.verifyAccessToken.mockReturnValue(mockPayload as any);
      authService.validateUser.mockResolvedValue(mockUser as any);
    });

    it('should extract token from handshake.auth.token (preferred)', async () => {
      const client = createMockSocket({ auth: { token: 'auth-token' } });

      await guard.validateClient(client);

      expect(tokenService.verifyAccessToken).toHaveBeenCalledWith('auth-token');
    });

    it('should extract token from Authorization header (Bearer)', async () => {
      tokenService.extractTokenFromHeader.mockReturnValue('header-token');
      const client = createMockSocket({
        headers: { authorization: 'Bearer header-token' },
      });

      await guard.validateClient(client);

      expect(tokenService.extractTokenFromHeader).toHaveBeenCalledWith('Bearer header-token');
      expect(tokenService.verifyAccessToken).toHaveBeenCalledWith('header-token');
    });

    it('should extract token from query parameter (fallback)', async () => {
      const client = createMockSocket({
        query: { token: 'query-token' },
      });

      await guard.validateClient(client);

      expect(tokenService.verifyAccessToken).toHaveBeenCalledWith('query-token');
    });

    it('should prefer auth.token over header and query', async () => {
      tokenService.extractTokenFromHeader.mockReturnValue('header-token');
      const client = createMockSocket({
        auth: { token: 'auth-token' },
        headers: { authorization: 'Bearer header-token' },
        query: { token: 'query-token' },
      });

      await guard.validateClient(client);

      expect(tokenService.verifyAccessToken).toHaveBeenCalledWith('auth-token');
    });

    it('should prefer Authorization header over query when auth.token is missing', async () => {
      tokenService.extractTokenFromHeader.mockReturnValue('header-token');
      const client = createMockSocket({
        headers: { authorization: 'Bearer header-token' },
        query: { token: 'query-token' },
      });

      await guard.validateClient(client);

      expect(tokenService.verifyAccessToken).toHaveBeenCalledWith('header-token');
    });

    it('should return null when no token in any location', async () => {
      const client = createMockSocket();

      const result = await guard.validateClient(client);

      expect(result).toBeNull();
      expect(tokenService.verifyAccessToken).not.toHaveBeenCalled();
    });

    it('should ignore non-string auth.token values', async () => {
      const client = createMockSocket({
        auth: { token: 12345 as any },
      });

      const result = await guard.validateClient(client);

      // Non-string token should be ignored, falls through to header/query
      expect(result).toBeNull();
    });

    it('should ignore non-string query.token values', async () => {
      const client = createMockSocket({
        query: { token: ['array'] as any },
      });

      const result = await guard.validateClient(client);

      expect(result).toBeNull();
    });

    it('should handle null Authorization header from extractTokenFromHeader', async () => {
      tokenService.extractTokenFromHeader.mockReturnValue(null);
      const client = createMockSocket({
        headers: { authorization: 'InvalidFormat' },
      });

      const result = await guard.validateClient(client);

      expect(result).toBeNull();
    });
  });

  // ============================================================
  // Role-Based Tests
  // ============================================================
  describe('Role handling', () => {
    beforeEach(() => {
      tokenService.verifyAccessToken.mockReturnValue(mockPayload as any);
    });

    it('should return ADMIN role in user data', async () => {
      const adminUser = { ...mockUser, role: Role.ADMIN };
      authService.validateUser.mockResolvedValue(adminUser as any);

      const client = createMockSocket({ auth: { token: 'valid-jwt' } });
      const result = await guard.validateClient(client);

      expect(result?.role).toBe(Role.ADMIN);
    });

    it('should return MEMBER role in user data', async () => {
      const memberUser = { ...mockUser, role: Role.MEMBER };
      authService.validateUser.mockResolvedValue(memberUser as any);

      const client = createMockSocket({ auth: { token: 'valid-jwt' } });
      const result = await guard.validateClient(client);

      expect(result?.role).toBe(Role.MEMBER);
    });

    it('should return VIEWER role in user data', async () => {
      const viewerUser = { ...mockUser, role: Role.VIEWER };
      authService.validateUser.mockResolvedValue(viewerUser as any);

      const client = createMockSocket({ auth: { token: 'valid-jwt' } });
      const result = await guard.validateClient(client);

      expect(result?.role).toBe(Role.VIEWER);
    });
  });

  // ============================================================
  // Edge Cases
  // ============================================================
  describe('Edge cases', () => {
    it('should handle missing handshake object gracefully', async () => {
      const client = {
        id: 'socket-no-handshake',
        handshake: undefined,
        data: {},
      } as unknown as Socket;

      const result = await guard.validateClient(client);

      expect(result).toBeNull();
    });

    it('should handle empty auth object', async () => {
      const client = createMockSocket({ auth: {} });

      const result = await guard.validateClient(client);

      expect(result).toBeNull();
    });

    it('should handle empty string token', async () => {
      const client = createMockSocket({ auth: { token: '' } });

      const result = await guard.validateClient(client);

      // Empty string is falsy, should be treated as no token
      expect(result).toBeNull();
    });

    it('should not expose sensitive user fields', async () => {
      const userWithPassword = {
        ...mockUser,
        password_hash: 'secret-hash',
        sessions: [],
      };
      tokenService.verifyAccessToken.mockReturnValue(mockPayload as any);
      authService.validateUser.mockResolvedValue(userWithPassword as any);

      const client = createMockSocket({ auth: { token: 'valid-jwt' } });
      const result = await guard.validateClient(client);

      expect(result).not.toHaveProperty('password_hash');
      expect(result).not.toHaveProperty('sessions');
      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        role: mockUser.role,
      });
    });

    it('should handle authService throwing unexpected error', async () => {
      tokenService.verifyAccessToken.mockReturnValue(mockPayload as any);
      authService.validateUser.mockRejectedValue(new Error('Database down'));

      const client = createMockSocket({ auth: { token: 'valid-jwt' } });
      const result = await guard.validateClient(client);

      expect(result).toBeNull();
    });
  });
});
