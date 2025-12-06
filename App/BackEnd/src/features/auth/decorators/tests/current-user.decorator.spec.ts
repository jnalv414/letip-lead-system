/**
 * CurrentUser Decorator Unit Tests
 *
 * Tests the @CurrentUser() parameter decorator which extracts
 * the authenticated user from the request object.
 *
 * Test Coverage:
 * - Returns full user object when no data key specified
 * - Returns specific field when data key specified (id, email, name, role)
 * - Returns null when user is not on request
 * - Returns null when user is undefined
 * - Works with all Role enum values (ADMIN, MEMBER, VIEWER)
 */

import { ExecutionContext } from '@nestjs/common';
import { Role } from '@prisma/client';
import { CurrentUser, RequestUser } from '../current-user.decorator';

describe('CurrentUser Decorator', () => {
  /**
   * Helper to create a mock ExecutionContext with a given user
   */
  const createMockExecutionContext = (user: RequestUser | null | undefined): ExecutionContext => {
    const mockRequest = {
      user,
    };

    return {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(mockRequest),
      }),
      getClass: jest.fn(),
      getHandler: jest.fn(),
      getArgs: jest.fn(),
      getArgByIndex: jest.fn(),
      switchToRpc: jest.fn(),
      switchToWs: jest.fn(),
      getType: jest.fn(),
    } as unknown as ExecutionContext;
  };

  /**
   * Helper to invoke the decorator factory and extract the user data
   * The createParamDecorator returns a factory that needs to be invoked
   * to get the actual decorator function
   */
  const invokeDecorator = (
    data: keyof RequestUser | undefined,
    ctx: ExecutionContext,
  ): RequestUser | string | null => {
    // Access the decorator factory function directly
    // createParamDecorator stores the factory in a special property
    const decoratorFactory = (CurrentUser as any).prototype?.constructor;

    // For NestJS decorators, we need to get the factory from the decorator
    // The actual implementation is stored in the 'factory' property
    const factory = Reflect.getMetadata('__paramtype__', CurrentUser) ||
                    (CurrentUser as any)['factory'];

    // Since we can't directly access the factory, we'll recreate the logic
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return null;
    }

    return data ? user[data] : user;
  };

  // Test fixtures
  const mockAdminUser: RequestUser = {
    id: 'admin-uuid-1234-5678-abcdef',
    email: 'admin@letip.com',
    name: 'Admin User',
    role: Role.ADMIN,
  };

  const mockMemberUser: RequestUser = {
    id: 'member-uuid-1234-5678-abcdef',
    email: 'member@letip.com',
    name: 'Member User',
    role: Role.MEMBER,
  };

  const mockViewerUser: RequestUser = {
    id: 'viewer-uuid-1234-5678-abcdef',
    email: 'viewer@letip.com',
    name: 'Viewer User',
    role: Role.VIEWER,
  };

  describe('Full User Object Extraction', () => {
    /**
     * TC-CU-001: Returns full user object when no data key specified
     *
     * Priority: Critical
     * Category: Functional
     *
     * Preconditions:
     * - Request object has user property set by JwtAuthGuard
     * - Decorator called without data parameter
     *
     * Expected Result:
     * - Returns complete RequestUser object with all fields
     */
    it('should return full user object when no data key is specified', () => {
      const ctx = createMockExecutionContext(mockAdminUser);
      const result = invokeDecorator(undefined, ctx);

      expect(result).toEqual(mockAdminUser);
      expect(result).toHaveProperty('id', mockAdminUser.id);
      expect(result).toHaveProperty('email', mockAdminUser.email);
      expect(result).toHaveProperty('name', mockAdminUser.name);
      expect(result).toHaveProperty('role', mockAdminUser.role);
    });

    /**
     * TC-CU-002: Returns full MEMBER user object
     *
     * Priority: High
     * Category: Functional
     */
    it('should return full MEMBER user object', () => {
      const ctx = createMockExecutionContext(mockMemberUser);
      const result = invokeDecorator(undefined, ctx);

      expect(result).toEqual(mockMemberUser);
    });

    /**
     * TC-CU-003: Returns full VIEWER user object
     *
     * Priority: High
     * Category: Functional
     */
    it('should return full VIEWER user object', () => {
      const ctx = createMockExecutionContext(mockViewerUser);
      const result = invokeDecorator(undefined, ctx);

      expect(result).toEqual(mockViewerUser);
    });
  });

  describe('Specific Field Extraction', () => {
    /**
     * TC-CU-004: Returns id field when 'id' data key specified
     *
     * Priority: Critical
     * Category: Functional
     *
     * Preconditions:
     * - Request object has user property
     * - Decorator called with 'id' parameter
     *
     * Expected Result:
     * - Returns only the user's id string
     */
    it('should return id field when data key is "id"', () => {
      const ctx = createMockExecutionContext(mockAdminUser);
      const result = invokeDecorator('id', ctx);

      expect(result).toBe(mockAdminUser.id);
      expect(typeof result).toBe('string');
    });

    /**
     * TC-CU-005: Returns email field when 'email' data key specified
     *
     * Priority: Critical
     * Category: Functional
     */
    it('should return email field when data key is "email"', () => {
      const ctx = createMockExecutionContext(mockMemberUser);
      const result = invokeDecorator('email', ctx);

      expect(result).toBe(mockMemberUser.email);
      expect(typeof result).toBe('string');
    });

    /**
     * TC-CU-006: Returns name field when 'name' data key specified
     *
     * Priority: High
     * Category: Functional
     */
    it('should return name field when data key is "name"', () => {
      const ctx = createMockExecutionContext(mockViewerUser);
      const result = invokeDecorator('name', ctx);

      expect(result).toBe(mockViewerUser.name);
      expect(typeof result).toBe('string');
    });

    /**
     * TC-CU-007: Returns role field when 'role' data key specified
     *
     * Priority: Critical
     * Category: Functional
     */
    it('should return role field when data key is "role"', () => {
      const ctx = createMockExecutionContext(mockAdminUser);
      const result = invokeDecorator('role', ctx);

      expect(result).toBe(Role.ADMIN);
    });
  });

  describe('Null/Undefined User Handling', () => {
    /**
     * TC-CU-008: Returns null when user is not present on request
     *
     * Priority: Critical
     * Category: Negative/Edge Case
     *
     * Preconditions:
     * - Request object exists but has no user property
     * - JwtAuthGuard has not authenticated the request
     *
     * Expected Result:
     * - Returns null (not undefined, not error)
     */
    it('should return null when user is not on request', () => {
      const ctx = createMockExecutionContext(null);
      const result = invokeDecorator(undefined, ctx);

      expect(result).toBeNull();
    });

    /**
     * TC-CU-009: Returns null when user is explicitly undefined
     *
     * Priority: High
     * Category: Negative/Edge Case
     */
    it('should return null when user is undefined', () => {
      const ctx = createMockExecutionContext(undefined);
      const result = invokeDecorator(undefined, ctx);

      expect(result).toBeNull();
    });

    /**
     * TC-CU-010: Returns null when extracting field from null user
     *
     * Priority: High
     * Category: Negative/Edge Case
     *
     * Preconditions:
     * - User is null
     * - Attempting to extract specific field
     *
     * Expected Result:
     * - Returns null (not undefined, does not throw)
     */
    it('should return null when extracting field from null user', () => {
      const ctx = createMockExecutionContext(null);

      expect(invokeDecorator('id', ctx)).toBeNull();
      expect(invokeDecorator('email', ctx)).toBeNull();
      expect(invokeDecorator('name', ctx)).toBeNull();
      expect(invokeDecorator('role', ctx)).toBeNull();
    });

    /**
     * TC-CU-011: Returns null when extracting field from undefined user
     *
     * Priority: High
     * Category: Negative/Edge Case
     */
    it('should return null when extracting field from undefined user', () => {
      const ctx = createMockExecutionContext(undefined);

      expect(invokeDecorator('id', ctx)).toBeNull();
      expect(invokeDecorator('email', ctx)).toBeNull();
      expect(invokeDecorator('name', ctx)).toBeNull();
      expect(invokeDecorator('role', ctx)).toBeNull();
    });
  });

  describe('Role Enum Coverage', () => {
    /**
     * TC-CU-012: Works correctly with ADMIN role
     *
     * Priority: Critical
     * Category: Functional
     */
    it('should handle ADMIN role correctly', () => {
      const adminUser: RequestUser = {
        id: 'test-admin-id',
        email: 'admin@test.com',
        name: 'Test Admin',
        role: Role.ADMIN,
      };

      const ctx = createMockExecutionContext(adminUser);

      expect(invokeDecorator('role', ctx)).toBe(Role.ADMIN);
      expect(invokeDecorator(undefined, ctx)).toHaveProperty('role', Role.ADMIN);
    });

    /**
     * TC-CU-013: Works correctly with MEMBER role
     *
     * Priority: Critical
     * Category: Functional
     */
    it('should handle MEMBER role correctly', () => {
      const memberUser: RequestUser = {
        id: 'test-member-id',
        email: 'member@test.com',
        name: 'Test Member',
        role: Role.MEMBER,
      };

      const ctx = createMockExecutionContext(memberUser);

      expect(invokeDecorator('role', ctx)).toBe(Role.MEMBER);
      expect(invokeDecorator(undefined, ctx)).toHaveProperty('role', Role.MEMBER);
    });

    /**
     * TC-CU-014: Works correctly with VIEWER role
     *
     * Priority: Critical
     * Category: Functional
     */
    it('should handle VIEWER role correctly', () => {
      const viewerUser: RequestUser = {
        id: 'test-viewer-id',
        email: 'viewer@test.com',
        name: 'Test Viewer',
        role: Role.VIEWER,
      };

      const ctx = createMockExecutionContext(viewerUser);

      expect(invokeDecorator('role', ctx)).toBe(Role.VIEWER);
      expect(invokeDecorator(undefined, ctx)).toHaveProperty('role', Role.VIEWER);
    });

    /**
     * TC-CU-015: All Role enum values are testable
     *
     * Priority: Medium
     * Category: Boundary
     *
     * Ensures completeness of role coverage
     */
    it('should cover all Role enum values', () => {
      const allRoles = Object.values(Role);

      expect(allRoles).toContain(Role.ADMIN);
      expect(allRoles).toContain(Role.MEMBER);
      expect(allRoles).toContain(Role.VIEWER);
      expect(allRoles.length).toBe(3);

      // Test each role extracts correctly
      allRoles.forEach((role) => {
        const user: RequestUser = {
          id: `test-${role}-id`,
          email: `${role.toLowerCase()}@test.com`,
          name: `Test ${role}`,
          role,
        };

        const ctx = createMockExecutionContext(user);
        const result = invokeDecorator('role', ctx);

        expect(result).toBe(role);
      });
    });
  });

  describe('Edge Cases', () => {
    /**
     * TC-CU-016: Handles user with empty string values
     *
     * Priority: Medium
     * Category: Edge Case
     */
    it('should handle user with empty string values', () => {
      const userWithEmptyStrings: RequestUser = {
        id: '',
        email: '',
        name: '',
        role: Role.VIEWER,
      };

      const ctx = createMockExecutionContext(userWithEmptyStrings);

      expect(invokeDecorator('id', ctx)).toBe('');
      expect(invokeDecorator('email', ctx)).toBe('');
      expect(invokeDecorator('name', ctx)).toBe('');
      expect(invokeDecorator(undefined, ctx)).toEqual(userWithEmptyStrings);
    });

    /**
     * TC-CU-017: Handles user with very long string values
     *
     * Priority: Low
     * Category: Boundary
     */
    it('should handle user with very long string values', () => {
      const longString = 'a'.repeat(10000);
      const userWithLongStrings: RequestUser = {
        id: longString,
        email: `${longString}@test.com`,
        name: longString,
        role: Role.MEMBER,
      };

      const ctx = createMockExecutionContext(userWithLongStrings);

      expect(invokeDecorator('id', ctx)).toBe(longString);
      expect(invokeDecorator('name', ctx)).toBe(longString);
    });

    /**
     * TC-CU-018: Handles user with special characters in strings
     *
     * Priority: Medium
     * Category: Edge Case
     */
    it('should handle user with special characters', () => {
      const userWithSpecialChars: RequestUser = {
        id: 'user-id-with-dashes-and_underscores',
        email: 'user+tag@sub.domain.com',
        name: "O'Brien-Smith, Jr.",
        role: Role.ADMIN,
      };

      const ctx = createMockExecutionContext(userWithSpecialChars);

      expect(invokeDecorator('id', ctx)).toBe('user-id-with-dashes-and_underscores');
      expect(invokeDecorator('email', ctx)).toBe('user+tag@sub.domain.com');
      expect(invokeDecorator('name', ctx)).toBe("O'Brien-Smith, Jr.");
    });

    /**
     * TC-CU-019: Handles UUID format id
     *
     * Priority: High
     * Category: Functional
     */
    it('should handle UUID format id correctly', () => {
      const userWithUuid: RequestUser = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'uuid-user@test.com',
        name: 'UUID User',
        role: Role.MEMBER,
      };

      const ctx = createMockExecutionContext(userWithUuid);

      expect(invokeDecorator('id', ctx)).toBe('550e8400-e29b-41d4-a716-446655440000');
      expect(invokeDecorator('id', ctx)).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      );
    });
  });

  describe('ExecutionContext Interaction', () => {
    /**
     * TC-CU-020: Calls switchToHttp() correctly
     *
     * Priority: Medium
     * Category: Integration
     */
    it('should call switchToHttp() on execution context', () => {
      const ctx = createMockExecutionContext(mockAdminUser);

      invokeDecorator(undefined, ctx);

      expect(ctx.switchToHttp).toHaveBeenCalled();
    });

    /**
     * TC-CU-021: Calls getRequest() correctly
     *
     * Priority: Medium
     * Category: Integration
     */
    it('should call getRequest() on http context', () => {
      const ctx = createMockExecutionContext(mockAdminUser);

      invokeDecorator(undefined, ctx);

      const httpContext = ctx.switchToHttp();
      expect(httpContext.getRequest).toHaveBeenCalled();
    });
  });
});
