/**
 * TDD RED Tests: Auth Service - Admin Seeding & Registration Restrictions
 *
 * These tests define the EXPECTED go-live behavior for:
 * 1. Admin seeding on application startup (justin@jjailabs.io auto-created as ADMIN)
 * 2. Registration restrictions (only ADMIN can create new users)
 * 3. Self-registration disabled after admin is seeded
 *
 * STATUS: RED - These tests define behavior that needs to be implemented.
 * The current AuthService supports open registration. Go-live requires
 * that only the admin (justin@jjailabs.io) can create new users.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { Logger, ForbiddenException } from '@nestjs/common';
import { AuthService } from '../domain/auth.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { PasswordService } from '../domain/password.service';
import { TokenService } from '../domain/token.service';
import { SessionService } from '../domain/session.service';
import { Role } from '@prisma/client';

describe('AuthService - Go-Live Admin Seeding & Restrictions', () => {
  let service: AuthService;
  let prisma: jest.Mocked<PrismaService>;
  let passwordService: jest.Mocked<PasswordService>;
  let tokenService: jest.Mocked<TokenService>;
  let sessionService: jest.Mocked<SessionService>;

  const ADMIN_EMAIL = 'justin@jjailabs.io';
  const testAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.token';
  const testRefreshToken = 'a'.repeat(64);

  const mockAdminUser = {
    id: 'admin-uuid-001',
    email: ADMIN_EMAIL,
    password_hash: '$2b$12$hashedpassword',
    name: 'Justin Nalven',
    role: Role.ADMIN,
    is_active: true,
    created_at: new Date('2025-01-01'),
    updated_at: new Date('2025-01-01'),
    last_login: new Date('2025-01-15'),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              count: jest.fn(),
            },
          },
        },
        {
          provide: PasswordService,
          useValue: {
            validateStrength: jest.fn().mockReturnValue({ isValid: true, errors: [] }),
            hash: jest.fn().mockResolvedValue('$2b$12$hashedpassword'),
            compare: jest.fn().mockResolvedValue(true),
          },
        },
        {
          provide: TokenService,
          useValue: {
            generateAccessToken: jest.fn().mockReturnValue(testAccessToken),
          },
        },
        {
          provide: SessionService,
          useValue: {
            createSession: jest.fn().mockResolvedValue(testRefreshToken),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get(PrismaService);
    passwordService = module.get(PasswordService);
    tokenService = module.get(TokenService);
    sessionService = module.get(SessionService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ============================================================
  // Admin Seeding Tests
  // ============================================================
  describe('Admin Seeding (seedAdmin)', () => {
    /**
     * RED TEST: The system should have a seedAdmin() method that creates
     * the admin user on first startup if no admin exists.
     */
    it('should have a seedAdmin method', () => {
      // TODO: Implement seedAdmin() method on AuthService
      expect(typeof (service as any).seedAdmin).toBe('function');
    });

    it('should create admin user with justin@jjailabs.io on first startup', async () => {
      prisma.user.findUnique.mockResolvedValue(null); // No admin exists
      prisma.user.count.mockResolvedValue(0); // No users exist
      prisma.user.create.mockResolvedValue(mockAdminUser as any);

      // TODO: Implement seedAdmin() that creates the default admin
      await (service as any).seedAdmin();

      expect(prisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: ADMIN_EMAIL,
          role: Role.ADMIN,
          name: expect.any(String),
        }),
      });
    });

    it('should not create admin if admin already exists', async () => {
      prisma.user.findUnique.mockResolvedValue(mockAdminUser as any);

      // TODO: seedAdmin should be idempotent
      await (service as any).seedAdmin();

      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it('should set admin as ADMIN role regardless of other users', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.count.mockResolvedValue(5); // Other users exist
      prisma.user.create.mockResolvedValue(mockAdminUser as any);

      await (service as any).seedAdmin();

      expect(prisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          role: Role.ADMIN,
        }),
      });
    });
  });

  // ============================================================
  // Registration Restriction Tests
  // ============================================================
  describe('Registration Restrictions (Go-Live)', () => {
    /**
     * RED TEST: After the admin is seeded, self-registration should be
     * disabled. Only ADMIN users can register new users.
     */
    it('should reject self-registration when admin exists (no creatorRole)', async () => {
      prisma.user.findUnique.mockResolvedValue(null); // Email not taken
      prisma.user.count.mockResolvedValue(1); // Admin already exists

      // Self-registration (no creatorRole) should be forbidden after go-live
      // TODO: Modify register() to require creatorRole === ADMIN when users > 0
      await expect(
        service.register(
          { email: 'newuser@example.com', password: 'Password123!', name: 'New User' },
          undefined, // No creator role = self-registration
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should reject registration by MEMBER users', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.count.mockResolvedValue(2);

      await expect(
        service.register(
          { email: 'newuser@example.com', password: 'Password123!', name: 'New User' },
          Role.MEMBER,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should reject registration by VIEWER users', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.count.mockResolvedValue(2);

      await expect(
        service.register(
          { email: 'newuser@example.com', password: 'Password123!', name: 'New User' },
          Role.VIEWER,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow ADMIN to register new users', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.count.mockResolvedValue(1);
      const newUser = {
        ...mockAdminUser,
        id: 'new-user-uuid',
        email: 'viewer@example.com',
        role: Role.VIEWER,
      };
      prisma.user.create.mockResolvedValue(newUser as any);

      const result = await service.register(
        { email: 'viewer@example.com', password: 'Password123!', name: 'Viewer User', role: Role.VIEWER },
        Role.ADMIN,
      );

      expect(result.user.email).toBe('viewer@example.com');
      expect(result.user.role).toBe(Role.VIEWER);
    });

    it('should still allow first user registration when no users exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.count.mockResolvedValue(0); // No users at all
      prisma.user.create.mockResolvedValue(mockAdminUser as any);

      // First user registration should always work (becomes admin)
      const result = await service.register(
        { email: ADMIN_EMAIL, password: 'Password123!', name: 'Justin Nalven' },
        undefined,
      );

      expect(result.user.role).toBe(Role.ADMIN);
    });
  });

  // ============================================================
  // Admin-Only User Management Tests
  // ============================================================
  describe('Admin-Only User Management', () => {
    /**
     * RED TEST: Admin should be able to list all users.
     */
    it('should have a listUsers method accessible to admin', () => {
      // TODO: Implement listUsers() method
      expect(typeof (service as any).listUsers).toBe('function');
    });

    /**
     * RED TEST: Admin should be able to change user roles.
     */
    it('should have a changeUserRole method', () => {
      // TODO: Implement changeUserRole() method
      expect(typeof (service as any).changeUserRole).toBe('function');
    });

    /**
     * RED TEST: Admin should be able to deactivate users.
     */
    it('should have a deactivateUser method', () => {
      // TODO: Implement deactivateUser() method
      expect(typeof (service as any).deactivateUser).toBe('function');
    });
  });
});
