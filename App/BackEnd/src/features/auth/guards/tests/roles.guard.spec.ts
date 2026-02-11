/**
 * RolesGuard Unit Tests
 *
 * Tests for role-based access control guard.
 * Covers role validation, authentication checks, and error handling.
 *
 * Test Categories:
 * - No roles required (public endpoints)
 * - Single role authorization
 * - Multiple allowed roles
 * - Access denied scenarios
 * - Missing user authentication
 * - Role hierarchy validation (ADMIN > MEMBER > VIEWER)
 *
 * NOTE: The RolesGuard.canActivate() calls reflector.getAllAndOverride TWICE:
 * 1st call: IS_PUBLIC_KEY (returns boolean - if true, skip role check)
 * 2nd call: ROLES_KEY (returns Role[] - the required roles)
 * Tests must mock both calls using mockReturnValueOnce.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { RolesGuard } from '../roles.guard';
import { ROLES_KEY } from '../../decorators/roles.decorator';
import { IS_PUBLIC_KEY } from '../../decorators/public.decorator';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: jest.Mocked<Reflector>;

  // Helper to create mock ExecutionContext
  const createMockExecutionContext = (user: { role: Role } | null): ExecutionContext => {
    const mockRequest = {
      user,
    };

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

  /**
   * Helper to mock both getAllAndOverride calls for a single canActivate invocation.
   * @param isPublic - value for IS_PUBLIC_KEY check (1st call)
   * @param roles - value for ROLES_KEY check (2nd call), omit if isPublic is true
   */
  const mockGuardCalls = (isPublic: boolean | null | undefined, roles?: Role[] | null | undefined) => {
    if (isPublic) {
      // If public, only the first call happens (guard returns true immediately)
      reflector.getAllAndOverride.mockReturnValueOnce(isPublic as any);
    } else {
      reflector.getAllAndOverride
        .mockReturnValueOnce(isPublic as any)  // IS_PUBLIC_KEY
        .mockReturnValueOnce(roles as any);    // ROLES_KEY
    }
  };

  beforeEach(async () => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create mock Reflector
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

    guard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get(Reflector);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  // ============================================================
  // No Roles Required Tests (Public Endpoints)
  // ============================================================
  describe('No roles required (no @Roles decorator)', () => {
    it('should return true when no roles are required (null)', () => {
      mockGuardCalls(false, null);
      const context = createMockExecutionContext({ role: Role.VIEWER });

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should return true when no roles are required (undefined)', () => {
      mockGuardCalls(false, undefined);
      const context = createMockExecutionContext({ role: Role.MEMBER });

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should return true when roles array is empty', () => {
      mockGuardCalls(false, []);
      const context = createMockExecutionContext({ role: Role.ADMIN });

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should allow access even without user when no roles required', () => {
      mockGuardCalls(false, null);
      const context = createMockExecutionContext(null);

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });
  });

  // ============================================================
  // Single Role Authorization Tests
  // ============================================================
  describe('Single role authorization', () => {
    describe('ADMIN role', () => {
      it('should allow ADMIN user to access ADMIN route', () => {
        mockGuardCalls(false, [Role.ADMIN]);
        const context = createMockExecutionContext({ role: Role.ADMIN });

        const result = guard.canActivate(context);

        expect(result).toBe(true);
      });

      it('should deny MEMBER user access to ADMIN route', () => {
        const context = createMockExecutionContext({ role: Role.MEMBER });

        mockGuardCalls(false, [Role.ADMIN]);
        expect(() => guard.canActivate(context)).toThrow(ForbiddenException);

        mockGuardCalls(false, [Role.ADMIN]);
        expect(() => guard.canActivate(context)).toThrow(
          'Access denied. Required role: ADMIN. Your role: MEMBER',
        );
      });

      it('should deny VIEWER user access to ADMIN route', () => {
        const context = createMockExecutionContext({ role: Role.VIEWER });

        mockGuardCalls(false, [Role.ADMIN]);
        expect(() => guard.canActivate(context)).toThrow(ForbiddenException);

        mockGuardCalls(false, [Role.ADMIN]);
        expect(() => guard.canActivate(context)).toThrow(
          'Access denied. Required role: ADMIN. Your role: VIEWER',
        );
      });
    });

    describe('MEMBER role', () => {
      it('should allow MEMBER user to access MEMBER route', () => {
        mockGuardCalls(false, [Role.MEMBER]);
        const context = createMockExecutionContext({ role: Role.MEMBER });

        const result = guard.canActivate(context);

        expect(result).toBe(true);
      });

      it('should deny ADMIN user access to MEMBER-only route', () => {
        const context = createMockExecutionContext({ role: Role.ADMIN });

        mockGuardCalls(false, [Role.MEMBER]);
        expect(() => guard.canActivate(context)).toThrow(ForbiddenException);

        mockGuardCalls(false, [Role.MEMBER]);
        expect(() => guard.canActivate(context)).toThrow(
          'Access denied. Required role: MEMBER. Your role: ADMIN',
        );
      });

      it('should deny VIEWER user access to MEMBER route', () => {
        const context = createMockExecutionContext({ role: Role.VIEWER });

        mockGuardCalls(false, [Role.MEMBER]);
        expect(() => guard.canActivate(context)).toThrow(ForbiddenException);

        mockGuardCalls(false, [Role.MEMBER]);
        expect(() => guard.canActivate(context)).toThrow(
          'Access denied. Required role: MEMBER. Your role: VIEWER',
        );
      });
    });

    describe('VIEWER role', () => {
      it('should allow VIEWER user to access VIEWER route', () => {
        mockGuardCalls(false, [Role.VIEWER]);
        const context = createMockExecutionContext({ role: Role.VIEWER });

        const result = guard.canActivate(context);

        expect(result).toBe(true);
      });

      it('should deny ADMIN user access to VIEWER-only route', () => {
        const context = createMockExecutionContext({ role: Role.ADMIN });

        mockGuardCalls(false, [Role.VIEWER]);
        expect(() => guard.canActivate(context)).toThrow(ForbiddenException);

        mockGuardCalls(false, [Role.VIEWER]);
        expect(() => guard.canActivate(context)).toThrow(
          'Access denied. Required role: VIEWER. Your role: ADMIN',
        );
      });

      it('should deny MEMBER user access to VIEWER-only route', () => {
        const context = createMockExecutionContext({ role: Role.MEMBER });

        mockGuardCalls(false, [Role.VIEWER]);
        expect(() => guard.canActivate(context)).toThrow(ForbiddenException);

        mockGuardCalls(false, [Role.VIEWER]);
        expect(() => guard.canActivate(context)).toThrow(
          'Access denied. Required role: VIEWER. Your role: MEMBER',
        );
      });
    });
  });

  // ============================================================
  // Multiple Allowed Roles Tests
  // ============================================================
  describe('Multiple allowed roles', () => {
    describe('ADMIN or MEMBER allowed', () => {
      it('should allow ADMIN user when ADMIN or MEMBER required', () => {
        mockGuardCalls(false, [Role.ADMIN, Role.MEMBER]);
        const context = createMockExecutionContext({ role: Role.ADMIN });

        const result = guard.canActivate(context);

        expect(result).toBe(true);
      });

      it('should allow MEMBER user when ADMIN or MEMBER required', () => {
        mockGuardCalls(false, [Role.ADMIN, Role.MEMBER]);
        const context = createMockExecutionContext({ role: Role.MEMBER });

        const result = guard.canActivate(context);

        expect(result).toBe(true);
      });

      it('should deny VIEWER user when only ADMIN or MEMBER allowed', () => {
        const context = createMockExecutionContext({ role: Role.VIEWER });

        mockGuardCalls(false, [Role.ADMIN, Role.MEMBER]);
        expect(() => guard.canActivate(context)).toThrow(ForbiddenException);

        mockGuardCalls(false, [Role.ADMIN, Role.MEMBER]);
        expect(() => guard.canActivate(context)).toThrow(
          'Access denied. Required role: ADMIN or MEMBER. Your role: VIEWER',
        );
      });
    });

    describe('MEMBER or VIEWER allowed', () => {
      it('should allow MEMBER user when MEMBER or VIEWER required', () => {
        mockGuardCalls(false, [Role.MEMBER, Role.VIEWER]);
        const context = createMockExecutionContext({ role: Role.MEMBER });

        const result = guard.canActivate(context);

        expect(result).toBe(true);
      });

      it('should allow VIEWER user when MEMBER or VIEWER required', () => {
        mockGuardCalls(false, [Role.MEMBER, Role.VIEWER]);
        const context = createMockExecutionContext({ role: Role.VIEWER });

        const result = guard.canActivate(context);

        expect(result).toBe(true);
      });

      it('should deny ADMIN user when only MEMBER or VIEWER allowed', () => {
        const context = createMockExecutionContext({ role: Role.ADMIN });

        mockGuardCalls(false, [Role.MEMBER, Role.VIEWER]);
        expect(() => guard.canActivate(context)).toThrow(ForbiddenException);

        mockGuardCalls(false, [Role.MEMBER, Role.VIEWER]);
        expect(() => guard.canActivate(context)).toThrow(
          'Access denied. Required role: MEMBER or VIEWER. Your role: ADMIN',
        );
      });
    });

    describe('All roles allowed', () => {
      it('should allow ADMIN user when all roles are permitted', () => {
        mockGuardCalls(false, [Role.ADMIN, Role.MEMBER, Role.VIEWER]);
        const context = createMockExecutionContext({ role: Role.ADMIN });

        const result = guard.canActivate(context);

        expect(result).toBe(true);
      });

      it('should allow MEMBER user when all roles are permitted', () => {
        mockGuardCalls(false, [Role.ADMIN, Role.MEMBER, Role.VIEWER]);
        const context = createMockExecutionContext({ role: Role.MEMBER });

        const result = guard.canActivate(context);

        expect(result).toBe(true);
      });

      it('should allow VIEWER user when all roles are permitted', () => {
        mockGuardCalls(false, [Role.ADMIN, Role.MEMBER, Role.VIEWER]);
        const context = createMockExecutionContext({ role: Role.VIEWER });

        const result = guard.canActivate(context);

        expect(result).toBe(true);
      });
    });
  });

  // ============================================================
  // No User (Unauthenticated) Tests
  // ============================================================
  describe('No user on request (unauthenticated)', () => {
    it('should throw ForbiddenException when user is null and roles required', () => {
      const context = createMockExecutionContext(null);

      mockGuardCalls(false, [Role.ADMIN]);
      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);

      mockGuardCalls(false, [Role.ADMIN]);
      expect(() => guard.canActivate(context)).toThrow('User not authenticated');
    });

    it('should throw ForbiddenException when user is undefined and roles required', () => {
      const mockRequest = {
        user: undefined,
      };
      const context = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
        getHandler: () => jest.fn(),
        getClass: () => jest.fn(),
      } as unknown as ExecutionContext;

      mockGuardCalls(false, [Role.MEMBER]);
      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);

      mockGuardCalls(false, [Role.MEMBER]);
      expect(() => guard.canActivate(context)).toThrow('User not authenticated');
    });

    it('should throw ForbiddenException for all role types when user missing', () => {
      const context = createMockExecutionContext(null);

      // Test ADMIN
      mockGuardCalls(false, [Role.ADMIN]);
      expect(() => guard.canActivate(context)).toThrow('User not authenticated');

      // Test MEMBER
      mockGuardCalls(false, [Role.MEMBER]);
      expect(() => guard.canActivate(context)).toThrow('User not authenticated');

      // Test VIEWER
      mockGuardCalls(false, [Role.VIEWER]);
      expect(() => guard.canActivate(context)).toThrow('User not authenticated');

      // Test multiple roles
      mockGuardCalls(false, [Role.ADMIN, Role.MEMBER, Role.VIEWER]);
      expect(() => guard.canActivate(context)).toThrow('User not authenticated');
    });
  });

  // ============================================================
  // Error Message Format Tests
  // ============================================================
  describe('Error message formatting', () => {
    it('should format single role in error message', () => {
      mockGuardCalls(false, [Role.ADMIN]);
      const context = createMockExecutionContext({ role: Role.VIEWER });

      try {
        guard.canActivate(context);
        fail('Expected ForbiddenException to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ForbiddenException);
        expect(error.message).toBe('Access denied. Required role: ADMIN. Your role: VIEWER');
      }
    });

    it('should format two roles with "or" in error message', () => {
      mockGuardCalls(false, [Role.ADMIN, Role.MEMBER]);
      const context = createMockExecutionContext({ role: Role.VIEWER });

      try {
        guard.canActivate(context);
        fail('Expected ForbiddenException to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ForbiddenException);
        expect(error.message).toBe(
          'Access denied. Required role: ADMIN or MEMBER. Your role: VIEWER',
        );
      }
    });

    it('should format three roles with "or" separators in error message', () => {
      mockGuardCalls(false, [Role.ADMIN, Role.MEMBER, Role.VIEWER]);

      // Create context with a role that's not in the allowed list
      // Since all roles are allowed, we need to mock a non-existent role scenario
      const mockRequest = {
        user: { role: 'GUEST' as Role }, // Invalid role for testing
      };
      const context = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
        getHandler: () => jest.fn(),
        getClass: () => jest.fn(),
      } as unknown as ExecutionContext;

      try {
        guard.canActivate(context);
        fail('Expected ForbiddenException to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ForbiddenException);
        expect(error.message).toBe(
          'Access denied. Required role: ADMIN or MEMBER or VIEWER. Your role: GUEST',
        );
      }
    });
  });

  // ============================================================
  // Reflector Integration Tests
  // ============================================================
  describe('Reflector integration', () => {
    it('should call getAllAndOverride with IS_PUBLIC_KEY and ROLES_KEY', () => {
      mockGuardCalls(false, [Role.ADMIN]);
      const context = createMockExecutionContext({ role: Role.ADMIN });

      guard.canActivate(context);

      // First call is IS_PUBLIC_KEY, second is ROLES_KEY
      expect(reflector.getAllAndOverride).toHaveBeenCalledTimes(2);
      expect(reflector.getAllAndOverride).toHaveBeenNthCalledWith(1, IS_PUBLIC_KEY, expect.any(Array));
      expect(reflector.getAllAndOverride).toHaveBeenNthCalledWith(2, ROLES_KEY, expect.any(Array));
    });

    it('should pass handler and class to getAllAndOverride', () => {
      mockGuardCalls(false, [Role.ADMIN]);
      const context = createMockExecutionContext({ role: Role.ADMIN });

      guard.canActivate(context);

      expect(reflector.getAllAndOverride).toHaveBeenNthCalledWith(2, ROLES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);
    });

    it('should prioritize handler metadata over class metadata', () => {
      // getAllAndOverride automatically handles this - just verify it's called correctly
      mockGuardCalls(false, [Role.MEMBER]);
      const context = createMockExecutionContext({ role: Role.MEMBER });

      const result = guard.canActivate(context);

      expect(result).toBe(true);
      // 2 calls: IS_PUBLIC_KEY + ROLES_KEY
      expect(reflector.getAllAndOverride).toHaveBeenCalledTimes(2);
    });
  });

  // ============================================================
  // Edge Cases
  // ============================================================
  describe('Edge cases', () => {
    it('should handle user with additional properties', () => {
      mockGuardCalls(false, [Role.ADMIN]);

      const mockRequest = {
        user: {
          id: '123',
          email: 'admin@example.com',
          name: 'Admin User',
          role: Role.ADMIN,
          extraProperty: 'should be ignored',
        },
      };
      const context = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
        getHandler: () => jest.fn(),
        getClass: () => jest.fn(),
      } as unknown as ExecutionContext;

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should handle request with empty user object (missing role)', () => {
      mockGuardCalls(false, [Role.ADMIN]);

      const mockRequest = {
        user: {}, // User exists but has no role
      };
      const context = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
        getHandler: () => jest.fn(),
        getClass: () => jest.fn(),
      } as unknown as ExecutionContext;

      // User exists but role is undefined - should fail role check
      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('should be case-sensitive with role matching', () => {
      mockGuardCalls(false, [Role.ADMIN]);

      const mockRequest = {
        user: { role: 'admin' }, // lowercase - should not match
      };
      const context = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
        getHandler: () => jest.fn(),
        getClass: () => jest.fn(),
      } as unknown as ExecutionContext;

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('should handle duplicate roles in required roles array', () => {
      mockGuardCalls(false, [Role.ADMIN, Role.ADMIN, Role.ADMIN]);
      const context = createMockExecutionContext({ role: Role.ADMIN });

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should not modify the request object', () => {
      mockGuardCalls(false, [Role.MEMBER]);

      const originalUser = { role: Role.MEMBER, id: '123' };
      const mockRequest = { user: originalUser };
      const context = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
        getHandler: () => jest.fn(),
        getClass: () => jest.fn(),
      } as unknown as ExecutionContext;

      guard.canActivate(context);

      expect(mockRequest.user).toBe(originalUser);
      expect(mockRequest.user.role).toBe(Role.MEMBER);
    });
  });

  // ============================================================
  // Role Hierarchy Scenarios
  // ============================================================
  describe('Role hierarchy scenarios (realistic use cases)', () => {
    it('ADMIN accessing admin-only endpoint: SUCCESS', () => {
      mockGuardCalls(false, [Role.ADMIN]);
      const context = createMockExecutionContext({ role: Role.ADMIN });

      expect(guard.canActivate(context)).toBe(true);
    });

    it('MEMBER accessing admin-only endpoint: FAILURE', () => {
      mockGuardCalls(false, [Role.ADMIN]);
      const context = createMockExecutionContext({ role: Role.MEMBER });

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('VIEWER accessing admin-only endpoint: FAILURE', () => {
      mockGuardCalls(false, [Role.ADMIN]);
      const context = createMockExecutionContext({ role: Role.VIEWER });

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('ADMIN accessing member endpoint (admin + member allowed): SUCCESS', () => {
      mockGuardCalls(false, [Role.ADMIN, Role.MEMBER]);
      const context = createMockExecutionContext({ role: Role.ADMIN });

      expect(guard.canActivate(context)).toBe(true);
    });

    it('MEMBER accessing member endpoint (admin + member allowed): SUCCESS', () => {
      mockGuardCalls(false, [Role.ADMIN, Role.MEMBER]);
      const context = createMockExecutionContext({ role: Role.MEMBER });

      expect(guard.canActivate(context)).toBe(true);
    });

    it('VIEWER accessing member endpoint (admin + member allowed): FAILURE', () => {
      mockGuardCalls(false, [Role.ADMIN, Role.MEMBER]);
      const context = createMockExecutionContext({ role: Role.VIEWER });

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('VIEWER accessing viewer-only endpoint: SUCCESS', () => {
      mockGuardCalls(false, [Role.VIEWER]);
      const context = createMockExecutionContext({ role: Role.VIEWER });

      expect(guard.canActivate(context)).toBe(true);
    });
  });

  // ============================================================
  // Performance and Concurrency
  // ============================================================
  describe('Performance considerations', () => {
    it('should handle rapid successive calls', () => {
      const context = createMockExecutionContext({ role: Role.ADMIN });

      // Simulate rapid calls - each canActivate makes 2 calls to getAllAndOverride
      for (let i = 0; i < 100; i++) {
        mockGuardCalls(false, [Role.ADMIN]);
      }

      for (let i = 0; i < 100; i++) {
        const result = guard.canActivate(context);
        expect(result).toBe(true);
      }

      // 2 calls per canActivate (IS_PUBLIC_KEY + ROLES_KEY) x 100 = 200
      expect(reflector.getAllAndOverride).toHaveBeenCalledTimes(200);
    });

    it('should handle different contexts in sequence', () => {
      const adminContext = createMockExecutionContext({ role: Role.ADMIN });
      const memberContext = createMockExecutionContext({ role: Role.MEMBER });
      const viewerContext = createMockExecutionContext({ role: Role.VIEWER });

      // Mock for admin call
      mockGuardCalls(false, [Role.ADMIN, Role.MEMBER]);
      expect(guard.canActivate(adminContext)).toBe(true);

      // Mock for member call
      mockGuardCalls(false, [Role.ADMIN, Role.MEMBER]);
      expect(guard.canActivate(memberContext)).toBe(true);

      // Mock for viewer call
      mockGuardCalls(false, [Role.ADMIN, Role.MEMBER]);
      expect(() => guard.canActivate(viewerContext)).toThrow(ForbiddenException);
    });
  });
});
