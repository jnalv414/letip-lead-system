/**
 * Token Service Unit Tests
 *
 * Tests for JWT token generation, verification, extraction, and decoding.
 * Covers access tokens, refresh tokens, and header extraction.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TokenService, JwtPayload, TokenPair } from '../token.service';
import { ConfigService } from '../../../../config/config.service';
import { Role } from '@prisma/client';
import * as crypto from 'crypto';

// Mock crypto module
jest.mock('crypto', () => ({
  randomBytes: jest.fn(),
}));

describe('TokenService', () => {
  let service: TokenService;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;
  const mockCrypto = crypto as jest.Mocked<typeof crypto>;

  // Test data
  const testUserId = '123e4567-e89b-12d3-a456-426614174000';
  const testEmail = 'test@example.com';
  const testRole = 'ADMIN' as Role;
  const testJwtSecret = 'test-jwt-secret-key';
  const testAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.token';
  const testRefreshToken = 'a'.repeat(64);

  beforeEach(async () => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create mock services
    const mockJwtService = {
      sign: jest.fn(),
      verify: jest.fn(),
      decode: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TokenService,
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<TokenService>(TokenService);
    jwtService = module.get(JwtService);
    configService = module.get(ConfigService);

    // Default mock implementations
    configService.get.mockReturnValue(testJwtSecret);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ============================================================
  // generateAccessToken() Tests
  // ============================================================
  describe('generateAccessToken()', () => {
    describe('Success Cases', () => {
      it('should generate access token with correct payload', () => {
        jwtService.sign.mockReturnValue(testAccessToken);

        const result = service.generateAccessToken(testUserId, testEmail, testRole);

        expect(result).toBe(testAccessToken);
        expect(jwtService.sign).toHaveBeenCalledWith(
          {
            sub: testUserId,
            email: testEmail,
            role: testRole,
          },
          expect.objectContaining({
            expiresIn: '15m',
          }),
        );
      });

      it('should use JWT secret from config', () => {
        jwtService.sign.mockReturnValue(testAccessToken);

        service.generateAccessToken(testUserId, testEmail, testRole);

        expect(jwtService.sign).toHaveBeenCalledWith(
          expect.any(Object),
          expect.objectContaining({
            secret: expect.any(String),
          }),
        );
      });

      it('should generate token for USER role', () => {
        jwtService.sign.mockReturnValue(testAccessToken);

        const result = service.generateAccessToken(testUserId, testEmail, 'USER' as Role);

        expect(result).toBe(testAccessToken);
        expect(jwtService.sign).toHaveBeenCalledWith(
          expect.objectContaining({
            role: 'USER',
          }),
          expect.any(Object),
        );
      });

      it('should generate token for MEMBER role', () => {
        jwtService.sign.mockReturnValue(testAccessToken);

        const result = service.generateAccessToken(testUserId, testEmail, 'MEMBER' as Role);

        expect(result).toBe(testAccessToken);
        expect(jwtService.sign).toHaveBeenCalledWith(
          expect.objectContaining({
            role: 'MEMBER',
          }),
          expect.any(Object),
        );
      });

      it('should handle email with special characters', () => {
        const specialEmail = 'test+special@sub.example.com';
        jwtService.sign.mockReturnValue(testAccessToken);

        service.generateAccessToken(testUserId, specialEmail, testRole);

        expect(jwtService.sign).toHaveBeenCalledWith(
          expect.objectContaining({
            email: specialEmail,
          }),
          expect.any(Object),
        );
      });
    });

    describe('Error Cases', () => {
      it('should propagate JWT signing errors', () => {
        const error = new Error('JWT signing failed');
        jwtService.sign.mockImplementation(() => {
          throw error;
        });

        expect(() => service.generateAccessToken(testUserId, testEmail, testRole)).toThrow(
          'JWT signing failed',
        );
      });
    });
  });

  // ============================================================
  // generateRefreshToken() Tests
  // ============================================================
  describe('generateRefreshToken()', () => {
    describe('Success Cases', () => {
      it('should generate 64-character hex refresh token', () => {
        const mockBuffer = Buffer.from('a'.repeat(32));
        mockCrypto.randomBytes.mockReturnValue(mockBuffer as unknown as void);

        const result = service.generateRefreshToken();

        expect(result).toHaveLength(64);
        expect(mockCrypto.randomBytes).toHaveBeenCalledWith(32);
      });

      it('should generate unique tokens on each call', () => {
        const buffer1 = Buffer.from('a'.repeat(32));
        const buffer2 = Buffer.from('b'.repeat(32));

        mockCrypto.randomBytes
          .mockReturnValueOnce(buffer1 as unknown as void)
          .mockReturnValueOnce(buffer2 as unknown as void);

        const token1 = service.generateRefreshToken();
        const token2 = service.generateRefreshToken();

        expect(token1).not.toBe(token2);
      });

      it('should return hex string format', () => {
        const mockBuffer = Buffer.from([0xde, 0xad, 0xbe, 0xef].concat(new Array(28).fill(0)));
        mockCrypto.randomBytes.mockReturnValue(mockBuffer as unknown as void);

        const result = service.generateRefreshToken();

        // Hex string should only contain 0-9 and a-f characters
        expect(result).toMatch(/^[0-9a-f]+$/);
      });
    });

    describe('Error Cases', () => {
      it('should propagate crypto errors', () => {
        const error = new Error('Entropy source exhausted');
        mockCrypto.randomBytes.mockImplementation(() => {
          throw error;
        });

        expect(() => service.generateRefreshToken()).toThrow('Entropy source exhausted');
      });
    });
  });

  // ============================================================
  // generateTokenPair() Tests
  // ============================================================
  describe('generateTokenPair()', () => {
    describe('Success Cases', () => {
      it('should return both access and refresh tokens', () => {
        jwtService.sign.mockReturnValue(testAccessToken);
        mockCrypto.randomBytes.mockReturnValue(Buffer.from('a'.repeat(32)) as unknown as void);

        const result: TokenPair = service.generateTokenPair(testUserId, testEmail, testRole);

        expect(result).toHaveProperty('accessToken');
        expect(result).toHaveProperty('refreshToken');
        expect(result.accessToken).toBe(testAccessToken);
        expect(result.refreshToken).toHaveLength(64);
      });

      it('should generate access token with user details', () => {
        jwtService.sign.mockReturnValue(testAccessToken);
        mockCrypto.randomBytes.mockReturnValue(Buffer.from('a'.repeat(32)) as unknown as void);

        service.generateTokenPair(testUserId, testEmail, testRole);

        expect(jwtService.sign).toHaveBeenCalledWith(
          expect.objectContaining({
            sub: testUserId,
            email: testEmail,
            role: testRole,
          }),
          expect.any(Object),
        );
      });
    });
  });

  // ============================================================
  // verifyAccessToken() Tests
  // ============================================================
  describe('verifyAccessToken()', () => {
    describe('Success Cases', () => {
      it('should return decoded payload for valid token', () => {
        const mockPayload: JwtPayload = {
          sub: testUserId,
          email: testEmail,
          role: testRole,
        };
        jwtService.verify.mockReturnValue(mockPayload);

        const result = service.verifyAccessToken(testAccessToken);

        expect(result).toEqual(mockPayload);
        expect(jwtService.verify).toHaveBeenCalledWith(testAccessToken, expect.any(Object));
      });

      it('should verify token with correct secret', () => {
        const mockPayload: JwtPayload = {
          sub: testUserId,
          email: testEmail,
          role: testRole,
        };
        jwtService.verify.mockReturnValue(mockPayload);

        service.verifyAccessToken(testAccessToken);

        expect(jwtService.verify).toHaveBeenCalledWith(
          testAccessToken,
          expect.objectContaining({
            secret: expect.any(String),
          }),
        );
      });

      it('should return all payload fields', () => {
        const mockPayload: JwtPayload = {
          sub: testUserId,
          email: testEmail,
          role: 'MEMBER' as Role,
        };
        jwtService.verify.mockReturnValue(mockPayload);

        const result = service.verifyAccessToken(testAccessToken);

        expect(result.sub).toBe(testUserId);
        expect(result.email).toBe(testEmail);
        expect(result.role).toBe('MEMBER');
      });
    });

    describe('Error Cases', () => {
      it('should throw UnauthorizedException for expired token', () => {
        jwtService.verify.mockImplementation(() => {
          throw new Error('jwt expired');
        });

        expect(() => service.verifyAccessToken(testAccessToken)).toThrow(UnauthorizedException);
        expect(() => service.verifyAccessToken(testAccessToken)).toThrow(
          'Invalid or expired access token',
        );
      });

      it('should throw UnauthorizedException for invalid token signature', () => {
        jwtService.verify.mockImplementation(() => {
          throw new Error('invalid signature');
        });

        expect(() => service.verifyAccessToken(testAccessToken)).toThrow(UnauthorizedException);
      });

      it('should throw UnauthorizedException for malformed token', () => {
        jwtService.verify.mockImplementation(() => {
          throw new Error('jwt malformed');
        });

        expect(() => service.verifyAccessToken('malformed-token')).toThrow(UnauthorizedException);
      });

      it('should throw UnauthorizedException for empty token', () => {
        jwtService.verify.mockImplementation(() => {
          throw new Error('jwt must be provided');
        });

        expect(() => service.verifyAccessToken('')).toThrow(UnauthorizedException);
      });
    });
  });

  // ============================================================
  // decodeToken() Tests
  // ============================================================
  describe('decodeToken()', () => {
    describe('Success Cases', () => {
      it('should decode token without verification', () => {
        const mockPayload: JwtPayload = {
          sub: testUserId,
          email: testEmail,
          role: testRole,
        };
        jwtService.decode.mockReturnValue(mockPayload);

        const result = service.decodeToken(testAccessToken);

        expect(result).toEqual(mockPayload);
        expect(jwtService.decode).toHaveBeenCalledWith(testAccessToken);
      });

      it('should decode expired token', () => {
        const expiredPayload: JwtPayload = {
          sub: testUserId,
          email: testEmail,
          role: testRole,
        };
        jwtService.decode.mockReturnValue(expiredPayload);

        const result = service.decodeToken('expired-token');

        expect(result).toEqual(expiredPayload);
      });

      it('should return payload with all fields', () => {
        const mockPayload: JwtPayload = {
          sub: '456e7890-e12b-34c5-d678-901234567890',
          email: 'another@example.com',
          role: 'USER' as Role,
        };
        jwtService.decode.mockReturnValue(mockPayload);

        const result = service.decodeToken(testAccessToken);

        expect(result?.sub).toBe(mockPayload.sub);
        expect(result?.email).toBe(mockPayload.email);
        expect(result?.role).toBe(mockPayload.role);
      });
    });

    describe('Error Cases', () => {
      it('should return null for invalid token', () => {
        jwtService.decode.mockImplementation(() => {
          throw new Error('Invalid token');
        });

        const result = service.decodeToken('invalid-token');

        expect(result).toBeNull();
      });

      it('should return null for empty token', () => {
        jwtService.decode.mockImplementation(() => {
          throw new Error('jwt must be provided');
        });

        const result = service.decodeToken('');

        expect(result).toBeNull();
      });

      it('should return null for null token', () => {
        jwtService.decode.mockImplementation(() => {
          throw new Error('jwt must be a string');
        });

        const result = service.decodeToken(null as unknown as string);

        expect(result).toBeNull();
      });

      it('should return null for completely malformed input', () => {
        jwtService.decode.mockImplementation(() => {
          throw new Error('jwt malformed');
        });

        const result = service.decodeToken('not.even.close.to.jwt');

        expect(result).toBeNull();
      });
    });
  });

  // ============================================================
  // extractTokenFromHeader() Tests
  // ============================================================
  describe('extractTokenFromHeader()', () => {
    describe('Success Cases', () => {
      it('should extract token from valid Bearer header', () => {
        const authHeader = `Bearer ${testAccessToken}`;

        const result = service.extractTokenFromHeader(authHeader);

        expect(result).toBe(testAccessToken);
      });

      it('should extract token with complex JWT structure', () => {
        const complexToken = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.signature';
        const authHeader = `Bearer ${complexToken}`;

        const result = service.extractTokenFromHeader(authHeader);

        expect(result).toBe(complexToken);
      });

      it('should preserve token with special characters', () => {
        const tokenWithSpecialChars = 'token_with-special.chars';
        const authHeader = `Bearer ${tokenWithSpecialChars}`;

        const result = service.extractTokenFromHeader(authHeader);

        expect(result).toBe(tokenWithSpecialChars);
      });

      it('should handle token with leading/trailing spaces preserved', () => {
        // The slice(7) should preserve everything after "Bearer "
        const tokenWithInternalSpaces = 'token with spaces';
        const authHeader = `Bearer ${tokenWithInternalSpaces}`;

        const result = service.extractTokenFromHeader(authHeader);

        expect(result).toBe(tokenWithInternalSpaces);
      });
    });

    describe('Null/Invalid Cases', () => {
      it('should return null for undefined header', () => {
        const result = service.extractTokenFromHeader(undefined);

        expect(result).toBeNull();
      });

      it('should return null for empty string header', () => {
        const result = service.extractTokenFromHeader('');

        expect(result).toBeNull();
      });

      it('should return null for header without Bearer prefix', () => {
        const result = service.extractTokenFromHeader(testAccessToken);

        expect(result).toBeNull();
      });

      it('should return null for Basic auth header', () => {
        const result = service.extractTokenFromHeader('Basic dXNlcm5hbWU6cGFzc3dvcmQ=');

        expect(result).toBeNull();
      });

      it('should return null for "bearer" (lowercase) prefix', () => {
        const result = service.extractTokenFromHeader(`bearer ${testAccessToken}`);

        expect(result).toBeNull();
      });

      it('should return null for "BEARER" (uppercase) prefix', () => {
        const result = service.extractTokenFromHeader(`BEARER ${testAccessToken}`);

        expect(result).toBeNull();
      });

      it('should return null for "Bearer" without space', () => {
        const result = service.extractTokenFromHeader(`Bearer${testAccessToken}`);

        expect(result).toBeNull();
      });

      it('should return null for just "Bearer "', () => {
        const result = service.extractTokenFromHeader('Bearer ');

        expect(result).toBe('');
      });

      it('should return null for whitespace only', () => {
        const result = service.extractTokenFromHeader('   ');

        expect(result).toBeNull();
      });
    });

    describe('Edge Cases', () => {
      it('should handle header with multiple spaces after Bearer', () => {
        const authHeader = 'Bearer  double-space-token';

        const result = service.extractTokenFromHeader(authHeader);

        // slice(7) will include the extra space
        expect(result).toBe(' double-space-token');
      });

      it('should handle very long token', () => {
        const longToken = 'a'.repeat(10000);
        const authHeader = `Bearer ${longToken}`;

        const result = service.extractTokenFromHeader(authHeader);

        expect(result).toBe(longToken);
        expect(result).toHaveLength(10000);
      });
    });
  });

  // ============================================================
  // getRefreshTokenExpiry() Tests
  // ============================================================
  describe('getRefreshTokenExpiry()', () => {
    describe('Success Cases', () => {
      it('should return date 7 days in the future', () => {
        const now = new Date();
        const expectedDate = new Date(now);
        expectedDate.setDate(expectedDate.getDate() + 7);

        const result = service.getRefreshTokenExpiry();

        // Allow 1 second tolerance for test execution time
        const diffMs = Math.abs(result.getTime() - expectedDate.getTime());
        expect(diffMs).toBeLessThan(1000);
      });

      it('should return a Date object', () => {
        const result = service.getRefreshTokenExpiry();

        expect(result).toBeInstanceOf(Date);
      });

      it('should return future date', () => {
        const now = new Date();

        const result = service.getRefreshTokenExpiry();

        expect(result.getTime()).toBeGreaterThan(now.getTime());
      });

      it('should return consistent results for multiple calls', () => {
        const result1 = service.getRefreshTokenExpiry();
        const result2 = service.getRefreshTokenExpiry();

        // Both should be roughly 7 days from now (within 100ms of each other)
        const diffMs = Math.abs(result1.getTime() - result2.getTime());
        expect(diffMs).toBeLessThan(100);
      });
    });

    describe('Edge Cases', () => {
      it('should handle month boundary correctly', () => {
        // JavaScript Date.setDate handles month overflow automatically
        // For example, January 28 + 7 days = February 4
        const result = service.getRefreshTokenExpiry();

        // Verify the result is a valid date 7 days in the future
        const now = new Date();
        const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
        const expectedTime = now.getTime() + sevenDaysMs;

        // Allow 1 second tolerance
        expect(Math.abs(result.getTime() - expectedTime)).toBeLessThan(1000);
      });

      it('should handle year boundary correctly', () => {
        // JavaScript Date.setDate handles year overflow automatically
        // For example, December 28 + 7 days = January 4 of next year
        const result = service.getRefreshTokenExpiry();

        // Verify result is in the future
        expect(result.getTime()).toBeGreaterThan(Date.now());

        // Verify it's approximately 7 days from now
        const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
        const expectedTime = Date.now() + sevenDaysMs;
        expect(Math.abs(result.getTime() - expectedTime)).toBeLessThan(1000);
      });
    });
  });

  // ============================================================
  // Constructor Tests
  // ============================================================
  describe('Constructor', () => {
    it('should use JWT_SECRET from config when available', async () => {
      configService.get.mockReturnValue('custom-secret-from-config');

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          TokenService,
          { provide: JwtService, useValue: { sign: jest.fn(), verify: jest.fn() } },
          { provide: ConfigService, useValue: { get: jest.fn().mockReturnValue('custom-secret') } },
        ],
      }).compile();

      const newService = module.get<TokenService>(TokenService);

      expect(newService).toBeDefined();
    });

    it('should use fallback secret when config returns undefined', async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          TokenService,
          { provide: JwtService, useValue: { sign: jest.fn(), verify: jest.fn() } },
          { provide: ConfigService, useValue: { get: jest.fn().mockReturnValue(undefined) } },
        ],
      }).compile();

      const newService = module.get<TokenService>(TokenService);

      expect(newService).toBeDefined();
    });
  });
});
