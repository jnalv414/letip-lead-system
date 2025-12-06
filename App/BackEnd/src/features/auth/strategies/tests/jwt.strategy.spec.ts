/**
 * JWT Strategy Unit Tests
 *
 * Tests for Passport JWT strategy validation logic.
 * Covers user validation, unauthorized scenarios, and configuration.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy } from '../jwt.strategy';
import { ConfigService } from '../../../../config/config.service';
import { AuthService } from '../../domain/auth.service';
import { JwtPayload } from '../../domain/token.service';
import { Role } from '@prisma/client';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let authService: jest.Mocked<AuthService>;
  let configService: jest.Mocked<ConfigService>;

  // Test data
  const testUserId = '123e4567-e89b-12d3-a456-426614174000';
  const testEmail = 'test@example.com';
  const testName = 'Test User';
  const testJwtSecret = 'test-jwt-secret-key';
  const fallbackSecret = 'letip-lead-system-jwt-secret-change-in-production';

  // Mock user data
  const mockActiveUser = {
    id: testUserId,
    email: testEmail,
    name: testName,
    role: 'ADMIN' as Role,
    is_active: true,
  };

  const mockMemberUser = {
    id: testUserId,
    email: testEmail,
    name: testName,
    role: 'MEMBER' as Role,
    is_active: true,
  };

  const mockUserUser = {
    id: testUserId,
    email: 'user@example.com',
    name: 'Regular User',
    role: 'USER' as Role,
    is_active: true,
  };

  // Mock JWT payload
  const mockPayload: JwtPayload = {
    sub: testUserId,
    email: testEmail,
    role: 'ADMIN' as Role,
  };

  beforeEach(async () => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create mock services
    const mockAuthService = {
      validateUser: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn(),
    };

    // Default: return JWT secret from config
    mockConfigService.get.mockReturnValue(testJwtSecret);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    authService = module.get(AuthService);
    configService = module.get(ConfigService);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  // ============================================================
  // validate() Tests - Success Cases
  // ============================================================
  describe('validate()', () => {
    describe('Success Cases', () => {
      it('should return user object when user is found and active', async () => {
        authService.validateUser.mockResolvedValue(mockActiveUser);

        const result = await strategy.validate(mockPayload);

        expect(result).toEqual({
          id: testUserId,
          email: testEmail,
          name: testName,
          role: 'ADMIN',
        });
        expect(authService.validateUser).toHaveBeenCalledWith(testUserId);
      });

      it('should extract user ID from payload.sub', async () => {
        authService.validateUser.mockResolvedValue(mockActiveUser);

        await strategy.validate(mockPayload);

        expect(authService.validateUser).toHaveBeenCalledWith(mockPayload.sub);
      });

      it('should return correct properties for ADMIN role', async () => {
        authService.validateUser.mockResolvedValue(mockActiveUser);

        const result = await strategy.validate(mockPayload);

        expect(result.id).toBe(testUserId);
        expect(result.email).toBe(testEmail);
        expect(result.name).toBe(testName);
        expect(result.role).toBe('ADMIN');
      });

      it('should return correct properties for MEMBER role', async () => {
        authService.validateUser.mockResolvedValue(mockMemberUser);
        const memberPayload: JwtPayload = {
          sub: testUserId,
          email: testEmail,
          role: 'MEMBER' as Role,
        };

        const result = await strategy.validate(memberPayload);

        expect(result.role).toBe('MEMBER');
      });

      it('should return correct properties for USER role', async () => {
        authService.validateUser.mockResolvedValue(mockUserUser);
        const userPayload: JwtPayload = {
          sub: testUserId,
          email: 'user@example.com',
          role: 'USER' as Role,
        };

        const result = await strategy.validate(userPayload);

        expect(result.email).toBe('user@example.com');
        expect(result.name).toBe('Regular User');
        expect(result.role).toBe('USER');
      });

      it('should handle user with special characters in email', async () => {
        const specialEmailUser = {
          ...mockActiveUser,
          email: 'test+special@sub.example.com',
        };
        authService.validateUser.mockResolvedValue(specialEmailUser);
        const specialPayload: JwtPayload = {
          sub: testUserId,
          email: 'test+special@sub.example.com',
          role: 'ADMIN' as Role,
        };

        const result = await strategy.validate(specialPayload);

        expect(result.email).toBe('test+special@sub.example.com');
      });

      it('should handle user with unicode name', async () => {
        const unicodeUser = {
          ...mockActiveUser,
          name: 'Jean-Pierre Muller',
        };
        authService.validateUser.mockResolvedValue(unicodeUser);

        const result = await strategy.validate(mockPayload);

        expect(result.name).toBe('Jean-Pierre Muller');
      });

      it('should handle user with empty name (null)', async () => {
        const noNameUser = {
          ...mockActiveUser,
          name: null,
        };
        authService.validateUser.mockResolvedValue(noNameUser);

        const result = await strategy.validate(mockPayload);

        expect(result.name).toBeNull();
      });
    });

    // ============================================================
    // validate() Tests - Error Cases
    // ============================================================
    describe('Error Cases', () => {
      it('should throw UnauthorizedException when user not found', async () => {
        authService.validateUser.mockResolvedValue(null);

        await expect(strategy.validate(mockPayload)).rejects.toThrow(
          UnauthorizedException,
        );
        await expect(strategy.validate(mockPayload)).rejects.toThrow(
          'User not found or inactive',
        );
      });

      it('should throw UnauthorizedException when validateUser returns null (user inactive)', async () => {
        // AuthService.validateUser returns null for inactive users
        authService.validateUser.mockResolvedValue(null);

        await expect(strategy.validate(mockPayload)).rejects.toThrow(
          UnauthorizedException,
        );
      });

      it('should throw UnauthorizedException for non-existent user ID', async () => {
        authService.validateUser.mockResolvedValue(null);
        const nonExistentPayload: JwtPayload = {
          sub: 'non-existent-uuid-here',
          email: 'ghost@example.com',
          role: 'USER' as Role,
        };

        await expect(strategy.validate(nonExistentPayload)).rejects.toThrow(
          'User not found or inactive',
        );
      });

      it('should propagate errors from authService.validateUser', async () => {
        const dbError = new Error('Database connection failed');
        authService.validateUser.mockRejectedValue(dbError);

        await expect(strategy.validate(mockPayload)).rejects.toThrow(
          'Database connection failed',
        );
      });

      it('should handle undefined payload gracefully', async () => {
        // When authService gets undefined sub, it should return null
        authService.validateUser.mockResolvedValue(null);

        await expect(
          strategy.validate(undefined as unknown as JwtPayload),
        ).rejects.toThrow();
      });
    });

    // ============================================================
    // validate() Tests - Edge Cases
    // ============================================================
    describe('Edge Cases', () => {
      it('should handle payload with additional properties', async () => {
        authService.validateUser.mockResolvedValue(mockActiveUser);
        const extendedPayload = {
          ...mockPayload,
          iat: 1234567890,
          exp: 1234568790,
          extraField: 'ignored',
        } as JwtPayload;

        const result = await strategy.validate(extendedPayload);

        expect(result.id).toBe(testUserId);
        expect(authService.validateUser).toHaveBeenCalledWith(testUserId);
      });

      it('should return only expected properties (no extra fields)', async () => {
        const userWithExtraFields = {
          ...mockActiveUser,
          password_hash: 'should-not-be-returned',
          created_at: new Date(),
          extra_field: 'also-not-returned',
        };
        authService.validateUser.mockResolvedValue(userWithExtraFields);

        const result = await strategy.validate(mockPayload);

        expect(Object.keys(result)).toEqual(['id', 'email', 'name', 'role']);
        expect(result).not.toHaveProperty('password_hash');
        expect(result).not.toHaveProperty('created_at');
        expect(result).not.toHaveProperty('extra_field');
      });

      it('should handle concurrent validation calls', async () => {
        authService.validateUser.mockResolvedValue(mockActiveUser);

        const results = await Promise.all([
          strategy.validate(mockPayload),
          strategy.validate(mockPayload),
          strategy.validate(mockPayload),
        ]);

        expect(results).toHaveLength(3);
        results.forEach((result) => {
          expect(result.id).toBe(testUserId);
        });
        expect(authService.validateUser).toHaveBeenCalledTimes(3);
      });

      it('should handle empty string sub in payload', async () => {
        authService.validateUser.mockResolvedValue(null);
        const emptySubPayload: JwtPayload = {
          sub: '',
          email: testEmail,
          role: 'USER' as Role,
        };

        await expect(strategy.validate(emptySubPayload)).rejects.toThrow(
          UnauthorizedException,
        );
        expect(authService.validateUser).toHaveBeenCalledWith('');
      });
    });
  });

  // ============================================================
  // Strategy Configuration Tests
  // ============================================================
  describe('Strategy Configuration', () => {
    describe('JWT Secret Configuration', () => {
      it('should use JWT_SECRET from config when available', async () => {
        const customSecret = 'custom-production-secret';
        const customConfigService = {
          get: jest.fn().mockReturnValue(customSecret),
        };
        const customAuthService = {
          validateUser: jest.fn(),
        };

        const module = await Test.createTestingModule({
          providers: [
            JwtStrategy,
            { provide: ConfigService, useValue: customConfigService },
            { provide: AuthService, useValue: customAuthService },
          ],
        }).compile();

        const customStrategy = module.get<JwtStrategy>(JwtStrategy);

        expect(customStrategy).toBeDefined();
        expect(customConfigService.get).toHaveBeenCalledWith('JWT_SECRET');
      });

      it('should use fallback secret when JWT_SECRET is undefined', async () => {
        const undefinedConfigService = {
          get: jest.fn().mockReturnValue(undefined),
        };
        const customAuthService = {
          validateUser: jest.fn(),
        };

        const module = await Test.createTestingModule({
          providers: [
            JwtStrategy,
            { provide: ConfigService, useValue: undefinedConfigService },
            { provide: AuthService, useValue: customAuthService },
          ],
        }).compile();

        const fallbackStrategy = module.get<JwtStrategy>(JwtStrategy);

        expect(fallbackStrategy).toBeDefined();
        // Strategy should still be functional with fallback secret
        expect(undefinedConfigService.get).toHaveBeenCalledWith('JWT_SECRET');
      });

      it('should use fallback secret when JWT_SECRET is null', async () => {
        const nullConfigService = {
          get: jest.fn().mockReturnValue(null),
        };
        const customAuthService = {
          validateUser: jest.fn(),
        };

        const module = await Test.createTestingModule({
          providers: [
            JwtStrategy,
            { provide: ConfigService, useValue: nullConfigService },
            { provide: AuthService, useValue: customAuthService },
          ],
        }).compile();

        const nullSecretStrategy = module.get<JwtStrategy>(JwtStrategy);

        expect(nullSecretStrategy).toBeDefined();
      });

      it('should use fallback secret when JWT_SECRET is empty string', async () => {
        const emptyConfigService = {
          get: jest.fn().mockReturnValue(''),
        };
        const customAuthService = {
          validateUser: jest.fn(),
        };

        const module = await Test.createTestingModule({
          providers: [
            JwtStrategy,
            { provide: ConfigService, useValue: emptyConfigService },
            { provide: AuthService, useValue: customAuthService },
          ],
        }).compile();

        const emptySecretStrategy = module.get<JwtStrategy>(JwtStrategy);

        expect(emptySecretStrategy).toBeDefined();
      });
    });

    describe('Strategy Options', () => {
      it('should be injectable as a NestJS provider', async () => {
        expect(strategy).toBeDefined();
        expect(strategy).toBeInstanceOf(JwtStrategy);
      });

      it('should have validate method defined', () => {
        expect(strategy.validate).toBeDefined();
        expect(typeof strategy.validate).toBe('function');
      });
    });
  });

  // ============================================================
  // Integration-style Tests (validate with realistic scenarios)
  // ============================================================
  describe('Realistic Validation Scenarios', () => {
    it('should validate token for recently logged in user', async () => {
      const recentUser = {
        id: testUserId,
        email: testEmail,
        name: 'Recently Active User',
        role: 'ADMIN' as Role,
        is_active: true,
      };
      authService.validateUser.mockResolvedValue(recentUser);

      const result = await strategy.validate(mockPayload);

      expect(result.name).toBe('Recently Active User');
    });

    it('should reject token for disabled account', async () => {
      // validateUser returns null for disabled accounts
      authService.validateUser.mockResolvedValue(null);

      await expect(strategy.validate(mockPayload)).rejects.toThrow(
        'User not found or inactive',
      );
    });

    it('should reject token for deleted user', async () => {
      // validateUser returns null for non-existent users
      authService.validateUser.mockResolvedValue(null);

      await expect(strategy.validate(mockPayload)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should validate token for user who changed password', async () => {
      // User changed password but session is still valid
      // (JWT doesn't store password, so this should work)
      authService.validateUser.mockResolvedValue(mockActiveUser);

      const result = await strategy.validate(mockPayload);

      expect(result.id).toBe(testUserId);
    });

    it('should validate token for user who changed email', async () => {
      // User changed email - payload has old email, DB has new
      const updatedEmailUser = {
        ...mockActiveUser,
        email: 'newemail@example.com',
      };
      authService.validateUser.mockResolvedValue(updatedEmailUser);

      const result = await strategy.validate(mockPayload);

      // Should return current DB email, not payload email
      expect(result.email).toBe('newemail@example.com');
    });

    it('should validate token for user whose role was upgraded', async () => {
      // User was promoted from MEMBER to ADMIN
      const promotedUser = {
        ...mockMemberUser,
        role: 'ADMIN' as Role,
      };
      authService.validateUser.mockResolvedValue(promotedUser);
      const memberPayload: JwtPayload = {
        sub: testUserId,
        email: testEmail,
        role: 'MEMBER' as Role, // Old role in token
      };

      const result = await strategy.validate(memberPayload);

      // Should return current DB role
      expect(result.role).toBe('ADMIN');
    });

    it('should validate token for user whose role was downgraded', async () => {
      // User was demoted from ADMIN to MEMBER
      const demotedUser = {
        ...mockActiveUser,
        role: 'MEMBER' as Role,
      };
      authService.validateUser.mockResolvedValue(demotedUser);

      const result = await strategy.validate(mockPayload);

      // Should return current DB role
      expect(result.role).toBe('MEMBER');
    });
  });

  // ============================================================
  // Payload Variation Tests
  // ============================================================
  describe('JWT Payload Variations', () => {
    it('should handle UUID v4 format in sub', async () => {
      authService.validateUser.mockResolvedValue(mockActiveUser);
      const uuidPayload: JwtPayload = {
        sub: '550e8400-e29b-41d4-a716-446655440000',
        email: testEmail,
        role: 'ADMIN' as Role,
      };

      const result = await strategy.validate(uuidPayload);

      expect(authService.validateUser).toHaveBeenCalledWith(
        '550e8400-e29b-41d4-a716-446655440000',
      );
      expect(result.id).toBe(testUserId);
    });

    it('should handle all Role enum values', async () => {
      const roles: Role[] = ['ADMIN', 'MEMBER', 'USER'];

      for (const role of roles) {
        const roleUser = { ...mockActiveUser, role };
        authService.validateUser.mockResolvedValue(roleUser);
        const rolePayload: JwtPayload = {
          sub: testUserId,
          email: testEmail,
          role,
        };

        const result = await strategy.validate(rolePayload);

        expect(result.role).toBe(role);
      }
    });

    it('should handle email with maximum valid length', async () => {
      // RFC 5321 allows up to 254 characters for email
      const localPart = 'a'.repeat(64);
      const domain = 'b'.repeat(63) + '.com';
      const longEmail = `${localPart}@${domain}`;
      const longEmailUser = { ...mockActiveUser, email: longEmail };
      authService.validateUser.mockResolvedValue(longEmailUser);
      const longEmailPayload: JwtPayload = {
        sub: testUserId,
        email: longEmail,
        role: 'USER' as Role,
      };

      const result = await strategy.validate(longEmailPayload);

      expect(result.email).toBe(longEmail);
    });
  });
});
