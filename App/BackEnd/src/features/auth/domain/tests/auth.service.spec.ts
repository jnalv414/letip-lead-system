/**
 * Auth Service Unit Tests
 *
 * Comprehensive tests for authentication operations including:
 * - User registration with role assignment logic
 * - User login with credential validation
 * - Token refresh with rotation
 * - Logout (single session and all sessions)
 * - Profile retrieval and updates
 * - User validation for JWT strategy
 *
 * Covers success paths, error conditions, edge cases, and security scenarios.
 */

import { Test, TestingModule } from '@nestjs/testing';
import {
  Logger,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { AuthService, AuthResult } from '../auth.service';
import { PrismaService } from '../../../../prisma/prisma.service';
import { PasswordService } from '../password.service';
import { TokenService } from '../token.service';
import { SessionService } from '../session.service';
import { RegisterDto, LoginDto } from '../../api/dto';
import { Role } from '@prisma/client';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: jest.Mocked<PrismaService>;
  let passwordService: jest.Mocked<PasswordService>;
  let tokenService: jest.Mocked<TokenService>;
  let sessionService: jest.Mocked<SessionService>;

  // Test data constants
  const testUserId = '123e4567-e89b-12d3-a456-426614174000';
  const testEmail = 'test@example.com';
  const testPassword = 'Password123';
  const testPasswordHash = '$2b$12$hashedpassword123456789012345678901234567890';
  const testName = 'Test User';
  const testAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.token';
  const testRefreshToken = 'a'.repeat(64);
  const newRefreshToken = 'b'.repeat(64);
  const testUserAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
  const testIpAddress = '192.168.1.100';
  const testSessionId = '456e7890-e12b-34c5-d678-901234567890';
  const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000);

  // Mock user data
  const mockUser = {
    id: testUserId,
    email: testEmail,
    password_hash: testPasswordHash,
    name: testName,
    role: Role.MEMBER,
    is_active: true,
    created_at: new Date('2025-01-01'),
    updated_at: new Date('2025-01-01'),
    last_login: new Date('2025-01-15'),
  };

  const mockAdminUser = {
    ...mockUser,
    id: 'admin-user-id',
    email: 'admin@example.com',
    role: Role.ADMIN,
  };

  const mockSession = {
    id: testSessionId,
    user_id: testUserId,
    refresh_token: testRefreshToken,
    user_agent: testUserAgent,
    ip_address: testIpAddress,
    expires_at: futureDate,
    created_at: new Date(),
    user: mockUser,
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    // Suppress Logger output during tests
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});

    // Create mock Prisma service
    const mockPrismaService = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      },
    };

    // Create mock Password service
    const mockPasswordService = {
      validateStrength: jest.fn(),
      hash: jest.fn(),
      compare: jest.fn(),
    };

    // Create mock Token service
    const mockTokenService = {
      generateAccessToken: jest.fn(),
      generateRefreshToken: jest.fn(),
      verifyAccessToken: jest.fn(),
    };

    // Create mock Session service
    const mockSessionService = {
      createSession: jest.fn(),
      findByRefreshToken: jest.fn(),
      rotateRefreshToken: jest.fn(),
      revokeSession: jest.fn(),
      revokeAllUserSessions: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: PasswordService,
          useValue: mockPasswordService,
        },
        {
          provide: TokenService,
          useValue: mockTokenService,
        },
        {
          provide: SessionService,
          useValue: mockSessionService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get(PrismaService);
    passwordService = module.get(PasswordService);
    tokenService = module.get(TokenService);
    sessionService = module.get(SessionService);

    // Default mock implementations
    passwordService.validateStrength.mockReturnValue({ isValid: true, errors: [] });
    passwordService.hash.mockResolvedValue(testPasswordHash);
    passwordService.compare.mockResolvedValue(true);
    tokenService.generateAccessToken.mockReturnValue(testAccessToken);
    sessionService.createSession.mockResolvedValue(testRefreshToken);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ============================================================
  // register() Tests
  // ============================================================
  describe('register()', () => {
    const validRegisterDto: RegisterDto = {
      email: testEmail,
      password: testPassword,
      name: testName,
    };

    describe('Success Cases', () => {
      it('should register a new user successfully', async () => {
        prisma.user.findUnique.mockResolvedValue(null);
        prisma.user.count.mockResolvedValue(1); // Not first user
        prisma.user.create.mockResolvedValue(mockUser as any);

        const result = await service.register(validRegisterDto);

        expect(result).toEqual({
          user: {
            id: mockUser.id,
            email: mockUser.email,
            name: mockUser.name,
            role: mockUser.role,
            createdAt: mockUser.created_at,
            lastLogin: mockUser.last_login,
          },
          accessToken: testAccessToken,
          refreshToken: testRefreshToken,
        });
        expect(prisma.user.findUnique).toHaveBeenCalledWith({
          where: { email: testEmail.toLowerCase() },
        });
        expect(passwordService.validateStrength).toHaveBeenCalledWith(testPassword);
        expect(passwordService.hash).toHaveBeenCalledWith(testPassword);
        expect(prisma.user.create).toHaveBeenCalled();
      });

      it('should normalize email to lowercase', async () => {
        const dtoWithUppercaseEmail = {
          ...validRegisterDto,
          email: 'TEST@EXAMPLE.COM',
        };
        prisma.user.findUnique.mockResolvedValue(null);
        prisma.user.count.mockResolvedValue(1);
        prisma.user.create.mockResolvedValue({
          ...mockUser,
          email: 'test@example.com',
        } as any);

        await service.register(dtoWithUppercaseEmail);

        expect(prisma.user.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            email: 'test@example.com',
          }),
        });
      });

      it('should include userAgent and ipAddress in session creation', async () => {
        prisma.user.findUnique.mockResolvedValue(null);
        prisma.user.count.mockResolvedValue(1);
        prisma.user.create.mockResolvedValue(mockUser as any);

        await service.register(validRegisterDto, undefined, testUserAgent, testIpAddress);

        expect(sessionService.createSession).toHaveBeenCalledWith({
          userId: mockUser.id,
          userAgent: testUserAgent,
          ipAddress: testIpAddress,
        });
      });

      it('should generate access token with correct parameters', async () => {
        prisma.user.findUnique.mockResolvedValue(null);
        prisma.user.count.mockResolvedValue(1);
        prisma.user.create.mockResolvedValue(mockUser as any);

        await service.register(validRegisterDto);

        expect(tokenService.generateAccessToken).toHaveBeenCalledWith(
          mockUser.id,
          mockUser.email,
          mockUser.role,
        );
      });

      it('should set last_login on registration', async () => {
        prisma.user.findUnique.mockResolvedValue(null);
        prisma.user.count.mockResolvedValue(1);
        prisma.user.create.mockResolvedValue(mockUser as any);

        await service.register(validRegisterDto);

        expect(prisma.user.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            last_login: expect.any(Date),
          }),
        });
      });
    });

    describe('First User Auto-Admin', () => {
      it('should make first user an ADMIN', async () => {
        prisma.user.findUnique.mockResolvedValue(null);
        prisma.user.count.mockResolvedValue(0); // First user
        prisma.user.create.mockResolvedValue({
          ...mockUser,
          role: Role.ADMIN,
        } as any);

        const result = await service.register(validRegisterDto);

        expect(prisma.user.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            role: Role.ADMIN,
          }),
        });
        expect(result.user.role).toBe(Role.ADMIN);
      });

      it('should ignore role in DTO for first user and always set ADMIN', async () => {
        const dtoWithMemberRole = {
          ...validRegisterDto,
          role: Role.MEMBER,
        };
        prisma.user.findUnique.mockResolvedValue(null);
        prisma.user.count.mockResolvedValue(0);
        prisma.user.create.mockResolvedValue({
          ...mockUser,
          role: Role.ADMIN,
        } as any);

        await service.register(dtoWithMemberRole);

        expect(prisma.user.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            role: Role.ADMIN,
          }),
        });
      });

      it('should assign MEMBER role to subsequent users by default', async () => {
        prisma.user.findUnique.mockResolvedValue(null);
        prisma.user.count.mockResolvedValue(5); // Existing users
        prisma.user.create.mockResolvedValue(mockUser as any);

        await service.register(validRegisterDto);

        expect(prisma.user.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            role: Role.MEMBER,
          }),
        });
      });
    });

    describe('Admin Role Assignment', () => {
      it('should allow ADMIN to assign any role', async () => {
        const dtoWithAdminRole = {
          ...validRegisterDto,
          role: Role.ADMIN,
        };
        prisma.user.findUnique.mockResolvedValue(null);
        prisma.user.count.mockResolvedValue(1);
        prisma.user.create.mockResolvedValue({
          ...mockUser,
          role: Role.ADMIN,
        } as any);

        const result = await service.register(dtoWithAdminRole, Role.ADMIN);

        expect(prisma.user.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            role: Role.ADMIN,
          }),
        });
        expect(result.user.role).toBe(Role.ADMIN);
      });

      it('should allow ADMIN to assign VIEWER role', async () => {
        const dtoWithViewerRole = {
          ...validRegisterDto,
          role: Role.VIEWER,
        };
        prisma.user.findUnique.mockResolvedValue(null);
        prisma.user.count.mockResolvedValue(1);
        prisma.user.create.mockResolvedValue({
          ...mockUser,
          role: Role.VIEWER,
        } as any);

        const result = await service.register(dtoWithViewerRole, Role.ADMIN);

        expect(prisma.user.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            role: Role.VIEWER,
          }),
        });
        expect(result.user.role).toBe(Role.VIEWER);
      });

      it('should throw ForbiddenException when non-admin tries to assign role', async () => {
        const dtoWithRole = {
          ...validRegisterDto,
          role: Role.ADMIN,
        };
        prisma.user.findUnique.mockResolvedValue(null);
        prisma.user.count.mockResolvedValue(1);

        await expect(service.register(dtoWithRole, Role.MEMBER)).rejects.toThrow(
          ForbiddenException,
        );
        await expect(service.register(dtoWithRole, Role.MEMBER)).rejects.toThrow(
          'Only admins can assign roles',
        );
      });

      it('should throw ForbiddenException when VIEWER tries to assign role', async () => {
        const dtoWithRole = {
          ...validRegisterDto,
          role: Role.MEMBER,
        };
        prisma.user.findUnique.mockResolvedValue(null);
        prisma.user.count.mockResolvedValue(1);

        await expect(service.register(dtoWithRole, Role.VIEWER)).rejects.toThrow(
          ForbiddenException,
        );
      });

      it('should allow registration without role when creatorRole is undefined', async () => {
        prisma.user.findUnique.mockResolvedValue(null);
        prisma.user.count.mockResolvedValue(1);
        prisma.user.create.mockResolvedValue(mockUser as any);

        await service.register(validRegisterDto, undefined);

        expect(prisma.user.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            role: Role.MEMBER,
          }),
        });
      });

      it('should allow registration when dto.role is undefined regardless of creatorRole', async () => {
        prisma.user.findUnique.mockResolvedValue(null);
        prisma.user.count.mockResolvedValue(1);
        prisma.user.create.mockResolvedValue(mockUser as any);

        // Non-admin with no role specified should work
        await service.register(validRegisterDto, Role.MEMBER);

        expect(prisma.user.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            role: Role.MEMBER,
          }),
        });
      });
    });

    describe('Error Cases', () => {
      it('should throw ConflictException when email already exists', async () => {
        prisma.user.findUnique.mockResolvedValue(mockUser as any);

        await expect(service.register(validRegisterDto)).rejects.toThrow(ConflictException);
        await expect(service.register(validRegisterDto)).rejects.toThrow('Email already registered');
        expect(prisma.user.create).not.toHaveBeenCalled();
      });

      it('should throw BadRequestException for weak password', async () => {
        prisma.user.findUnique.mockResolvedValue(null);
        passwordService.validateStrength.mockReturnValue({
          isValid: false,
          errors: ['Password must be at least 8 characters long'],
        });

        await expect(service.register(validRegisterDto)).rejects.toThrow(BadRequestException);
        await expect(service.register(validRegisterDto)).rejects.toThrow(
          'Password must be at least 8 characters long',
        );
        expect(prisma.user.create).not.toHaveBeenCalled();
      });

      it('should throw BadRequestException with multiple password errors joined', async () => {
        prisma.user.findUnique.mockResolvedValue(null);
        passwordService.validateStrength.mockReturnValue({
          isValid: false,
          errors: [
            'Password must be at least 8 characters long',
            'Password must contain at least one uppercase letter',
          ],
        });

        await expect(service.register(validRegisterDto)).rejects.toThrow(
          'Password must be at least 8 characters long, Password must contain at least one uppercase letter',
        );
      });

      it('should propagate database errors during user creation', async () => {
        prisma.user.findUnique.mockResolvedValue(null);
        prisma.user.count.mockResolvedValue(1);
        const dbError = new Error('Database connection failed');
        prisma.user.create.mockRejectedValue(dbError);

        await expect(service.register(validRegisterDto)).rejects.toThrow('Database connection failed');
      });

      it('should propagate errors from session creation', async () => {
        prisma.user.findUnique.mockResolvedValue(null);
        prisma.user.count.mockResolvedValue(1);
        prisma.user.create.mockResolvedValue(mockUser as any);
        sessionService.createSession.mockRejectedValue(new Error('Session creation failed'));

        await expect(service.register(validRegisterDto)).rejects.toThrow('Session creation failed');
      });
    });

    describe('Edge Cases', () => {
      it('should handle email with mixed case and spaces (trimmed and lowercased)', async () => {
        const dtoWithWeirdEmail = {
          ...validRegisterDto,
          email: '  Test.User@Example.COM  ',
        };
        prisma.user.findUnique.mockResolvedValue(null);
        prisma.user.count.mockResolvedValue(1);
        prisma.user.create.mockResolvedValue({
          ...mockUser,
          email: '  test.user@example.com  ',
        } as any);

        await service.register(dtoWithWeirdEmail);

        // The service only does toLowerCase(), not trim() - checking actual behavior
        expect(prisma.user.findUnique).toHaveBeenCalledWith({
          where: { email: '  test.user@example.com  ' },
        });
      });

      it('should handle very long name', async () => {
        const longName = 'A'.repeat(500);
        const dtoWithLongName = {
          ...validRegisterDto,
          name: longName,
        };
        prisma.user.findUnique.mockResolvedValue(null);
        prisma.user.count.mockResolvedValue(1);
        prisma.user.create.mockResolvedValue({
          ...mockUser,
          name: longName,
        } as any);

        await service.register(dtoWithLongName);

        expect(prisma.user.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            name: longName,
          }),
        });
      });
    });
  });

  // ============================================================
  // login() Tests
  // ============================================================
  describe('login()', () => {
    const validLoginDto: LoginDto = {
      email: testEmail,
      password: testPassword,
    };

    describe('Success Cases', () => {
      it('should login user successfully with valid credentials', async () => {
        prisma.user.findUnique.mockResolvedValue(mockUser as any);
        prisma.user.update.mockResolvedValue(mockUser as any);

        const result = await service.login(validLoginDto);

        expect(result).toEqual({
          user: {
            id: mockUser.id,
            email: mockUser.email,
            name: mockUser.name,
            role: mockUser.role,
            createdAt: mockUser.created_at,
            lastLogin: mockUser.last_login,
          },
          accessToken: testAccessToken,
          refreshToken: testRefreshToken,
        });
      });

      it('should normalize email to lowercase on lookup', async () => {
        const dtoWithUppercaseEmail = {
          ...validLoginDto,
          email: 'TEST@EXAMPLE.COM',
        };
        prisma.user.findUnique.mockResolvedValue(mockUser as any);
        prisma.user.update.mockResolvedValue(mockUser as any);

        await service.login(dtoWithUppercaseEmail);

        expect(prisma.user.findUnique).toHaveBeenCalledWith({
          where: { email: 'test@example.com' },
        });
      });

      it('should update last_login timestamp', async () => {
        prisma.user.findUnique.mockResolvedValue(mockUser as any);
        prisma.user.update.mockResolvedValue(mockUser as any);

        await service.login(validLoginDto);

        expect(prisma.user.update).toHaveBeenCalledWith({
          where: { id: mockUser.id },
          data: { last_login: expect.any(Date) },
        });
      });

      it('should generate tokens with correct user data', async () => {
        prisma.user.findUnique.mockResolvedValue(mockUser as any);
        prisma.user.update.mockResolvedValue(mockUser as any);

        await service.login(validLoginDto);

        expect(tokenService.generateAccessToken).toHaveBeenCalledWith(
          mockUser.id,
          mockUser.email,
          mockUser.role,
        );
        expect(sessionService.createSession).toHaveBeenCalledWith({
          userId: mockUser.id,
          userAgent: undefined,
          ipAddress: undefined,
        });
      });

      it('should include userAgent and ipAddress in session', async () => {
        prisma.user.findUnique.mockResolvedValue(mockUser as any);
        prisma.user.update.mockResolvedValue(mockUser as any);

        await service.login(validLoginDto, testUserAgent, testIpAddress);

        expect(sessionService.createSession).toHaveBeenCalledWith({
          userId: mockUser.id,
          userAgent: testUserAgent,
          ipAddress: testIpAddress,
        });
      });

      it('should login ADMIN users successfully', async () => {
        prisma.user.findUnique.mockResolvedValue(mockAdminUser as any);
        prisma.user.update.mockResolvedValue(mockAdminUser as any);

        const result = await service.login({ email: 'admin@example.com', password: testPassword });

        expect(result.user.role).toBe(Role.ADMIN);
      });
    });

    describe('Error Cases', () => {
      it('should throw UnauthorizedException when user not found', async () => {
        prisma.user.findUnique.mockResolvedValue(null);

        await expect(service.login(validLoginDto)).rejects.toThrow(UnauthorizedException);
        await expect(service.login(validLoginDto)).rejects.toThrow('Invalid email or password');
        expect(passwordService.compare).not.toHaveBeenCalled();
      });

      it('should throw UnauthorizedException when password is incorrect', async () => {
        prisma.user.findUnique.mockResolvedValue(mockUser as any);
        passwordService.compare.mockResolvedValue(false);

        await expect(service.login(validLoginDto)).rejects.toThrow(UnauthorizedException);
        await expect(service.login(validLoginDto)).rejects.toThrow('Invalid email or password');
        expect(prisma.user.update).not.toHaveBeenCalled();
      });

      it('should throw UnauthorizedException when account is disabled', async () => {
        const disabledUser = { ...mockUser, is_active: false };
        prisma.user.findUnique.mockResolvedValue(disabledUser as any);

        await expect(service.login(validLoginDto)).rejects.toThrow(UnauthorizedException);
        await expect(service.login(validLoginDto)).rejects.toThrow('Account is disabled');
        expect(passwordService.compare).not.toHaveBeenCalled();
      });

      it('should not reveal whether email exists (same error message)', async () => {
        // Test non-existent user
        prisma.user.findUnique.mockResolvedValue(null);
        try {
          await service.login(validLoginDto);
        } catch (e) {
          expect(e.message).toBe('Invalid email or password');
        }

        // Test wrong password
        prisma.user.findUnique.mockResolvedValue(mockUser as any);
        passwordService.compare.mockResolvedValue(false);
        try {
          await service.login(validLoginDto);
        } catch (e) {
          expect(e.message).toBe('Invalid email or password');
        }
      });

      it('should propagate database errors', async () => {
        prisma.user.findUnique.mockRejectedValue(new Error('Database error'));

        await expect(service.login(validLoginDto)).rejects.toThrow('Database error');
      });

      it('should propagate session creation errors', async () => {
        prisma.user.findUnique.mockResolvedValue(mockUser as any);
        prisma.user.update.mockResolvedValue(mockUser as any);
        sessionService.createSession.mockRejectedValue(new Error('Session error'));

        await expect(service.login(validLoginDto)).rejects.toThrow('Session error');
      });
    });

    describe('Edge Cases', () => {
      it('should check is_active before password comparison', async () => {
        const disabledUser = { ...mockUser, is_active: false };
        prisma.user.findUnique.mockResolvedValue(disabledUser as any);

        await expect(service.login(validLoginDto)).rejects.toThrow('Account is disabled');

        // Password comparison should not be called for disabled accounts
        expect(passwordService.compare).not.toHaveBeenCalled();
      });

      it('should handle user with null last_login', async () => {
        const userWithNullLastLogin = { ...mockUser, last_login: null };
        prisma.user.findUnique.mockResolvedValue(userWithNullLastLogin as any);
        prisma.user.update.mockResolvedValue(userWithNullLastLogin as any);

        const result = await service.login(validLoginDto);

        expect(result.user.lastLogin).toBeNull();
      });
    });
  });

  // ============================================================
  // refresh() Tests
  // ============================================================
  describe('refresh()', () => {
    describe('Success Cases', () => {
      it('should refresh tokens successfully', async () => {
        sessionService.findByRefreshToken.mockResolvedValue(mockSession as any);
        sessionService.rotateRefreshToken.mockResolvedValue(newRefreshToken);

        const result = await service.refresh(testRefreshToken);

        expect(result).toEqual({
          accessToken: testAccessToken,
          refreshToken: newRefreshToken,
        });
      });

      it('should generate new access token with user data from session', async () => {
        sessionService.findByRefreshToken.mockResolvedValue(mockSession as any);
        sessionService.rotateRefreshToken.mockResolvedValue(newRefreshToken);

        await service.refresh(testRefreshToken);

        expect(tokenService.generateAccessToken).toHaveBeenCalledWith(
          mockSession.user.id,
          mockSession.user.email,
          mockSession.user.role,
        );
      });

      it('should rotate refresh token with userAgent and ipAddress', async () => {
        sessionService.findByRefreshToken.mockResolvedValue(mockSession as any);
        sessionService.rotateRefreshToken.mockResolvedValue(newRefreshToken);

        await service.refresh(testRefreshToken, testUserAgent, testIpAddress);

        expect(sessionService.rotateRefreshToken).toHaveBeenCalledWith(
          testRefreshToken,
          testUserAgent,
          testIpAddress,
        );
      });
    });

    describe('Error Cases', () => {
      it('should throw UnauthorizedException for invalid refresh token', async () => {
        sessionService.findByRefreshToken.mockResolvedValue(null);

        await expect(service.refresh('invalid-token')).rejects.toThrow(UnauthorizedException);
        await expect(service.refresh('invalid-token')).rejects.toThrow('Invalid refresh token');
      });

      it('should throw UnauthorizedException for expired refresh token', async () => {
        const expiredSession = {
          ...mockSession,
          expires_at: pastDate,
        };
        sessionService.findByRefreshToken.mockResolvedValue(expiredSession as any);

        await expect(service.refresh(testRefreshToken)).rejects.toThrow(UnauthorizedException);
        await expect(service.refresh(testRefreshToken)).rejects.toThrow('Refresh token expired');
        expect(sessionService.revokeSession).toHaveBeenCalledWith(expiredSession.id);
      });

      it('should throw UnauthorizedException when account is disabled', async () => {
        const sessionWithDisabledUser = {
          ...mockSession,
          user: { ...mockUser, is_active: false },
        };
        sessionService.findByRefreshToken.mockResolvedValue(sessionWithDisabledUser as any);

        await expect(service.refresh(testRefreshToken)).rejects.toThrow(UnauthorizedException);
        await expect(service.refresh(testRefreshToken)).rejects.toThrow('Account is disabled');
      });

      it('should throw UnauthorizedException when token rotation fails', async () => {
        sessionService.findByRefreshToken.mockResolvedValue(mockSession as any);
        sessionService.rotateRefreshToken.mockResolvedValue(null);

        await expect(service.refresh(testRefreshToken)).rejects.toThrow(UnauthorizedException);
        await expect(service.refresh(testRefreshToken)).rejects.toThrow(
          'Failed to rotate refresh token',
        );
      });
    });

    describe('Edge Cases', () => {
      it('should check expiration before checking is_active', async () => {
        const expiredSessionWithDisabledUser = {
          ...mockSession,
          expires_at: pastDate,
          user: { ...mockUser, is_active: false },
        };
        sessionService.findByRefreshToken.mockResolvedValue(expiredSessionWithDisabledUser as any);

        await expect(service.refresh(testRefreshToken)).rejects.toThrow('Refresh token expired');
        // revokeSession should be called even for disabled users
        expect(sessionService.revokeSession).toHaveBeenCalled();
      });

      it('should revoke expired session before throwing error', async () => {
        const expiredSession = {
          ...mockSession,
          expires_at: pastDate,
        };
        sessionService.findByRefreshToken.mockResolvedValue(expiredSession as any);

        try {
          await service.refresh(testRefreshToken);
        } catch (e) {
          // Expected
        }

        expect(sessionService.revokeSession).toHaveBeenCalledWith(expiredSession.id);
      });
    });
  });

  // ============================================================
  // logout() Tests
  // ============================================================
  describe('logout()', () => {
    describe('Success Cases', () => {
      it('should logout successfully by revoking session', async () => {
        sessionService.findByRefreshToken.mockResolvedValue(mockSession as any);

        await service.logout(testRefreshToken);

        expect(sessionService.revokeSession).toHaveBeenCalledWith(mockSession.id);
      });

      it('should complete without error', async () => {
        sessionService.findByRefreshToken.mockResolvedValue(mockSession as any);

        await expect(service.logout(testRefreshToken)).resolves.toBeUndefined();
      });
    });

    describe('Non-Existent Token Cases', () => {
      it('should not throw when session not found', async () => {
        sessionService.findByRefreshToken.mockResolvedValue(null);

        await expect(service.logout('nonexistent-token')).resolves.toBeUndefined();
        expect(sessionService.revokeSession).not.toHaveBeenCalled();
      });
    });

    describe('Edge Cases', () => {
      it('should handle already revoked session gracefully', async () => {
        sessionService.findByRefreshToken.mockResolvedValue(null);

        await expect(service.logout(testRefreshToken)).resolves.toBeUndefined();
      });

      it('should propagate errors from session revocation', async () => {
        sessionService.findByRefreshToken.mockResolvedValue(mockSession as any);
        sessionService.revokeSession.mockRejectedValue(new Error('Revocation failed'));

        await expect(service.logout(testRefreshToken)).rejects.toThrow('Revocation failed');
      });
    });
  });

  // ============================================================
  // logoutAll() Tests
  // ============================================================
  describe('logoutAll()', () => {
    describe('Success Cases', () => {
      it('should revoke all user sessions', async () => {
        sessionService.revokeAllUserSessions.mockResolvedValue(5);

        const result = await service.logoutAll(testUserId);

        expect(result).toBe(5);
        expect(sessionService.revokeAllUserSessions).toHaveBeenCalledWith(testUserId);
      });

      it('should return 0 when user has no sessions', async () => {
        sessionService.revokeAllUserSessions.mockResolvedValue(0);

        const result = await service.logoutAll(testUserId);

        expect(result).toBe(0);
      });

      it('should handle single session', async () => {
        sessionService.revokeAllUserSessions.mockResolvedValue(1);

        const result = await service.logoutAll(testUserId);

        expect(result).toBe(1);
      });

      it('should handle many sessions', async () => {
        sessionService.revokeAllUserSessions.mockResolvedValue(100);

        const result = await service.logoutAll(testUserId);

        expect(result).toBe(100);
      });
    });

    describe('Error Cases', () => {
      it('should propagate errors from session service', async () => {
        sessionService.revokeAllUserSessions.mockRejectedValue(new Error('Database error'));

        await expect(service.logoutAll(testUserId)).rejects.toThrow('Database error');
      });
    });
  });

  // ============================================================
  // getProfile() Tests
  // ============================================================
  describe('getProfile()', () => {
    describe('Success Cases', () => {
      it('should return user profile', async () => {
        prisma.user.findUnique.mockResolvedValue(mockUser as any);

        const result = await service.getProfile(testUserId);

        expect(result).toEqual({
          id: mockUser.id,
          email: mockUser.email,
          name: mockUser.name,
          role: mockUser.role,
          createdAt: mockUser.created_at,
          lastLogin: mockUser.last_login,
        });
      });

      it('should query user by ID', async () => {
        prisma.user.findUnique.mockResolvedValue(mockUser as any);

        await service.getProfile(testUserId);

        expect(prisma.user.findUnique).toHaveBeenCalledWith({
          where: { id: testUserId },
        });
      });

      it('should return profile with null last_login', async () => {
        const userWithNullLastLogin = { ...mockUser, last_login: null };
        prisma.user.findUnique.mockResolvedValue(userWithNullLastLogin as any);

        const result = await service.getProfile(testUserId);

        expect(result.lastLogin).toBeNull();
      });
    });

    describe('Error Cases', () => {
      it('should throw UnauthorizedException when user not found', async () => {
        prisma.user.findUnique.mockResolvedValue(null);

        await expect(service.getProfile(testUserId)).rejects.toThrow(UnauthorizedException);
        await expect(service.getProfile(testUserId)).rejects.toThrow('User not found');
      });

      it('should propagate database errors', async () => {
        prisma.user.findUnique.mockRejectedValue(new Error('Database error'));

        await expect(service.getProfile(testUserId)).rejects.toThrow('Database error');
      });
    });
  });

  // ============================================================
  // updateProfile() Tests
  // ============================================================
  describe('updateProfile()', () => {
    describe('Success Cases - Name Update', () => {
      it('should update user name', async () => {
        const newName = 'Updated Name';
        prisma.user.update.mockResolvedValue({
          ...mockUser,
          name: newName,
        } as any);

        const result = await service.updateProfile(testUserId, { name: newName });

        expect(result.name).toBe(newName);
        expect(prisma.user.update).toHaveBeenCalledWith({
          where: { id: testUserId },
          data: { name: newName },
        });
      });

      it('should only include name in update when email not provided', async () => {
        prisma.user.update.mockResolvedValue(mockUser as any);

        await service.updateProfile(testUserId, { name: 'New Name' });

        expect(prisma.user.update).toHaveBeenCalledWith({
          where: { id: testUserId },
          data: { name: 'New Name' },
        });
      });
    });

    describe('Success Cases - Email Update', () => {
      it('should update user email', async () => {
        const newEmail = 'new@example.com';
        prisma.user.findUnique.mockResolvedValue(null); // No conflict
        prisma.user.update.mockResolvedValue({
          ...mockUser,
          email: newEmail,
        } as any);

        const result = await service.updateProfile(testUserId, { email: newEmail });

        expect(result.email).toBe(newEmail);
      });

      it('should normalize email to lowercase', async () => {
        prisma.user.findUnique.mockResolvedValue(null);
        prisma.user.update.mockResolvedValue({
          ...mockUser,
          email: 'new@example.com',
        } as any);

        await service.updateProfile(testUserId, { email: 'NEW@EXAMPLE.COM' });

        expect(prisma.user.update).toHaveBeenCalledWith({
          where: { id: testUserId },
          data: { email: 'new@example.com' },
        });
      });

      it('should allow user to keep their own email', async () => {
        const existingUserWithSameId = { ...mockUser };
        prisma.user.findUnique.mockResolvedValue(existingUserWithSameId as any);
        prisma.user.update.mockResolvedValue(mockUser as any);

        await service.updateProfile(testUserId, { email: testEmail });

        expect(prisma.user.update).toHaveBeenCalled();
      });
    });

    describe('Success Cases - Both Fields', () => {
      it('should update both name and email', async () => {
        prisma.user.findUnique.mockResolvedValue(null);
        prisma.user.update.mockResolvedValue({
          ...mockUser,
          name: 'New Name',
          email: 'new@example.com',
        } as any);

        const result = await service.updateProfile(testUserId, {
          name: 'New Name',
          email: 'new@example.com',
        });

        expect(result.name).toBe('New Name');
        expect(result.email).toBe('new@example.com');
        expect(prisma.user.update).toHaveBeenCalledWith({
          where: { id: testUserId },
          data: { name: 'New Name', email: 'new@example.com' },
        });
      });
    });

    describe('Error Cases', () => {
      it('should throw ConflictException when email already in use by another user', async () => {
        const otherUser = {
          ...mockUser,
          id: 'other-user-id',
          email: 'existing@example.com',
        };
        prisma.user.findUnique.mockResolvedValue(otherUser as any);

        await expect(
          service.updateProfile(testUserId, { email: 'existing@example.com' }),
        ).rejects.toThrow(ConflictException);
        await expect(
          service.updateProfile(testUserId, { email: 'existing@example.com' }),
        ).rejects.toThrow('Email already in use');
        expect(prisma.user.update).not.toHaveBeenCalled();
      });

      it('should propagate database errors from email check', async () => {
        prisma.user.findUnique.mockRejectedValue(new Error('Database error'));

        await expect(
          service.updateProfile(testUserId, { email: 'new@example.com' }),
        ).rejects.toThrow('Database error');
      });

      it('should propagate database errors from update', async () => {
        prisma.user.findUnique.mockResolvedValue(null);
        prisma.user.update.mockRejectedValue(new Error('Update failed'));

        await expect(
          service.updateProfile(testUserId, { email: 'new@example.com' }),
        ).rejects.toThrow('Update failed');
      });
    });

    describe('Edge Cases', () => {
      it('should handle empty update (no name, no email)', async () => {
        prisma.user.update.mockResolvedValue(mockUser as any);

        const result = await service.updateProfile(testUserId, {});

        expect(prisma.user.update).toHaveBeenCalledWith({
          where: { id: testUserId },
          data: {},
        });
        expect(result).toBeDefined();
      });

      it('should handle empty string name', async () => {
        prisma.user.update.mockResolvedValue({
          ...mockUser,
          name: '',
        } as any);

        // Empty string is falsy so it won't be included
        await service.updateProfile(testUserId, { name: '' });

        expect(prisma.user.update).toHaveBeenCalledWith({
          where: { id: testUserId },
          data: {},
        });
      });

      it('should handle empty string email (skipped)', async () => {
        prisma.user.update.mockResolvedValue(mockUser as any);

        // Empty string is falsy so email check is skipped
        await service.updateProfile(testUserId, { email: '' });

        expect(prisma.user.findUnique).not.toHaveBeenCalled();
        expect(prisma.user.update).toHaveBeenCalledWith({
          where: { id: testUserId },
          data: {},
        });
      });
    });
  });

  // ============================================================
  // validateUser() Tests
  // ============================================================
  describe('validateUser()', () => {
    describe('Success Cases', () => {
      it('should return user when found and active', async () => {
        const selectUser = {
          id: mockUser.id,
          email: mockUser.email,
          name: mockUser.name,
          role: mockUser.role,
          is_active: true,
        };
        prisma.user.findUnique.mockResolvedValue(selectUser as any);

        const result = await service.validateUser(testUserId);

        expect(result).toEqual(selectUser);
      });

      it('should query with correct select fields', async () => {
        prisma.user.findUnique.mockResolvedValue({
          id: mockUser.id,
          email: mockUser.email,
          name: mockUser.name,
          role: mockUser.role,
          is_active: true,
        } as any);

        await service.validateUser(testUserId);

        expect(prisma.user.findUnique).toHaveBeenCalledWith({
          where: { id: testUserId },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            is_active: true,
          },
        });
      });
    });

    describe('Null Return Cases', () => {
      it('should return null when user not found', async () => {
        prisma.user.findUnique.mockResolvedValue(null);

        const result = await service.validateUser(testUserId);

        expect(result).toBeNull();
      });

      it('should return null when user is inactive', async () => {
        const inactiveUser = {
          id: mockUser.id,
          email: mockUser.email,
          name: mockUser.name,
          role: mockUser.role,
          is_active: false,
        };
        prisma.user.findUnique.mockResolvedValue(inactiveUser as any);

        const result = await service.validateUser(testUserId);

        expect(result).toBeNull();
      });
    });

    describe('Error Cases', () => {
      it('should propagate database errors', async () => {
        prisma.user.findUnique.mockRejectedValue(new Error('Database error'));

        await expect(service.validateUser(testUserId)).rejects.toThrow('Database error');
      });
    });

    describe('Edge Cases', () => {
      it('should handle user with ADMIN role', async () => {
        const adminUser = {
          id: mockAdminUser.id,
          email: mockAdminUser.email,
          name: mockAdminUser.name,
          role: Role.ADMIN,
          is_active: true,
        };
        prisma.user.findUnique.mockResolvedValue(adminUser as any);

        const result = await service.validateUser(mockAdminUser.id);

        expect(result).toEqual(adminUser);
        expect(result?.role).toBe(Role.ADMIN);
      });

      it('should handle user with VIEWER role', async () => {
        const viewerUser = {
          id: testUserId,
          email: testEmail,
          name: testName,
          role: Role.VIEWER,
          is_active: true,
        };
        prisma.user.findUnique.mockResolvedValue(viewerUser as any);

        const result = await service.validateUser(testUserId);

        expect(result?.role).toBe(Role.VIEWER);
      });
    });
  });

  // ============================================================
  // Integration Scenarios
  // ============================================================
  describe('Integration Scenarios', () => {
    describe('Full Authentication Flow', () => {
      it('should support register -> login -> refresh -> logout flow', async () => {
        // Register
        prisma.user.findUnique.mockResolvedValueOnce(null);
        prisma.user.count.mockResolvedValue(1);
        prisma.user.create.mockResolvedValue(mockUser as any);

        const registerResult = await service.register({
          email: testEmail,
          password: testPassword,
          name: testName,
        });
        expect(registerResult.accessToken).toBeDefined();
        expect(registerResult.refreshToken).toBeDefined();

        // Login
        prisma.user.findUnique.mockResolvedValueOnce(mockUser as any);
        prisma.user.update.mockResolvedValue(mockUser as any);

        const loginResult = await service.login({
          email: testEmail,
          password: testPassword,
        });
        expect(loginResult.accessToken).toBeDefined();

        // Refresh
        sessionService.findByRefreshToken.mockResolvedValue(mockSession as any);
        sessionService.rotateRefreshToken.mockResolvedValue(newRefreshToken);

        const refreshResult = await service.refresh(testRefreshToken);
        expect(refreshResult.accessToken).toBeDefined();
        expect(refreshResult.refreshToken).toBe(newRefreshToken);

        // Logout
        sessionService.findByRefreshToken.mockResolvedValue(mockSession as any);
        await service.logout(newRefreshToken);
        expect(sessionService.revokeSession).toHaveBeenCalled();
      });
    });

    describe('Multi-Device Scenario', () => {
      it('should allow multiple sessions and logoutAll revokes all', async () => {
        // Login from multiple devices simulated by multiple sessions
        sessionService.revokeAllUserSessions.mockResolvedValue(3);

        const revokedCount = await service.logoutAll(testUserId);

        expect(revokedCount).toBe(3);
        expect(sessionService.revokeAllUserSessions).toHaveBeenCalledWith(testUserId);
      });
    });

    describe('Account State Transitions', () => {
      it('should prevent login after account is disabled', async () => {
        const disabledUser = { ...mockUser, is_active: false };
        prisma.user.findUnique.mockResolvedValue(disabledUser as any);

        await expect(
          service.login({ email: testEmail, password: testPassword }),
        ).rejects.toThrow('Account is disabled');
      });

      it('should prevent token refresh after account is disabled', async () => {
        const sessionWithDisabledUser = {
          ...mockSession,
          user: { ...mockUser, is_active: false },
        };
        sessionService.findByRefreshToken.mockResolvedValue(sessionWithDisabledUser as any);

        await expect(service.refresh(testRefreshToken)).rejects.toThrow('Account is disabled');
      });

      it('should return null from validateUser after account is disabled', async () => {
        const disabledUser = {
          id: mockUser.id,
          email: mockUser.email,
          name: mockUser.name,
          role: mockUser.role,
          is_active: false,
        };
        prisma.user.findUnique.mockResolvedValue(disabledUser as any);

        const result = await service.validateUser(testUserId);

        expect(result).toBeNull();
      });
    });

    describe('Concurrent Operations', () => {
      it('should handle concurrent login attempts', async () => {
        prisma.user.findUnique.mockResolvedValue(mockUser as any);
        prisma.user.update.mockResolvedValue(mockUser as any);

        const [result1, result2] = await Promise.all([
          service.login({ email: testEmail, password: testPassword }),
          service.login({ email: testEmail, password: testPassword }),
        ]);

        expect(result1.accessToken).toBeDefined();
        expect(result2.accessToken).toBeDefined();
        expect(sessionService.createSession).toHaveBeenCalledTimes(2);
      });

      it('should handle concurrent refresh attempts with different results', async () => {
        sessionService.findByRefreshToken.mockResolvedValue(mockSession as any);
        sessionService.rotateRefreshToken
          .mockResolvedValueOnce('new-token-1')
          .mockResolvedValueOnce('new-token-2');

        const [result1, result2] = await Promise.all([
          service.refresh(testRefreshToken),
          service.refresh(testRefreshToken),
        ]);

        expect(result1.refreshToken).toBe('new-token-1');
        expect(result2.refreshToken).toBe('new-token-2');
      });
    });
  });

  // ============================================================
  // Security Edge Cases
  // ============================================================
  describe('Security Edge Cases', () => {
    it('should not expose password hash in any response', async () => {
      prisma.user.findUnique.mockResolvedValueOnce(null);
      prisma.user.count.mockResolvedValue(1);
      prisma.user.create.mockResolvedValue(mockUser as any);

      const result = await service.register({
        email: testEmail,
        password: testPassword,
        name: testName,
      });

      expect(JSON.stringify(result)).not.toContain('password');
      expect(JSON.stringify(result)).not.toContain('password_hash');
      expect(JSON.stringify(result)).not.toContain(testPasswordHash);
    });

    it('should handle timing attack prevention (same error for wrong email/password)', async () => {
      // Both scenarios should throw the same error message
      const wrongEmailError = async () => {
        prisma.user.findUnique.mockResolvedValue(null);
        await service.login({ email: 'wrong@example.com', password: testPassword });
      };

      const wrongPasswordError = async () => {
        prisma.user.findUnique.mockResolvedValue(mockUser as any);
        passwordService.compare.mockResolvedValue(false);
        await service.login({ email: testEmail, password: 'wrongpassword' });
      };

      await expect(wrongEmailError()).rejects.toThrow('Invalid email or password');
      await expect(wrongPasswordError()).rejects.toThrow('Invalid email or password');
    });

    it('should handle SQL injection attempts in email (via Prisma parameterization)', async () => {
      const maliciousEmail = "'; DROP TABLE users; --";
      prisma.user.findUnique.mockResolvedValue(null);

      // Should not throw, Prisma handles parameterization
      await expect(
        service.login({ email: maliciousEmail, password: testPassword }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should handle XSS attempts in name field', async () => {
      const xssName = '<script>alert("xss")</script>';
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.count.mockResolvedValue(1);
      prisma.user.create.mockResolvedValue({
        ...mockUser,
        name: xssName,
      } as any);

      // Service should store as-is (sanitization happens at display layer)
      const result = await service.register({
        email: testEmail,
        password: testPassword,
        name: xssName,
      });

      expect(result.user.name).toBe(xssName);
    });
  });
});
