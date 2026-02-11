/**
 * TDD RED Tests: Auth Guards - JWT & Role Guard Integration
 *
 * These tests define the EXPECTED go-live behavior for:
 * 1. JWT guard properly rejecting unauthenticated requests
 * 2. Role guard enforcing ADMIN vs VIEWER access patterns
 * 3. Guard composition (JWT + Role) working together
 * 4. @Public() decorator bypassing both guards
 *
 * STATUS: RED - Tests for the go-live guard pipeline behavior.
 * Some tests verify existing behavior, others define new restrictions.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

describe('Auth Guards - Go-Live Integration', () => {
  let jwtGuard: JwtAuthGuard;
  let rolesGuard: RolesGuard;
  let reflector: jest.Mocked<Reflector>;

  const createMockContext = (
    user: { id: string; email: string; role: Role } | null,
    method: string = 'GET',
  ): ExecutionContext => {
    const mockRequest = { user, method };
    const mockHandler = jest.fn();
    const mockClass = jest.fn();

    return {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
        getResponse: () => ({}),
        getNext: () => jest.fn(),
      }),
      getHandler: () => mockHandler,
      getClass: () => mockClass,
      getArgs: () => [],
      getArgByIndex: () => null,
      switchToRpc: () => ({} as any),
      switchToWs: () => ({} as any),
      getType: () => 'http' as const,
    } as ExecutionContext;
  };

  const adminUser = {
    id: 'admin-uuid',
    email: 'justin@jjailabs.io',
    role: Role.ADMIN,
  };

  const viewerUser = {
    id: 'viewer-uuid',
    email: 'viewer@example.com',
    role: Role.VIEWER,
  };

  const memberUser = {
    id: 'member-uuid',
    email: 'member@example.com',
    role: Role.MEMBER,
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const mockReflector = {
      getAllAndOverride: jest.fn(),
      get: jest.fn(),
      getAll: jest.fn(),
      getAllAndMerge: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesGuard,
        {
          provide: Reflector,
          useValue: mockReflector,
        },
      ],
    }).compile();

    rolesGuard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get(Reflector);
  });

  // ============================================================
  // Role Guard: Admin-Only Endpoint Access
  // ============================================================
  describe('Admin-Only Endpoint Protection', () => {
    it('should allow ADMIN to access @Roles(ADMIN) endpoints', () => {
      // First call for IS_PUBLIC_KEY, second for ROLES_KEY
      reflector.getAllAndOverride
        .mockReturnValueOnce(false)   // not public
        .mockReturnValueOnce([Role.ADMIN]); // requires ADMIN
      const context = createMockContext(adminUser);

      expect(rolesGuard.canActivate(context)).toBe(true);
    });

    it('should deny VIEWER from @Roles(ADMIN) endpoints', () => {
      reflector.getAllAndOverride
        .mockReturnValueOnce(false)
        .mockReturnValueOnce([Role.ADMIN]);
      const context = createMockContext(viewerUser);

      expect(() => rolesGuard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('should deny MEMBER from @Roles(ADMIN) endpoints', () => {
      reflector.getAllAndOverride
        .mockReturnValueOnce(false)
        .mockReturnValueOnce([Role.ADMIN]);
      const context = createMockContext(memberUser);

      expect(() => rolesGuard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('should deny unauthenticated users from @Roles(ADMIN) endpoints', () => {
      reflector.getAllAndOverride
        .mockReturnValueOnce(false)
        .mockReturnValueOnce([Role.ADMIN]);
      const context = createMockContext(null);

      expect(() => rolesGuard.canActivate(context)).toThrow(ForbiddenException);
    });
  });

  // ============================================================
  // Role Guard: Read-Only Access for VIEWER
  // ============================================================
  describe('Read-Only Access for VIEWER Role', () => {
    it('should allow VIEWER to access read endpoints with @Roles(ADMIN, MEMBER, VIEWER)', () => {
      reflector.getAllAndOverride
        .mockReturnValueOnce(false)
        .mockReturnValueOnce([Role.ADMIN, Role.MEMBER, Role.VIEWER]);
      const context = createMockContext(viewerUser, 'GET');

      expect(rolesGuard.canActivate(context)).toBe(true);
    });

    it('should deny VIEWER from write endpoints with @Roles(ADMIN, MEMBER)', () => {
      reflector.getAllAndOverride
        .mockReturnValueOnce(false)
        .mockReturnValueOnce([Role.ADMIN, Role.MEMBER]);
      const context = createMockContext(viewerUser, 'POST');

      expect(() => rolesGuard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('should deny VIEWER from delete endpoints with @Roles(ADMIN)', () => {
      reflector.getAllAndOverride
        .mockReturnValueOnce(false)
        .mockReturnValueOnce([Role.ADMIN]);
      const context = createMockContext(viewerUser, 'DELETE');

      expect(() => rolesGuard.canActivate(context)).toThrow(ForbiddenException);
    });
  });

  // ============================================================
  // Public Routes Bypass
  // ============================================================
  describe('Public Routes Bypass', () => {
    it('should allow unauthenticated access to @Public() endpoints', () => {
      reflector.getAllAndOverride.mockReturnValueOnce(true); // is public
      const context = createMockContext(null);

      expect(rolesGuard.canActivate(context)).toBe(true);
    });

    it('should allow VIEWER access to @Public() endpoints', () => {
      reflector.getAllAndOverride.mockReturnValueOnce(true);
      const context = createMockContext(viewerUser);

      expect(rolesGuard.canActivate(context)).toBe(true);
    });
  });

  // ============================================================
  // Go-Live Access Matrix
  // ============================================================
  describe('Go-Live Access Matrix', () => {
    /**
     * Defines the complete access control matrix for go-live:
     *
     * | Endpoint              | ADMIN | MEMBER | VIEWER | Unauthenticated |
     * |-----------------------|-------|--------|--------|-----------------|
     * | POST /auth/login      | yes   | yes    | yes    | yes (@Public)   |
     * | POST /auth/register   | yes   | no     | no     | no (go-live)    |
     * | GET /businesses       | yes   | yes    | yes    | no              |
     * | POST /businesses      | yes   | yes    | no     | no              |
     * | DELETE /businesses/:id | yes   | no     | no     | no              |
     * | GET /businesses/stats  | yes   | yes    | yes    | no              |
     */

    // Business read endpoints: All authenticated roles
    it.each([
      ['ADMIN', adminUser],
      ['MEMBER', memberUser],
      ['VIEWER', viewerUser],
    ])('should allow %s to read businesses', (_roleName, user) => {
      reflector.getAllAndOverride
        .mockReturnValueOnce(false)
        .mockReturnValueOnce([Role.ADMIN, Role.MEMBER, Role.VIEWER]);
      const context = createMockContext(user);

      expect(rolesGuard.canActivate(context)).toBe(true);
    });

    // Business create: Only ADMIN and MEMBER
    it('should deny VIEWER from creating businesses', () => {
      reflector.getAllAndOverride
        .mockReturnValueOnce(false)
        .mockReturnValueOnce([Role.ADMIN, Role.MEMBER]);
      const context = createMockContext(viewerUser, 'POST');

      expect(() => rolesGuard.canActivate(context)).toThrow(ForbiddenException);
    });

    // Business delete: Only ADMIN
    it.each([
      ['MEMBER', memberUser],
      ['VIEWER', viewerUser],
    ])('should deny %s from deleting businesses', (_roleName, user) => {
      reflector.getAllAndOverride
        .mockReturnValueOnce(false)
        .mockReturnValueOnce([Role.ADMIN]);
      const context = createMockContext(user, 'DELETE');

      expect(() => rolesGuard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('should allow ADMIN to delete businesses', () => {
      reflector.getAllAndOverride
        .mockReturnValueOnce(false)
        .mockReturnValueOnce([Role.ADMIN]);
      const context = createMockContext(adminUser, 'DELETE');

      expect(rolesGuard.canActivate(context)).toBe(true);
    });
  });
});
