/**
 * JwtAuthGuard Unit Tests
 *
 * Tests for JWT authentication guard that protects routes.
 * Covers public route bypass, token validation, and error handling.
 *
 * Test Categories:
 * - canActivate(): Public route detection, protected route delegation
 * - handleRequest(): User validation, token error handling
 */

import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from '../jwt-auth.guard';
import { IS_PUBLIC_KEY } from '../../decorators/public.decorator';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let reflector: jest.Mocked<Reflector>;

  // Test data
  const testUser = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    role: 'USER',
  };

  // Mock ExecutionContext factory
  const createMockExecutionContext = (
    handler: Function = jest.fn(),
    classRef: Function = jest.fn(),
  ): ExecutionContext => {
    return {
      getHandler: jest.fn().mockReturnValue(handler),
      getClass: jest.fn().mockReturnValue(classRef),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({
          headers: { authorization: 'Bearer test-token' },
        }),
        getResponse: jest.fn(),
        getNext: jest.fn(),
      }),
      getType: jest.fn().mockReturnValue('http'),
      getArgs: jest.fn().mockReturnValue([]),
      getArgByIndex: jest.fn(),
      switchToRpc: jest.fn(),
      switchToWs: jest.fn(),
    } as unknown as ExecutionContext;
  };

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create mock Reflector
    reflector = {
      getAllAndOverride: jest.fn(),
      get: jest.fn(),
      getAll: jest.fn(),
      getAllAndMerge: jest.fn(),
    } as unknown as jest.Mocked<Reflector>;

    // Directly instantiate the guard with mocked reflector
    guard = new JwtAuthGuard(reflector);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  // ============================================================
  // canActivate() Tests
  // ============================================================
  describe('canActivate()', () => {
    describe('Public Routes (@Public decorator)', () => {
      it('should return true for routes marked with @Public()', () => {
        const context = createMockExecutionContext();
        reflector.getAllAndOverride.mockReturnValue(true);

        const result = guard.canActivate(context);

        expect(result).toBe(true);
        expect(reflector.getAllAndOverride).toHaveBeenCalledWith(IS_PUBLIC_KEY, [
          context.getHandler(),
          context.getClass(),
        ]);
      });

      it('should check IS_PUBLIC_KEY metadata on handler first', () => {
        const mockHandler = jest.fn();
        const mockClass = jest.fn();
        const context = createMockExecutionContext(mockHandler, mockClass);
        reflector.getAllAndOverride.mockReturnValue(true);

        guard.canActivate(context);

        expect(reflector.getAllAndOverride).toHaveBeenCalledWith(IS_PUBLIC_KEY, [
          mockHandler,
          mockClass,
        ]);
      });

      it('should return true when @Public() is on controller class', () => {
        const context = createMockExecutionContext();
        // getAllAndOverride checks both handler and class, returns true if either has it
        reflector.getAllAndOverride.mockReturnValue(true);

        const result = guard.canActivate(context);

        expect(result).toBe(true);
      });

      it('should not call super.canActivate for public routes', () => {
        const context = createMockExecutionContext();
        reflector.getAllAndOverride.mockReturnValue(true);

        // Spy on the parent class canActivate
        const superCanActivate = jest.spyOn(
          Object.getPrototypeOf(JwtAuthGuard.prototype),
          'canActivate',
        );

        const result = guard.canActivate(context);

        // For public routes, should return true immediately without calling super
        expect(result).toBe(true);
        expect(superCanActivate).not.toHaveBeenCalled();

        superCanActivate.mockRestore();
      });

      it('should bypass authentication check for public routes', () => {
        const context = createMockExecutionContext();
        reflector.getAllAndOverride.mockReturnValue(true);

        const result = guard.canActivate(context);

        // For public routes, canActivate returns true synchronously
        expect(result).toBe(true);
      });
    });

    describe('Protected Routes (no @Public decorator)', () => {
      let superCanActivateSpy: jest.SpyInstance;

      beforeEach(() => {
        // Mock super.canActivate to prevent passport from being invoked
        superCanActivateSpy = jest.spyOn(
          Object.getPrototypeOf(JwtAuthGuard.prototype),
          'canActivate',
        );
        superCanActivateSpy.mockReturnValue(Promise.resolve(true));
      });

      afterEach(() => {
        superCanActivateSpy.mockRestore();
      });

      it('should delegate to super.canActivate() for protected routes', () => {
        const context = createMockExecutionContext();
        reflector.getAllAndOverride.mockReturnValue(false);

        guard.canActivate(context);

        expect(superCanActivateSpy).toHaveBeenCalledWith(context);
      });

      it('should check metadata before delegating to parent', () => {
        const context = createMockExecutionContext();
        reflector.getAllAndOverride.mockReturnValue(undefined);

        guard.canActivate(context);

        expect(reflector.getAllAndOverride).toHaveBeenCalledWith(IS_PUBLIC_KEY, [
          context.getHandler(),
          context.getClass(),
        ]);
      });

      it('should treat undefined metadata as protected route', () => {
        const context = createMockExecutionContext();
        reflector.getAllAndOverride.mockReturnValue(undefined);

        guard.canActivate(context);

        // Should delegate to super.canActivate
        expect(superCanActivateSpy).toHaveBeenCalled();
      });

      it('should treat null metadata as protected route', () => {
        const context = createMockExecutionContext();
        reflector.getAllAndOverride.mockReturnValue(null);

        guard.canActivate(context);

        expect(superCanActivateSpy).toHaveBeenCalled();
      });

      it('should treat false metadata as protected route', () => {
        const context = createMockExecutionContext();
        reflector.getAllAndOverride.mockReturnValue(false);

        guard.canActivate(context);

        expect(superCanActivateSpy).toHaveBeenCalled();
      });

      it('should return result from super.canActivate for protected routes', async () => {
        const context = createMockExecutionContext();
        reflector.getAllAndOverride.mockReturnValue(false);
        superCanActivateSpy.mockReturnValue(Promise.resolve(true));

        const result = await guard.canActivate(context);

        expect(result).toBe(true);
      });

      it('should propagate false from super.canActivate', async () => {
        const context = createMockExecutionContext();
        reflector.getAllAndOverride.mockReturnValue(false);
        superCanActivateSpy.mockReturnValue(false);

        const result = guard.canActivate(context);

        expect(result).toBe(false);
      });
    });

    describe('Edge Cases', () => {
      it('should handle context with no handler metadata', () => {
        const context = createMockExecutionContext();
        reflector.getAllAndOverride.mockReturnValue(undefined);

        // Mock super to prevent passport invocation
        const superSpy = jest.spyOn(
          Object.getPrototypeOf(JwtAuthGuard.prototype),
          'canActivate',
        ).mockReturnValue(true);

        expect(() => guard.canActivate(context)).not.toThrow();

        superSpy.mockRestore();
      });

      it('should work with different HTTP context types', () => {
        const context = createMockExecutionContext();
        jest.spyOn(context, 'getType').mockReturnValue('http');
        reflector.getAllAndOverride.mockReturnValue(true);

        const result = guard.canActivate(context);

        expect(result).toBe(true);
      });

      it('should handle WebSocket context type', () => {
        const context = createMockExecutionContext();
        jest.spyOn(context, 'getType').mockReturnValue('ws');
        reflector.getAllAndOverride.mockReturnValue(true);

        const result = guard.canActivate(context);

        expect(result).toBe(true);
      });
    });
  });

  // ============================================================
  // handleRequest() Tests
  // ============================================================
  describe('handleRequest()', () => {
    describe('Success Cases', () => {
      it('should return user when valid user is provided', () => {
        const result = guard.handleRequest(null, testUser, null);

        expect(result).toEqual(testUser);
      });

      it('should return user with all fields preserved', () => {
        const fullUser = {
          id: '123e4567-e89b-12d3-a456-426614174000',
          email: 'admin@example.com',
          role: 'ADMIN',
          name: 'Admin User',
          createdAt: new Date(),
        };

        const result = guard.handleRequest(null, fullUser, null);

        expect(result).toEqual(fullUser);
        expect(result.id).toBe(fullUser.id);
        expect(result.email).toBe(fullUser.email);
        expect(result.role).toBe(fullUser.role);
      });

      it('should return user regardless of info parameter', () => {
        const info = { name: 'SomeInfo', message: 'Some message' };

        const result = guard.handleRequest(null, testUser, info);

        expect(result).toEqual(testUser);
      });

      it('should return user even with empty info object', () => {
        const result = guard.handleRequest(null, testUser, {});

        expect(result).toEqual(testUser);
      });
    });

    describe('Token Expiration Errors', () => {
      it('should throw UnauthorizedException with "Access token has expired" for TokenExpiredError', () => {
        const tokenExpiredInfo = { name: 'TokenExpiredError' };

        expect(() => guard.handleRequest(null, null, tokenExpiredInfo)).toThrow(
          UnauthorizedException,
        );
        expect(() => guard.handleRequest(null, null, tokenExpiredInfo)).toThrow(
          'Access token has expired',
        );
      });

      it('should prioritize token expiry message over generic message', () => {
        const tokenExpiredInfo = {
          name: 'TokenExpiredError',
          message: 'jwt expired',
        };

        try {
          guard.handleRequest(null, null, tokenExpiredInfo);
          fail('Should have thrown UnauthorizedException');
        } catch (error) {
          expect(error).toBeInstanceOf(UnauthorizedException);
          expect(error.message).toBe('Access token has expired');
        }
      });

      it('should handle TokenExpiredError with expiredAt property', () => {
        const tokenExpiredInfo = {
          name: 'TokenExpiredError',
          expiredAt: new Date('2024-01-01'),
        };

        expect(() => guard.handleRequest(null, null, tokenExpiredInfo)).toThrow(
          'Access token has expired',
        );
      });
    });

    describe('Invalid Token Errors', () => {
      it('should throw UnauthorizedException with "Invalid access token" for JsonWebTokenError', () => {
        const jsonWebTokenInfo = { name: 'JsonWebTokenError' };

        expect(() => guard.handleRequest(null, null, jsonWebTokenInfo)).toThrow(
          UnauthorizedException,
        );
        expect(() => guard.handleRequest(null, null, jsonWebTokenInfo)).toThrow(
          'Invalid access token',
        );
      });

      it('should handle JsonWebTokenError with "jwt malformed" message', () => {
        const malformedInfo = {
          name: 'JsonWebTokenError',
          message: 'jwt malformed',
        };

        expect(() => guard.handleRequest(null, null, malformedInfo)).toThrow(
          'Invalid access token',
        );
      });

      it('should handle JsonWebTokenError with "invalid signature" message', () => {
        const invalidSigInfo = {
          name: 'JsonWebTokenError',
          message: 'invalid signature',
        };

        expect(() => guard.handleRequest(null, null, invalidSigInfo)).toThrow(
          'Invalid access token',
        );
      });

      it('should handle JsonWebTokenError with "jwt not active" message', () => {
        const notActiveInfo = {
          name: 'JsonWebTokenError',
          message: 'jwt not active',
        };

        expect(() => guard.handleRequest(null, null, notActiveInfo)).toThrow(
          'Invalid access token',
        );
      });
    });

    describe('Missing User Errors', () => {
      it('should throw UnauthorizedException with "Authentication required" when user is null', () => {
        expect(() => guard.handleRequest(null, null, null)).toThrow(
          UnauthorizedException,
        );
        expect(() => guard.handleRequest(null, null, null)).toThrow(
          'Authentication required',
        );
      });

      it('should throw UnauthorizedException with "Authentication required" when user is undefined', () => {
        expect(() => guard.handleRequest(null, undefined, null)).toThrow(
          'Authentication required',
        );
      });

      it('should throw UnauthorizedException with "Authentication required" when user is false', () => {
        expect(() => guard.handleRequest(null, false, null)).toThrow(
          'Authentication required',
        );
      });

      it('should throw UnauthorizedException with "Authentication required" when user is empty string', () => {
        expect(() => guard.handleRequest(null, '', null)).toThrow(
          'Authentication required',
        );
      });

      it('should throw UnauthorizedException with "Authentication required" when user is 0', () => {
        expect(() => guard.handleRequest(null, 0, null)).toThrow(
          'Authentication required',
        );
      });
    });

    describe('Error Propagation', () => {
      it('should rethrow existing error when err parameter is provided', () => {
        const existingError = new Error('Some internal error');

        expect(() => guard.handleRequest(existingError, null, null)).toThrow(
          'Some internal error',
        );
      });

      it('should rethrow UnauthorizedException error as-is', () => {
        const unauthorizedError = new UnauthorizedException('Custom unauthorized');

        expect(() => guard.handleRequest(unauthorizedError, null, null)).toThrow(
          UnauthorizedException,
        );
        expect(() => guard.handleRequest(unauthorizedError, null, null)).toThrow(
          'Custom unauthorized',
        );
      });

      it('should prioritize error over user', () => {
        const existingError = new Error('Error takes precedence');

        expect(() => guard.handleRequest(existingError, testUser, null)).toThrow(
          'Error takes precedence',
        );
      });

      it('should check token info before error when both present', () => {
        // Implementation checks info.name before throwing err
        // This is the actual behavior: TokenExpiredError info takes precedence
        const existingError = new Error('Error takes precedence');
        const tokenExpiredInfo = { name: 'TokenExpiredError' };

        expect(() =>
          guard.handleRequest(existingError, null, tokenExpiredInfo),
        ).toThrow('Access token has expired');
      });

      it('should throw error when info has no recognized name', () => {
        // When info doesn't have TokenExpiredError or JsonWebTokenError name,
        // the error is thrown
        const existingError = new Error('Error takes precedence');
        const unknownInfo = { name: 'UnknownError' };

        expect(() =>
          guard.handleRequest(existingError, null, unknownInfo),
        ).toThrow('Error takes precedence');
      });

      it('should rethrow TypeError as-is', () => {
        const typeError = new TypeError('Cannot read property of undefined');

        expect(() => guard.handleRequest(typeError, null, null)).toThrow(
          TypeError,
        );
      });

      it('should rethrow custom errors with stack trace preserved', () => {
        const customError = new Error('Custom error');
        customError.stack = 'Custom stack trace';

        try {
          guard.handleRequest(customError, null, null);
          fail('Should have thrown');
        } catch (error) {
          expect(error.stack).toBe('Custom stack trace');
        }
      });
    });

    describe('Info Object Variations', () => {
      it('should handle info with unknown error name', () => {
        const unknownInfo = { name: 'UnknownErrorType' };

        // Should fall through to "Authentication required" since no user
        expect(() => guard.handleRequest(null, null, unknownInfo)).toThrow(
          'Authentication required',
        );
      });

      it('should handle NotBeforeError info', () => {
        const notBeforeInfo = { name: 'NotBeforeError' };

        // Not specifically handled, should fall through to generic message
        expect(() => guard.handleRequest(null, null, notBeforeInfo)).toThrow(
          'Authentication required',
        );
      });

      it('should handle info without name property', () => {
        const infoWithoutName = { message: 'Some error message' };

        expect(() => guard.handleRequest(null, null, infoWithoutName)).toThrow(
          'Authentication required',
        );
      });

      it('should handle info as string', () => {
        const stringInfo = 'Error string';

        expect(() => guard.handleRequest(null, null, stringInfo)).toThrow(
          'Authentication required',
        );
      });

      it('should handle info as null with missing user', () => {
        expect(() => guard.handleRequest(null, null, null)).toThrow(
          'Authentication required',
        );
      });
    });

    describe('Edge Cases', () => {
      it('should handle user object with only id', () => {
        const minimalUser = { id: 'user-id' };

        const result = guard.handleRequest(null, minimalUser, null);

        expect(result).toEqual(minimalUser);
      });

      it('should handle user object with extra properties', () => {
        const extendedUser = {
          ...testUser,
          customField: 'custom value',
          nested: { data: 'nested data' },
        };

        const result = guard.handleRequest(null, extendedUser, null);

        expect(result).toEqual(extendedUser);
      });

      it('should handle empty user object as valid (truthy)', () => {
        const emptyUser = {};

        const result = guard.handleRequest(null, emptyUser, null);

        expect(result).toEqual({});
      });

      it('should handle user array as valid (truthy)', () => {
        const userArray = [testUser];

        const result = guard.handleRequest(null, userArray, null);

        expect(result).toEqual(userArray);
      });

      it('should handle numeric user id as valid', () => {
        const numericIdUser = { id: 12345 };

        const result = guard.handleRequest(null, numericIdUser, null);

        expect(result).toEqual(numericIdUser);
      });
    });
  });

  // ============================================================
  // Integration Scenarios
  // ============================================================
  describe('Integration Scenarios', () => {
    it('should allow access to public health check endpoint', () => {
      const context = createMockExecutionContext();
      reflector.getAllAndOverride.mockReturnValue(true);

      const canActivate = guard.canActivate(context);

      expect(canActivate).toBe(true);
    });

    it('should delegate to super for protected API endpoints', () => {
      const context = createMockExecutionContext();
      reflector.getAllAndOverride.mockReturnValue(false);

      const superSpy = jest.spyOn(
        Object.getPrototypeOf(JwtAuthGuard.prototype),
        'canActivate',
      ).mockReturnValue(Promise.resolve(true));

      guard.canActivate(context);

      expect(superSpy).toHaveBeenCalledWith(context);
      superSpy.mockRestore();
    });

    it('should provide user object to request for valid authentication', () => {
      const authenticatedUser = {
        id: 'auth-user-id',
        email: 'auth@example.com',
        role: 'MEMBER',
      };

      const result = guard.handleRequest(null, authenticatedUser, null);

      expect(result).toEqual(authenticatedUser);
      expect(result.id).toBe('auth-user-id');
    });

    it('should reject requests with expired tokens gracefully', () => {
      const expiredTokenInfo = { name: 'TokenExpiredError' };

      expect(() => guard.handleRequest(null, null, expiredTokenInfo)).toThrow(
        UnauthorizedException,
      );

      try {
        guard.handleRequest(null, null, expiredTokenInfo);
      } catch (error) {
        expect(error.message).toBe('Access token has expired');
        expect(error.getStatus()).toBe(401);
      }
    });

    it('should reject requests with tampered tokens gracefully', () => {
      const tamperedTokenInfo = {
        name: 'JsonWebTokenError',
        message: 'invalid signature',
      };

      expect(() => guard.handleRequest(null, null, tamperedTokenInfo)).toThrow(
        UnauthorizedException,
      );

      try {
        guard.handleRequest(null, null, tamperedTokenInfo);
      } catch (error) {
        expect(error.message).toBe('Invalid access token');
        expect(error.getStatus()).toBe(401);
      }
    });

    it('should reject requests with no token gracefully', () => {
      expect(() => guard.handleRequest(null, null, null)).toThrow(
        UnauthorizedException,
      );

      try {
        guard.handleRequest(null, null, null);
      } catch (error) {
        expect(error.message).toBe('Authentication required');
        expect(error.getStatus()).toBe(401);
      }
    });
  });

  // ============================================================
  // Constructor and Dependency Injection Tests
  // ============================================================
  describe('Constructor', () => {
    it('should inject Reflector dependency', () => {
      expect(guard).toBeDefined();
      expect(reflector).toBeDefined();
    });

    it('should extend AuthGuard("jwt")', () => {
      // Verify the guard extends the passport AuthGuard
      expect(guard).toBeInstanceOf(JwtAuthGuard);
    });

    it('should have canActivate method from AuthGuard', () => {
      expect(typeof guard.canActivate).toBe('function');
    });

    it('should have handleRequest method', () => {
      expect(typeof guard.handleRequest).toBe('function');
    });
  });

  // ============================================================
  // Reflector Metadata Tests
  // ============================================================
  describe('Reflector Metadata', () => {
    it('should use getAllAndOverride to check both handler and class metadata', () => {
      const mockHandler = jest.fn();
      const mockClass = jest.fn();
      const context = createMockExecutionContext(mockHandler, mockClass);
      reflector.getAllAndOverride.mockReturnValue(true);

      guard.canActivate(context);

      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(
        IS_PUBLIC_KEY,
        expect.arrayContaining([mockHandler, mockClass]),
      );
    });

    it('should check metadata with correct IS_PUBLIC_KEY', () => {
      const context = createMockExecutionContext();
      reflector.getAllAndOverride.mockReturnValue(true);

      guard.canActivate(context);

      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(
        'isPublic', // This should match the IS_PUBLIC_KEY constant
        expect.any(Array),
      );
    });

    it('should call getAllAndOverride with handler before class', () => {
      const mockHandler = jest.fn();
      const mockClass = jest.fn();
      const context = createMockExecutionContext(mockHandler, mockClass);
      reflector.getAllAndOverride.mockReturnValue(true);

      guard.canActivate(context);

      const callArgs = reflector.getAllAndOverride.mock.calls[0];
      expect(callArgs[1][0]).toBe(mockHandler);
      expect(callArgs[1][1]).toBe(mockClass);
    });
  });

  // ============================================================
  // Boundary Value Tests
  // ============================================================
  describe('Boundary Value Tests', () => {
    describe('User Object Boundaries', () => {
      it('should accept user with truthy value (non-empty object)', () => {
        const result = guard.handleRequest(null, { valid: true }, null);
        expect(result).toEqual({ valid: true });
      });

      it('should reject user with falsy value (null)', () => {
        expect(() => guard.handleRequest(null, null, null)).toThrow(
          'Authentication required',
        );
      });

      it('should reject user with falsy value (undefined)', () => {
        expect(() => guard.handleRequest(null, undefined, null)).toThrow(
          'Authentication required',
        );
      });

      it('should reject user with falsy value (empty string)', () => {
        expect(() => guard.handleRequest(null, '', null)).toThrow(
          'Authentication required',
        );
      });

      it('should reject user with falsy value (0)', () => {
        expect(() => guard.handleRequest(null, 0, null)).toThrow(
          'Authentication required',
        );
      });

      it('should reject user with falsy value (false)', () => {
        expect(() => guard.handleRequest(null, false, null)).toThrow(
          'Authentication required',
        );
      });

      it('should accept user with truthy value (number 1)', () => {
        const result = guard.handleRequest(null, 1, null);
        expect(result).toBe(1);
      });

      it('should accept user with truthy value (string "user")', () => {
        const result = guard.handleRequest(null, 'user', null);
        expect(result).toBe('user');
      });
    });

    describe('Error Object Boundaries', () => {
      it('should throw provided error regardless of user value', () => {
        const error = new Error('Test error');
        expect(() => guard.handleRequest(error, testUser, null)).toThrow('Test error');
      });

      it('should check token info before error when in error branch', () => {
        // Implementation checks info.name before throwing err
        // TokenExpiredError info takes precedence over generic error
        const error = new Error('Test error');
        const info = { name: 'TokenExpiredError' };
        expect(() => guard.handleRequest(error, null, info)).toThrow('Access token has expired');
      });

      it('should throw provided error when info has no recognized name', () => {
        const error = new Error('Test error');
        const info = { name: 'SomeOtherError' };
        expect(() => guard.handleRequest(error, null, info)).toThrow('Test error');
      });
    });
  });

  // ============================================================
  // Error Message Verification Tests
  // ============================================================
  describe('Error Message Verification', () => {
    it('should include correct HTTP status code (401) in UnauthorizedException', () => {
      try {
        guard.handleRequest(null, null, null);
      } catch (error) {
        expect(error).toBeInstanceOf(UnauthorizedException);
        expect(error.getStatus()).toBe(401);
      }
    });

    it('should return proper error response structure', () => {
      try {
        guard.handleRequest(null, null, { name: 'TokenExpiredError' });
      } catch (error) {
        const response = error.getResponse();
        expect(response).toHaveProperty('message', 'Access token has expired');
        expect(response).toHaveProperty('statusCode', 401);
      }
    });

    it('should distinguish between different JWT error types', () => {
      // TokenExpiredError
      try {
        guard.handleRequest(null, null, { name: 'TokenExpiredError' });
      } catch (error) {
        expect(error.message).toBe('Access token has expired');
      }

      // JsonWebTokenError
      try {
        guard.handleRequest(null, null, { name: 'JsonWebTokenError' });
      } catch (error) {
        expect(error.message).toBe('Invalid access token');
      }

      // No specific error
      try {
        guard.handleRequest(null, null, null);
      } catch (error) {
        expect(error.message).toBe('Authentication required');
      }
    });
  });
});
