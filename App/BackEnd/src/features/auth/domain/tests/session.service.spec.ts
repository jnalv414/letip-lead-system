/**
 * Session Service Unit Tests
 *
 * Tests for session CRUD operations, token rotation, and cleanup.
 * Covers success paths, error handling, and edge cases.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { SessionService, CreateSessionData, SessionInfo } from '../session.service';
import { PrismaService } from '../../../../prisma/prisma.service';
import { TokenService } from '../token.service';

describe('SessionService', () => {
  let service: SessionService;
  let prisma: jest.Mocked<PrismaService>;
  let tokenService: jest.Mocked<TokenService>;

  // Test data
  const testUserId = '123e4567-e89b-12d3-a456-426614174000';
  const testSessionId = '456e7890-e12b-34c5-d678-901234567890';
  const testRefreshToken = 'a'.repeat(64);
  const newRefreshToken = 'b'.repeat(64);
  const testUserAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
  const testIpAddress = '192.168.1.100';
  const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
  const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 1 day ago

  // Mock session data
  const mockSession = {
    id: testSessionId,
    user_id: testUserId,
    refresh_token: testRefreshToken,
    user_agent: testUserAgent,
    ip_address: testIpAddress,
    expires_at: futureDate,
    created_at: new Date(),
    user: {
      id: testUserId,
      email: 'test@example.com',
      name: 'Test User',
      role: 'USER',
    },
  };

  beforeEach(async () => {
    // Reset all mocks
    jest.clearAllMocks();

    // Suppress Logger output during tests
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});

    // Create mock Prisma service
    const mockPrismaService = {
      session: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        deleteMany: jest.fn(),
        findMany: jest.fn(),
      },
    };

    // Create mock Token service
    const mockTokenService = {
      generateRefreshToken: jest.fn(),
      getRefreshTokenExpiry: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: TokenService,
          useValue: mockTokenService,
        },
      ],
    }).compile();

    service = module.get<SessionService>(SessionService);
    prisma = module.get(PrismaService);
    tokenService = module.get(TokenService);

    // Default mock implementations
    tokenService.generateRefreshToken.mockReturnValue(testRefreshToken);
    tokenService.getRefreshTokenExpiry.mockReturnValue(futureDate);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ============================================================
  // createSession() Tests
  // ============================================================
  describe('createSession()', () => {
    describe('Success Cases', () => {
      it('should create session with all data provided', async () => {
        const createData: CreateSessionData = {
          userId: testUserId,
          userAgent: testUserAgent,
          ipAddress: testIpAddress,
        };
        prisma.session.create.mockResolvedValue(mockSession as any);

        const result = await service.createSession(createData);

        expect(result).toBe(testRefreshToken);
        expect(tokenService.generateRefreshToken).toHaveBeenCalled();
        expect(tokenService.getRefreshTokenExpiry).toHaveBeenCalled();
        expect(prisma.session.create).toHaveBeenCalledWith({
          data: {
            user_id: testUserId,
            refresh_token: testRefreshToken,
            user_agent: testUserAgent,
            ip_address: testIpAddress,
            expires_at: futureDate,
          },
        });
      });

      it('should create session without optional userAgent', async () => {
        const createData: CreateSessionData = {
          userId: testUserId,
          ipAddress: testIpAddress,
        };
        prisma.session.create.mockResolvedValue(mockSession as any);

        const result = await service.createSession(createData);

        expect(result).toBe(testRefreshToken);
        expect(prisma.session.create).toHaveBeenCalledWith({
          data: {
            user_id: testUserId,
            refresh_token: testRefreshToken,
            user_agent: null,
            ip_address: testIpAddress,
            expires_at: futureDate,
          },
        });
      });

      it('should create session without optional ipAddress', async () => {
        const createData: CreateSessionData = {
          userId: testUserId,
          userAgent: testUserAgent,
        };
        prisma.session.create.mockResolvedValue(mockSession as any);

        const result = await service.createSession(createData);

        expect(result).toBe(testRefreshToken);
        expect(prisma.session.create).toHaveBeenCalledWith({
          data: {
            user_id: testUserId,
            refresh_token: testRefreshToken,
            user_agent: testUserAgent,
            ip_address: null,
            expires_at: futureDate,
          },
        });
      });

      it('should create session with only userId', async () => {
        const createData: CreateSessionData = {
          userId: testUserId,
        };
        prisma.session.create.mockResolvedValue(mockSession as any);

        const result = await service.createSession(createData);

        expect(result).toBe(testRefreshToken);
        expect(prisma.session.create).toHaveBeenCalledWith({
          data: {
            user_id: testUserId,
            refresh_token: testRefreshToken,
            user_agent: null,
            ip_address: null,
            expires_at: futureDate,
          },
        });
      });

      it('should return unique refresh token', async () => {
        const uniqueToken = 'c'.repeat(64);
        tokenService.generateRefreshToken.mockReturnValue(uniqueToken);
        prisma.session.create.mockResolvedValue({ ...mockSession, refresh_token: uniqueToken } as any);

        const result = await service.createSession({ userId: testUserId });

        expect(result).toBe(uniqueToken);
      });
    });

    describe('Error Cases', () => {
      it('should propagate database errors', async () => {
        const dbError = new Error('Database connection failed');
        prisma.session.create.mockRejectedValue(dbError);

        await expect(service.createSession({ userId: testUserId })).rejects.toThrow(
          'Database connection failed',
        );
      });

      it('should propagate unique constraint violations', async () => {
        const constraintError = new Error('Unique constraint violation on refresh_token');
        prisma.session.create.mockRejectedValue(constraintError);

        await expect(service.createSession({ userId: testUserId })).rejects.toThrow(
          'Unique constraint violation',
        );
      });
    });
  });

  // ============================================================
  // findByRefreshToken() Tests
  // ============================================================
  describe('findByRefreshToken()', () => {
    describe('Success Cases', () => {
      it('should find session by refresh token', async () => {
        prisma.session.findUnique.mockResolvedValue(mockSession as any);

        const result = await service.findByRefreshToken(testRefreshToken);

        expect(result).toEqual(mockSession);
        expect(prisma.session.findUnique).toHaveBeenCalledWith({
          where: { refresh_token: testRefreshToken },
          include: { user: true },
        });
      });

      it('should return session with user data included', async () => {
        prisma.session.findUnique.mockResolvedValue(mockSession as any);

        const result = await service.findByRefreshToken(testRefreshToken);

        expect(result?.user).toBeDefined();
        expect(result?.user.email).toBe('test@example.com');
      });

      it('should return null for non-existent token', async () => {
        prisma.session.findUnique.mockResolvedValue(null);

        const result = await service.findByRefreshToken('nonexistent-token');

        expect(result).toBeNull();
      });
    });

    describe('Error Cases', () => {
      it('should propagate database errors', async () => {
        const dbError = new Error('Database query failed');
        prisma.session.findUnique.mockRejectedValue(dbError);

        await expect(service.findByRefreshToken(testRefreshToken)).rejects.toThrow(
          'Database query failed',
        );
      });
    });
  });

  // ============================================================
  // rotateRefreshToken() Tests
  // ============================================================
  describe('rotateRefreshToken()', () => {
    describe('Success Cases', () => {
      it('should rotate refresh token successfully', async () => {
        prisma.session.findUnique.mockResolvedValue(mockSession as any);
        tokenService.generateRefreshToken.mockReturnValue(newRefreshToken);
        prisma.session.update.mockResolvedValue({ ...mockSession, refresh_token: newRefreshToken } as any);

        const result = await service.rotateRefreshToken(testRefreshToken);

        expect(result).toBe(newRefreshToken);
        expect(prisma.session.update).toHaveBeenCalledWith({
          where: { id: testSessionId },
          data: {
            refresh_token: newRefreshToken,
            expires_at: futureDate,
            user_agent: testUserAgent,
            ip_address: testIpAddress,
          },
        });
      });

      it('should update userAgent when provided', async () => {
        const newUserAgent = 'Chrome/120.0.0.0';
        prisma.session.findUnique.mockResolvedValue(mockSession as any);
        tokenService.generateRefreshToken.mockReturnValue(newRefreshToken);
        prisma.session.update.mockResolvedValue({} as any);

        await service.rotateRefreshToken(testRefreshToken, newUserAgent);

        expect(prisma.session.update).toHaveBeenCalledWith({
          where: { id: testSessionId },
          data: expect.objectContaining({
            user_agent: newUserAgent,
          }),
        });
      });

      it('should update ipAddress when provided', async () => {
        const newIpAddress = '10.0.0.50';
        prisma.session.findUnique.mockResolvedValue(mockSession as any);
        tokenService.generateRefreshToken.mockReturnValue(newRefreshToken);
        prisma.session.update.mockResolvedValue({} as any);

        await service.rotateRefreshToken(testRefreshToken, undefined, newIpAddress);

        expect(prisma.session.update).toHaveBeenCalledWith({
          where: { id: testSessionId },
          data: expect.objectContaining({
            ip_address: newIpAddress,
          }),
        });
      });

      it('should preserve existing userAgent when not provided', async () => {
        prisma.session.findUnique.mockResolvedValue(mockSession as any);
        tokenService.generateRefreshToken.mockReturnValue(newRefreshToken);
        prisma.session.update.mockResolvedValue({} as any);

        await service.rotateRefreshToken(testRefreshToken);

        expect(prisma.session.update).toHaveBeenCalledWith({
          where: { id: testSessionId },
          data: expect.objectContaining({
            user_agent: testUserAgent,
          }),
        });
      });

      it('should preserve existing ipAddress when not provided', async () => {
        prisma.session.findUnique.mockResolvedValue(mockSession as any);
        tokenService.generateRefreshToken.mockReturnValue(newRefreshToken);
        prisma.session.update.mockResolvedValue({} as any);

        await service.rotateRefreshToken(testRefreshToken);

        expect(prisma.session.update).toHaveBeenCalledWith({
          where: { id: testSessionId },
          data: expect.objectContaining({
            ip_address: testIpAddress,
          }),
        });
      });
    });

    describe('Null Return Cases', () => {
      it('should return null when session not found', async () => {
        prisma.session.findUnique.mockResolvedValue(null);

        const result = await service.rotateRefreshToken('nonexistent-token');

        expect(result).toBeNull();
        expect(prisma.session.update).not.toHaveBeenCalled();
      });

      it('should return null and revoke expired session', async () => {
        const expiredSession = {
          ...mockSession,
          expires_at: pastDate,
        };
        prisma.session.findUnique.mockResolvedValue(expiredSession as any);
        prisma.session.delete.mockResolvedValue(expiredSession as any);

        const result = await service.rotateRefreshToken(testRefreshToken);

        expect(result).toBeNull();
        expect(prisma.session.delete).toHaveBeenCalledWith({
          where: { id: testSessionId },
        });
        expect(prisma.session.update).not.toHaveBeenCalled();
      });
    });

    describe('Error Cases', () => {
      it('should propagate database errors during find', async () => {
        const dbError = new Error('Find operation failed');
        prisma.session.findUnique.mockRejectedValue(dbError);

        await expect(service.rotateRefreshToken(testRefreshToken)).rejects.toThrow(
          'Find operation failed',
        );
      });

      it('should propagate database errors during update', async () => {
        prisma.session.findUnique.mockResolvedValue(mockSession as any);
        const dbError = new Error('Update operation failed');
        prisma.session.update.mockRejectedValue(dbError);

        await expect(service.rotateRefreshToken(testRefreshToken)).rejects.toThrow(
          'Update operation failed',
        );
      });
    });
  });

  // ============================================================
  // revokeSession() Tests
  // ============================================================
  describe('revokeSession()', () => {
    describe('Success Cases', () => {
      it('should delete session by ID', async () => {
        prisma.session.delete.mockResolvedValue(mockSession as any);

        await service.revokeSession(testSessionId);

        expect(prisma.session.delete).toHaveBeenCalledWith({
          where: { id: testSessionId },
        });
      });

      it('should complete without error for valid session', async () => {
        prisma.session.delete.mockResolvedValue(mockSession as any);

        await expect(service.revokeSession(testSessionId)).resolves.toBeUndefined();
      });
    });

    describe('Error Cases', () => {
      it('should propagate error when session not found', async () => {
        const notFoundError = new Error('Record not found');
        prisma.session.delete.mockRejectedValue(notFoundError);

        await expect(service.revokeSession('nonexistent-id')).rejects.toThrow('Record not found');
      });

      it('should propagate database errors', async () => {
        const dbError = new Error('Database delete failed');
        prisma.session.delete.mockRejectedValue(dbError);

        await expect(service.revokeSession(testSessionId)).rejects.toThrow('Database delete failed');
      });
    });
  });

  // ============================================================
  // revokeAllUserSessions() Tests
  // ============================================================
  describe('revokeAllUserSessions()', () => {
    describe('Success Cases', () => {
      it('should delete all sessions for user', async () => {
        prisma.session.deleteMany.mockResolvedValue({ count: 5 });

        const result = await service.revokeAllUserSessions(testUserId);

        expect(result).toBe(5);
        expect(prisma.session.deleteMany).toHaveBeenCalledWith({
          where: { user_id: testUserId },
        });
      });

      it('should return 0 when user has no sessions', async () => {
        prisma.session.deleteMany.mockResolvedValue({ count: 0 });

        const result = await service.revokeAllUserSessions(testUserId);

        expect(result).toBe(0);
      });

      it('should handle single session deletion', async () => {
        prisma.session.deleteMany.mockResolvedValue({ count: 1 });

        const result = await service.revokeAllUserSessions(testUserId);

        expect(result).toBe(1);
      });

      it('should handle many sessions deletion', async () => {
        prisma.session.deleteMany.mockResolvedValue({ count: 100 });

        const result = await service.revokeAllUserSessions(testUserId);

        expect(result).toBe(100);
      });
    });

    describe('Error Cases', () => {
      it('should propagate database errors', async () => {
        const dbError = new Error('DeleteMany operation failed');
        prisma.session.deleteMany.mockRejectedValue(dbError);

        await expect(service.revokeAllUserSessions(testUserId)).rejects.toThrow(
          'DeleteMany operation failed',
        );
      });
    });
  });

  // ============================================================
  // getUserSessions() Tests
  // ============================================================
  describe('getUserSessions()', () => {
    describe('Success Cases', () => {
      it('should return active sessions for user', async () => {
        const mockSessions = [
          {
            id: testSessionId,
            user_id: testUserId,
            user_agent: testUserAgent,
            ip_address: testIpAddress,
            created_at: new Date(),
            expires_at: futureDate,
          },
          {
            id: 'another-session-id',
            user_id: testUserId,
            user_agent: 'Firefox/120.0',
            ip_address: '10.0.0.1',
            created_at: new Date(),
            expires_at: futureDate,
          },
        ];
        prisma.session.findMany.mockResolvedValue(mockSessions as any);

        const result: SessionInfo[] = await service.getUserSessions(testUserId);

        expect(result).toHaveLength(2);
        expect(result[0].id).toBe(testSessionId);
        expect(result[0].userId).toBe(testUserId);
        expect(result[0].userAgent).toBe(testUserAgent);
        expect(result[0].ipAddress).toBe(testIpAddress);
      });

      it('should filter by active sessions only', async () => {
        prisma.session.findMany.mockResolvedValue([]);

        await service.getUserSessions(testUserId);

        expect(prisma.session.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: {
              user_id: testUserId,
              expires_at: { gt: expect.any(Date) },
            },
          }),
        );
      });

      it('should order by created_at descending', async () => {
        prisma.session.findMany.mockResolvedValue([]);

        await service.getUserSessions(testUserId);

        expect(prisma.session.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            orderBy: { created_at: 'desc' },
          }),
        );
      });

      it('should return empty array when no active sessions', async () => {
        prisma.session.findMany.mockResolvedValue([]);

        const result = await service.getUserSessions(testUserId);

        expect(result).toEqual([]);
      });

      it('should map database fields to SessionInfo interface', async () => {
        const dbSession = {
          id: testSessionId,
          user_id: testUserId,
          user_agent: testUserAgent,
          ip_address: testIpAddress,
          created_at: new Date('2025-01-01'),
          expires_at: futureDate,
        };
        prisma.session.findMany.mockResolvedValue([dbSession] as any);

        const result = await service.getUserSessions(testUserId);

        expect(result[0]).toEqual({
          id: testSessionId,
          userId: testUserId,
          userAgent: testUserAgent,
          ipAddress: testIpAddress,
          createdAt: dbSession.created_at,
          expiresAt: futureDate,
        });
      });

      it('should handle null userAgent and ipAddress', async () => {
        const dbSession = {
          id: testSessionId,
          user_id: testUserId,
          user_agent: null,
          ip_address: null,
          created_at: new Date(),
          expires_at: futureDate,
        };
        prisma.session.findMany.mockResolvedValue([dbSession] as any);

        const result = await service.getUserSessions(testUserId);

        expect(result[0].userAgent).toBeNull();
        expect(result[0].ipAddress).toBeNull();
      });
    });

    describe('Error Cases', () => {
      it('should propagate database errors', async () => {
        const dbError = new Error('FindMany operation failed');
        prisma.session.findMany.mockRejectedValue(dbError);

        await expect(service.getUserSessions(testUserId)).rejects.toThrow(
          'FindMany operation failed',
        );
      });
    });
  });

  // ============================================================
  // cleanExpiredSessions() Tests
  // ============================================================
  describe('cleanExpiredSessions()', () => {
    describe('Success Cases', () => {
      it('should delete expired sessions', async () => {
        prisma.session.deleteMany.mockResolvedValue({ count: 10 });

        const result = await service.cleanExpiredSessions();

        expect(result).toBe(10);
        expect(prisma.session.deleteMany).toHaveBeenCalledWith({
          where: {
            expires_at: { lt: expect.any(Date) },
          },
        });
      });

      it('should return 0 when no expired sessions', async () => {
        prisma.session.deleteMany.mockResolvedValue({ count: 0 });

        const result = await service.cleanExpiredSessions();

        expect(result).toBe(0);
      });

      it('should filter by expires_at less than current date', async () => {
        const beforeCall = new Date();
        prisma.session.deleteMany.mockResolvedValue({ count: 0 });

        await service.cleanExpiredSessions();

        const callArgs = prisma.session.deleteMany.mock.calls[0][0];
        expect(callArgs.where.expires_at.lt.getTime()).toBeGreaterThanOrEqual(beforeCall.getTime());
      });

      it('should handle large cleanup operations', async () => {
        prisma.session.deleteMany.mockResolvedValue({ count: 10000 });

        const result = await service.cleanExpiredSessions();

        expect(result).toBe(10000);
      });
    });

    describe('Error Cases', () => {
      it('should propagate database errors', async () => {
        const dbError = new Error('Cleanup operation failed');
        prisma.session.deleteMany.mockRejectedValue(dbError);

        await expect(service.cleanExpiredSessions()).rejects.toThrow('Cleanup operation failed');
      });
    });
  });

  // ============================================================
  // Edge Cases and Integration Scenarios
  // ============================================================
  describe('Edge Cases', () => {
    it('should handle concurrent session creation for same user', async () => {
      const tokens = ['token1'.repeat(8), 'token2'.repeat(8)];
      tokenService.generateRefreshToken
        .mockReturnValueOnce(tokens[0])
        .mockReturnValueOnce(tokens[1]);
      prisma.session.create.mockResolvedValue(mockSession as any);

      const [result1, result2] = await Promise.all([
        service.createSession({ userId: testUserId }),
        service.createSession({ userId: testUserId }),
      ]);

      expect(result1).not.toBe(result2);
      expect(prisma.session.create).toHaveBeenCalledTimes(2);
    });

    it('should handle session with very long userAgent', async () => {
      const longUserAgent = 'A'.repeat(10000);
      prisma.session.create.mockResolvedValue(mockSession as any);

      await service.createSession({
        userId: testUserId,
        userAgent: longUserAgent,
      });

      expect(prisma.session.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          user_agent: longUserAgent,
        }),
      });
    });

    it('should handle IPv6 addresses', async () => {
      const ipv6Address = '2001:0db8:85a3:0000:0000:8a2e:0370:7334';
      prisma.session.create.mockResolvedValue(mockSession as any);

      await service.createSession({
        userId: testUserId,
        ipAddress: ipv6Address,
      });

      expect(prisma.session.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          ip_address: ipv6Address,
        }),
      });
    });
  });
});
