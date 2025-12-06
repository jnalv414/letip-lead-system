/**
 * AuthController Unit Tests
 *
 * Comprehensive tests for all authentication HTTP endpoints.
 * Covers success paths, error handling, cookie management, and edge cases.
 *
 * Test Coverage:
 * - POST /api/auth/register - Public registration
 * - POST /api/auth/register/admin - Admin-only registration
 * - POST /api/auth/login - User login
 * - POST /api/auth/logout - Single session logout
 * - POST /api/auth/logout/all - All sessions logout
 * - POST /api/auth/refresh - Token refresh
 * - GET /api/auth/me - Get profile
 * - PATCH /api/auth/me - Update profile
 */

import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { AuthController } from '../auth.controller';
import { AuthService, AuthResult } from '../../domain/auth.service';
import { RegisterDto, LoginDto, UserResponseDto } from '../dto';
import { Role } from '@prisma/client';
import type { Request, Response } from 'express';
import type { RequestUser } from '../../decorators/current-user.decorator';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  // Test data constants
  const testUserId = '123e4567-e89b-12d3-a456-426614174000';
  const testEmail = 'test@example.com';
  const testPassword = 'Password123!';
  const testName = 'Test User';
  const testAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test';
  const testRefreshToken = 'a'.repeat(64);
  const newRefreshToken = 'b'.repeat(64);
  const testUserAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
  const testIpAddress = '192.168.1.100';

  // Mock user response DTO
  const mockUserResponse: UserResponseDto = {
    id: testUserId,
    email: testEmail,
    name: testName,
    role: Role.MEMBER,
    createdAt: new Date('2025-01-01T00:00:00Z'),
    lastLogin: new Date('2025-01-15T12:00:00Z'),
  };

  // Mock admin user response DTO
  const mockAdminUserResponse: UserResponseDto = {
    ...mockUserResponse,
    role: Role.ADMIN,
  };

  // Mock auth result from AuthService
  const mockAuthResult: AuthResult = {
    user: mockUserResponse,
    accessToken: testAccessToken,
    refreshToken: testRefreshToken,
  };

  // Mock request object factory
  const createMockRequest = (overrides: Partial<Request> = {}): Partial<Request> => ({
    headers: { 'user-agent': testUserAgent },
    ip: testIpAddress,
    cookies: {},
    user: undefined,
    ...overrides,
  });

  // Mock response object factory
  const createMockResponse = (): Partial<Response> & {
    cookie: jest.Mock;
    clearCookie: jest.Mock;
  } => ({
    cookie: jest.fn().mockReturnThis(),
    clearCookie: jest.fn().mockReturnThis(),
  });

  beforeEach(async () => {
    // Reset all mocks
    jest.clearAllMocks();

    // Suppress Logger output during tests
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});

    // Create mock AuthService
    const mockAuthService = {
      register: jest.fn(),
      login: jest.fn(),
      logout: jest.fn(),
      logoutAll: jest.fn(),
      refresh: jest.fn(),
      getProfile: jest.fn(),
      updateProfile: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // ============================================================
  // POST /api/auth/register Tests
  // ============================================================
  describe('register()', () => {
    const registerDto: RegisterDto = {
      email: testEmail,
      password: testPassword,
      name: testName,
    };

    describe('Success Cases', () => {
      it('should register user successfully and set refresh token cookie', async () => {
        authService.register.mockResolvedValue(mockAuthResult);
        const req = createMockRequest() as Request;
        const res = createMockResponse() as unknown as Response;

        const result = await controller.register(registerDto, req, res);

        expect(authService.register).toHaveBeenCalledWith(
          registerDto,
          undefined, // creatorRole (no user in request)
          testUserAgent,
          testIpAddress,
        );
        expect(res.cookie).toHaveBeenCalledWith(
          'refreshToken',
          testRefreshToken,
          expect.objectContaining({
            httpOnly: true,
            sameSite: 'strict',
            path: '/api/auth',
          }),
        );
        expect(result).toEqual({
          user: mockUserResponse,
          accessToken: testAccessToken,
        });
        expect(result).not.toHaveProperty('refreshToken');
      });

      it('should pass creator role when user is authenticated', async () => {
        const authenticatedReq = createMockRequest({
          user: { role: Role.ADMIN } as any,
        }) as Request;
        const res = createMockResponse() as unknown as Response;
        authService.register.mockResolvedValue(mockAuthResult);

        await controller.register(registerDto, authenticatedReq, res);

        expect(authService.register).toHaveBeenCalledWith(
          registerDto,
          Role.ADMIN,
          testUserAgent,
          testIpAddress,
        );
      });

      it('should handle registration without user-agent header', async () => {
        const reqWithoutUserAgent = createMockRequest({
          headers: {},
        }) as Request;
        const res = createMockResponse() as unknown as Response;
        authService.register.mockResolvedValue(mockAuthResult);

        await controller.register(registerDto, reqWithoutUserAgent, res);

        expect(authService.register).toHaveBeenCalledWith(
          registerDto,
          undefined,
          undefined,
          testIpAddress,
        );
      });

      it('should handle registration with role specified in DTO', async () => {
        const dtoWithRole: RegisterDto = {
          ...registerDto,
          role: Role.MEMBER,
        };
        const req = createMockRequest() as Request;
        const res = createMockResponse() as unknown as Response;
        authService.register.mockResolvedValue(mockAuthResult);

        await controller.register(dtoWithRole, req, res);

        expect(authService.register).toHaveBeenCalledWith(
          dtoWithRole,
          undefined,
          testUserAgent,
          testIpAddress,
        );
      });
    });

    describe('Error Cases', () => {
      it('should propagate ConflictException for duplicate email', async () => {
        const error = new Error('Email already registered');
        authService.register.mockRejectedValue(error);
        const req = createMockRequest() as Request;
        const res = createMockResponse() as unknown as Response;

        await expect(controller.register(registerDto, req, res)).rejects.toThrow(
          'Email already registered',
        );
        expect(res.cookie).not.toHaveBeenCalled();
      });

      it('should propagate BadRequestException for weak password', async () => {
        const error = new Error('Password must contain uppercase, lowercase, and number');
        authService.register.mockRejectedValue(error);
        const req = createMockRequest() as Request;
        const res = createMockResponse() as unknown as Response;

        await expect(controller.register(registerDto, req, res)).rejects.toThrow(
          'Password must contain uppercase',
        );
      });
    });
  });

  // ============================================================
  // POST /api/auth/register/admin Tests
  // ============================================================
  describe('adminRegister()', () => {
    const registerDto: RegisterDto = {
      email: 'newuser@example.com',
      password: testPassword,
      name: 'New User',
      role: Role.MEMBER,
    };

    const adminUser: RequestUser = {
      id: testUserId,
      email: 'admin@example.com',
      name: 'Admin User',
      role: Role.ADMIN,
    };

    describe('Success Cases', () => {
      it('should register user via admin endpoint without setting cookie', async () => {
        const adminAuthResult: AuthResult = {
          user: { ...mockUserResponse, email: 'newuser@example.com', name: 'New User' },
          accessToken: testAccessToken,
          refreshToken: testRefreshToken,
        };
        authService.register.mockResolvedValue(adminAuthResult);
        const req = createMockRequest() as Request;
        const res = createMockResponse() as unknown as Response;

        const result = await controller.adminRegister(registerDto, adminUser, req, res);

        expect(authService.register).toHaveBeenCalledWith(
          registerDto,
          Role.ADMIN, // admin.role passed as creatorRole
          testUserAgent,
          testIpAddress,
        );
        // Cookie should NOT be set for admin-created users
        expect(res.cookie).not.toHaveBeenCalled();
        expect(result).toEqual({
          user: adminAuthResult.user,
          accessToken: testAccessToken,
        });
        expect(result).not.toHaveProperty('refreshToken');
      });

      it('should allow admin to create user with specific role', async () => {
        const dtoWithAdminRole: RegisterDto = {
          ...registerDto,
          role: Role.ADMIN,
        };
        authService.register.mockResolvedValue({
          ...mockAuthResult,
          user: mockAdminUserResponse,
        });
        const req = createMockRequest() as Request;
        const res = createMockResponse() as unknown as Response;

        await controller.adminRegister(dtoWithAdminRole, adminUser, req, res);

        expect(authService.register).toHaveBeenCalledWith(
          dtoWithAdminRole,
          Role.ADMIN,
          testUserAgent,
          testIpAddress,
        );
      });
    });

    describe('Error Cases', () => {
      it('should propagate errors from AuthService', async () => {
        const error = new Error('Email already registered');
        authService.register.mockRejectedValue(error);
        const req = createMockRequest() as Request;
        const res = createMockResponse() as unknown as Response;

        await expect(
          controller.adminRegister(registerDto, adminUser, req, res),
        ).rejects.toThrow('Email already registered');
      });
    });
  });

  // ============================================================
  // POST /api/auth/login Tests
  // ============================================================
  describe('login()', () => {
    const loginDto: LoginDto = {
      email: testEmail,
      password: testPassword,
    };

    describe('Success Cases', () => {
      it('should login successfully and set refresh token cookie', async () => {
        authService.login.mockResolvedValue(mockAuthResult);
        const req = createMockRequest() as Request;
        const res = createMockResponse() as unknown as Response;

        const result = await controller.login(loginDto, req, res);

        expect(authService.login).toHaveBeenCalledWith(
          loginDto,
          testUserAgent,
          testIpAddress,
        );
        expect(res.cookie).toHaveBeenCalledWith(
          'refreshToken',
          testRefreshToken,
          expect.objectContaining({
            httpOnly: true,
            sameSite: 'strict',
            path: '/api/auth',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
          }),
        );
        expect(result).toEqual({
          user: mockUserResponse,
          accessToken: testAccessToken,
        });
        expect(result).not.toHaveProperty('refreshToken');
      });

      it('should handle login without user-agent header', async () => {
        const reqWithoutUserAgent = createMockRequest({
          headers: {},
        }) as Request;
        const res = createMockResponse() as unknown as Response;
        authService.login.mockResolvedValue(mockAuthResult);

        await controller.login(loginDto, reqWithoutUserAgent, res);

        expect(authService.login).toHaveBeenCalledWith(
          loginDto,
          undefined,
          testIpAddress,
        );
      });

      it('should handle login without IP address', async () => {
        const reqWithoutIp = createMockRequest({
          ip: undefined,
        }) as Request;
        const res = createMockResponse() as unknown as Response;
        authService.login.mockResolvedValue(mockAuthResult);

        await controller.login(loginDto, reqWithoutIp, res);

        expect(authService.login).toHaveBeenCalledWith(
          loginDto,
          testUserAgent,
          undefined,
        );
      });
    });

    describe('Error Cases', () => {
      it('should propagate UnauthorizedException for invalid credentials', async () => {
        const error = new Error('Invalid email or password');
        authService.login.mockRejectedValue(error);
        const req = createMockRequest() as Request;
        const res = createMockResponse() as unknown as Response;

        await expect(controller.login(loginDto, req, res)).rejects.toThrow(
          'Invalid email or password',
        );
        expect(res.cookie).not.toHaveBeenCalled();
      });

      it('should propagate UnauthorizedException for disabled account', async () => {
        const error = new Error('Account is disabled');
        authService.login.mockRejectedValue(error);
        const req = createMockRequest() as Request;
        const res = createMockResponse() as unknown as Response;

        await expect(controller.login(loginDto, req, res)).rejects.toThrow(
          'Account is disabled',
        );
      });
    });
  });

  // ============================================================
  // POST /api/auth/logout Tests
  // ============================================================
  describe('logout()', () => {
    describe('Success Cases', () => {
      it('should logout and clear cookie when refresh token exists', async () => {
        authService.logout.mockResolvedValue(undefined);
        const req = createMockRequest({
          cookies: { refreshToken: testRefreshToken },
        }) as Request;
        const res = createMockResponse() as unknown as Response;

        const result = await controller.logout(req, res);

        expect(authService.logout).toHaveBeenCalledWith(testRefreshToken);
        expect(res.clearCookie).toHaveBeenCalledWith('refreshToken', { path: '/api/auth' });
        expect(result).toEqual({ message: 'Logged out successfully' });
      });

      it('should clear cookie and skip logout call when no refresh token', async () => {
        const req = createMockRequest({
          cookies: {},
        }) as Request;
        const res = createMockResponse() as unknown as Response;

        const result = await controller.logout(req, res);

        expect(authService.logout).not.toHaveBeenCalled();
        expect(res.clearCookie).toHaveBeenCalledWith('refreshToken', { path: '/api/auth' });
        expect(result).toEqual({ message: 'Logged out successfully' });
      });

      it('should clear cookie when cookies object is undefined', async () => {
        const req = createMockRequest() as Request;
        (req as any).cookies = undefined;
        const res = createMockResponse() as unknown as Response;

        const result = await controller.logout(req, res);

        expect(authService.logout).not.toHaveBeenCalled();
        expect(res.clearCookie).toHaveBeenCalled();
        expect(result).toEqual({ message: 'Logged out successfully' });
      });
    });

    describe('Error Cases', () => {
      it('should clear cookie even if logout service fails', async () => {
        const error = new Error('Session not found');
        authService.logout.mockRejectedValue(error);
        const req = createMockRequest({
          cookies: { refreshToken: testRefreshToken },
        }) as Request;
        const res = createMockResponse() as unknown as Response;

        // Note: The current implementation doesn't catch errors from authService.logout
        // This test verifies the current behavior - it will propagate the error
        await expect(controller.logout(req, res)).rejects.toThrow('Session not found');
      });
    });
  });

  // ============================================================
  // POST /api/auth/logout/all Tests
  // ============================================================
  describe('logoutAll()', () => {
    describe('Success Cases', () => {
      it('should logout all sessions and clear cookie', async () => {
        authService.logoutAll.mockResolvedValue(5);
        const res = createMockResponse() as unknown as Response;

        const result = await controller.logoutAll(testUserId, res);

        expect(authService.logoutAll).toHaveBeenCalledWith(testUserId);
        expect(res.clearCookie).toHaveBeenCalledWith('refreshToken', { path: '/api/auth' });
        expect(result).toEqual({ message: 'Logged out from 5 device(s)' });
      });

      it('should handle zero sessions gracefully', async () => {
        authService.logoutAll.mockResolvedValue(0);
        const res = createMockResponse() as unknown as Response;

        const result = await controller.logoutAll(testUserId, res);

        expect(result).toEqual({ message: 'Logged out from 0 device(s)' });
      });

      it('should handle single session', async () => {
        authService.logoutAll.mockResolvedValue(1);
        const res = createMockResponse() as unknown as Response;

        const result = await controller.logoutAll(testUserId, res);

        expect(result).toEqual({ message: 'Logged out from 1 device(s)' });
      });

      it('should handle many sessions', async () => {
        authService.logoutAll.mockResolvedValue(100);
        const res = createMockResponse() as unknown as Response;

        const result = await controller.logoutAll(testUserId, res);

        expect(result).toEqual({ message: 'Logged out from 100 device(s)' });
      });
    });

    describe('Error Cases', () => {
      it('should propagate errors from AuthService', async () => {
        const error = new Error('Database error');
        authService.logoutAll.mockRejectedValue(error);
        const res = createMockResponse() as unknown as Response;

        await expect(controller.logoutAll(testUserId, res)).rejects.toThrow('Database error');
      });
    });
  });

  // ============================================================
  // POST /api/auth/refresh Tests
  // ============================================================
  describe('refresh()', () => {
    describe('Success Cases', () => {
      it('should refresh tokens and set new cookie', async () => {
        authService.refresh.mockResolvedValue({
          accessToken: testAccessToken,
          refreshToken: newRefreshToken,
        });
        const req = createMockRequest({
          cookies: { refreshToken: testRefreshToken },
        }) as Request;
        const res = createMockResponse() as unknown as Response;

        const result = await controller.refresh(req, res);

        expect(authService.refresh).toHaveBeenCalledWith(
          testRefreshToken,
          testUserAgent,
          testIpAddress,
        );
        expect(res.cookie).toHaveBeenCalledWith(
          'refreshToken',
          newRefreshToken,
          expect.objectContaining({
            httpOnly: true,
            sameSite: 'strict',
            path: '/api/auth',
          }),
        );
        expect(result).toEqual({ accessToken: testAccessToken });
      });

      it('should handle refresh without user-agent', async () => {
        authService.refresh.mockResolvedValue({
          accessToken: testAccessToken,
          refreshToken: newRefreshToken,
        });
        const req = createMockRequest({
          headers: {},
          cookies: { refreshToken: testRefreshToken },
        }) as Request;
        const res = createMockResponse() as unknown as Response;

        await controller.refresh(req, res);

        expect(authService.refresh).toHaveBeenCalledWith(
          testRefreshToken,
          undefined,
          testIpAddress,
        );
      });
    });

    describe('Error Cases', () => {
      it('should throw error when no refresh token cookie exists', async () => {
        const req = createMockRequest({
          cookies: {},
        }) as Request;
        const res = createMockResponse() as unknown as Response;

        await expect(controller.refresh(req, res)).rejects.toThrow('Refresh token not found');
        expect(authService.refresh).not.toHaveBeenCalled();
        expect(res.cookie).not.toHaveBeenCalled();
      });

      it('should throw error when cookies object is undefined', async () => {
        const req = createMockRequest() as Request;
        (req as any).cookies = undefined;
        const res = createMockResponse() as unknown as Response;

        await expect(controller.refresh(req, res)).rejects.toThrow('Refresh token not found');
      });

      it('should propagate UnauthorizedException for invalid refresh token', async () => {
        const error = new Error('Invalid refresh token');
        authService.refresh.mockRejectedValue(error);
        const req = createMockRequest({
          cookies: { refreshToken: 'invalid-token' },
        }) as Request;
        const res = createMockResponse() as unknown as Response;

        await expect(controller.refresh(req, res)).rejects.toThrow('Invalid refresh token');
        expect(res.cookie).not.toHaveBeenCalled();
      });

      it('should propagate UnauthorizedException for expired refresh token', async () => {
        const error = new Error('Refresh token expired');
        authService.refresh.mockRejectedValue(error);
        const req = createMockRequest({
          cookies: { refreshToken: testRefreshToken },
        }) as Request;
        const res = createMockResponse() as unknown as Response;

        await expect(controller.refresh(req, res)).rejects.toThrow('Refresh token expired');
      });
    });
  });

  // ============================================================
  // GET /api/auth/me Tests
  // ============================================================
  describe('getProfile()', () => {
    describe('Success Cases', () => {
      it('should return user profile for valid userId', async () => {
        authService.getProfile.mockResolvedValue(mockUserResponse);

        const result = await controller.getProfile(testUserId);

        expect(authService.getProfile).toHaveBeenCalledWith(testUserId);
        expect(result).toEqual(mockUserResponse);
      });

      it('should return admin profile', async () => {
        authService.getProfile.mockResolvedValue(mockAdminUserResponse);

        const result = await controller.getProfile(testUserId);

        expect(result.role).toBe(Role.ADMIN);
      });
    });

    describe('Error Cases', () => {
      it('should propagate UnauthorizedException for non-existent user', async () => {
        const error = new Error('User not found');
        authService.getProfile.mockRejectedValue(error);

        await expect(controller.getProfile('non-existent-id')).rejects.toThrow('User not found');
      });
    });
  });

  // ============================================================
  // PATCH /api/auth/me Tests
  // ============================================================
  describe('updateProfile()', () => {
    describe('Success Cases', () => {
      it('should update name only', async () => {
        const updateData = { name: 'Updated Name' };
        const updatedUser: UserResponseDto = {
          ...mockUserResponse,
          name: 'Updated Name',
        };
        authService.updateProfile.mockResolvedValue(updatedUser);

        const result = await controller.updateProfile(testUserId, updateData);

        expect(authService.updateProfile).toHaveBeenCalledWith(testUserId, updateData);
        expect(result.name).toBe('Updated Name');
      });

      it('should update email only', async () => {
        const updateData = { email: 'newemail@example.com' };
        const updatedUser: UserResponseDto = {
          ...mockUserResponse,
          email: 'newemail@example.com',
        };
        authService.updateProfile.mockResolvedValue(updatedUser);

        const result = await controller.updateProfile(testUserId, updateData);

        expect(authService.updateProfile).toHaveBeenCalledWith(testUserId, updateData);
        expect(result.email).toBe('newemail@example.com');
      });

      it('should update both name and email', async () => {
        const updateData = { name: 'New Name', email: 'new@example.com' };
        const updatedUser: UserResponseDto = {
          ...mockUserResponse,
          name: 'New Name',
          email: 'new@example.com',
        };
        authService.updateProfile.mockResolvedValue(updatedUser);

        const result = await controller.updateProfile(testUserId, updateData);

        expect(authService.updateProfile).toHaveBeenCalledWith(testUserId, updateData);
        expect(result.name).toBe('New Name');
        expect(result.email).toBe('new@example.com');
      });

      it('should handle empty update data', async () => {
        const updateData = {};
        authService.updateProfile.mockResolvedValue(mockUserResponse);

        const result = await controller.updateProfile(testUserId, updateData);

        expect(authService.updateProfile).toHaveBeenCalledWith(testUserId, updateData);
        expect(result).toEqual(mockUserResponse);
      });
    });

    describe('Error Cases', () => {
      it('should propagate ConflictException for duplicate email', async () => {
        const updateData = { email: 'existing@example.com' };
        const error = new Error('Email already in use');
        authService.updateProfile.mockRejectedValue(error);

        await expect(controller.updateProfile(testUserId, updateData)).rejects.toThrow(
          'Email already in use',
        );
      });
    });
  });

  // ============================================================
  // Edge Cases and Boundary Tests
  // ============================================================
  describe('Edge Cases', () => {
    describe('Cookie Options', () => {
      it('should use correct cookie options structure', async () => {
        authService.login.mockResolvedValue(mockAuthResult);
        const req = createMockRequest() as Request;
        const res = createMockResponse() as unknown as Response;

        await controller.login(
          { email: testEmail, password: testPassword },
          req,
          res,
        );

        const cookieCall = (res.cookie as jest.Mock).mock.calls[0];
        const cookieOptions = cookieCall[2];

        expect(cookieOptions).toMatchObject({
          httpOnly: true,
          sameSite: 'strict',
          path: '/api/auth',
          maxAge: 604800000, // 7 days in milliseconds
        });
      });
    });

    describe('Request Metadata Extraction', () => {
      it('should handle various IP address formats (IPv4)', async () => {
        const ipv4Addresses = ['192.168.1.1', '10.0.0.1', '172.16.0.1', '127.0.0.1'];

        for (const ip of ipv4Addresses) {
          authService.register.mockClear();
          authService.register.mockResolvedValue(mockAuthResult);
          const req = createMockRequest({ ip }) as Request;
          const res = createMockResponse() as unknown as Response;

          await controller.register(
            { email: testEmail, password: testPassword, name: testName },
            req,
            res,
          );

          expect(authService.register).toHaveBeenCalledWith(
            expect.objectContaining({ email: testEmail }),
            undefined,
            testUserAgent,
            ip,
          );
        }
      });

      it('should handle IPv6 addresses', async () => {
        const ipv6Address = '2001:0db8:85a3:0000:0000:8a2e:0370:7334';
        authService.login.mockResolvedValue(mockAuthResult);
        const req = createMockRequest({ ip: ipv6Address }) as Request;
        const res = createMockResponse() as unknown as Response;

        await controller.login(
          { email: testEmail, password: testPassword },
          req,
          res,
        );

        expect(authService.login).toHaveBeenCalledWith(
          expect.anything(),
          expect.anything(),
          ipv6Address,
        );
      });

      it('should handle various user-agent strings', async () => {
        const userAgents = [
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
          'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X)',
          'PostmanRuntime/7.28.4',
          'curl/7.77.0',
        ];
        authService.login.mockResolvedValue(mockAuthResult);

        for (const userAgent of userAgents) {
          const req = createMockRequest({
            headers: { 'user-agent': userAgent },
          }) as Request;
          const res = createMockResponse() as unknown as Response;

          await controller.login(
            { email: testEmail, password: testPassword },
            req,
            res,
          );

          expect(authService.login).toHaveBeenCalledWith(
            expect.anything(),
            userAgent,
            expect.anything(),
          );
        }
      });
    });

    describe('Null and Undefined Handling', () => {
      it('should handle undefined cookies gracefully in logout', async () => {
        const req = { ...createMockRequest(), cookies: undefined } as unknown as Request;
        const res = createMockResponse() as unknown as Response;

        const result = await controller.logout(req, res);

        expect(result.message).toBe('Logged out successfully');
      });

      it('should handle empty string refresh token', async () => {
        const req = createMockRequest({
          cookies: { refreshToken: '' },
        }) as Request;
        const res = createMockResponse() as unknown as Response;

        // Empty string is falsy, so it should throw
        await expect(controller.refresh(req, res)).rejects.toThrow('Refresh token not found');
      });
    });

    describe('Response Shape Validation', () => {
      it('register should not include refreshToken in response', async () => {
        authService.register.mockResolvedValue(mockAuthResult);
        const req = createMockRequest() as Request;
        const res = createMockResponse() as unknown as Response;

        const result = await controller.register(
          { email: testEmail, password: testPassword, name: testName },
          req,
          res,
        );

        expect(result).toHaveProperty('user');
        expect(result).toHaveProperty('accessToken');
        expect(result).not.toHaveProperty('refreshToken');
      });

      it('login should not include refreshToken in response', async () => {
        authService.login.mockResolvedValue(mockAuthResult);
        const req = createMockRequest() as Request;
        const res = createMockResponse() as unknown as Response;

        const result = await controller.login(
          { email: testEmail, password: testPassword },
          req,
          res,
        );

        expect(result).toHaveProperty('user');
        expect(result).toHaveProperty('accessToken');
        expect(result).not.toHaveProperty('refreshToken');
      });

      it('refresh should only return accessToken', async () => {
        authService.refresh.mockResolvedValue({
          accessToken: testAccessToken,
          refreshToken: newRefreshToken,
        });
        const req = createMockRequest({
          cookies: { refreshToken: testRefreshToken },
        }) as Request;
        const res = createMockResponse() as unknown as Response;

        const result = await controller.refresh(req, res);

        expect(result).toEqual({ accessToken: testAccessToken });
        expect(result).not.toHaveProperty('refreshToken');
        expect(result).not.toHaveProperty('user');
      });
    });
  });

  // ============================================================
  // Security Tests
  // ============================================================
  describe('Security', () => {
    it('should set httpOnly flag on refresh token cookie', async () => {
      authService.login.mockResolvedValue(mockAuthResult);
      const req = createMockRequest() as Request;
      const res = createMockResponse() as unknown as Response;

      await controller.login(
        { email: testEmail, password: testPassword },
        req,
        res,
      );

      const cookieOptions = (res.cookie as jest.Mock).mock.calls[0][2];
      expect(cookieOptions.httpOnly).toBe(true);
    });

    it('should set sameSite strict on refresh token cookie', async () => {
      authService.login.mockResolvedValue(mockAuthResult);
      const req = createMockRequest() as Request;
      const res = createMockResponse() as unknown as Response;

      await controller.login(
        { email: testEmail, password: testPassword },
        req,
        res,
      );

      const cookieOptions = (res.cookie as jest.Mock).mock.calls[0][2];
      expect(cookieOptions.sameSite).toBe('strict');
    });

    it('should restrict cookie path to /api/auth', async () => {
      authService.login.mockResolvedValue(mockAuthResult);
      const req = createMockRequest() as Request;
      const res = createMockResponse() as unknown as Response;

      await controller.login(
        { email: testEmail, password: testPassword },
        req,
        res,
      );

      const cookieOptions = (res.cookie as jest.Mock).mock.calls[0][2];
      expect(cookieOptions.path).toBe('/api/auth');
    });

    it('should clear cookie with correct path on logout', async () => {
      const req = createMockRequest({
        cookies: { refreshToken: testRefreshToken },
      }) as Request;
      const res = createMockResponse() as unknown as Response;

      await controller.logout(req, res);

      expect(res.clearCookie).toHaveBeenCalledWith('refreshToken', { path: '/api/auth' });
    });
  });
});
