/**
 * Auth Module Integration Tests
 *
 * Tests the full authentication flow by integrating real implementations
 * of PasswordService, TokenService, SessionService, and AuthService.
 *
 * Only PrismaService (database) is mocked to avoid database dependencies.
 *
 * Test Scenarios:
 * - Full registration -> login -> refresh -> logout flow
 * - First user becomes admin, second user becomes member
 * - Admin can create users with roles
 * - Non-admin cannot create users with roles
 * - Token refresh rotates refresh token
 * - Logout invalidates session
 * - LogoutAll invalidates all sessions
 * - Disabled account cannot login
 * - Disabled account cannot refresh
 * - Profile update flows
 */

import { Test, TestingModule } from '@nestjs/testing';
import { JwtModule, JwtService } from '@nestjs/jwt';
import {
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { Role } from '@prisma/client';

// Services under test
import { AuthService } from '../domain/auth.service';
import { PasswordService } from '../domain/password.service';
import { TokenService } from '../domain/token.service';
import { SessionService } from '../domain/session.service';

// Dependencies to mock
import { PrismaService } from '../../../prisma/prisma.service';
import { ConfigService } from '../../../config/config.service';

describe('Auth Module Integration Tests', () => {
  let module: TestingModule;
  let authService: AuthService;
  let passwordService: PasswordService;
  let tokenService: TokenService;
  let sessionService: SessionService;
  let prismaService: jest.Mocked<PrismaService>;

  // In-memory stores to simulate database
  let userStore: Map<string, any>;
  let sessionStore: Map<string, any>;
  let userIdCounter: number;
  let sessionIdCounter: number;

  // Test constants
  const TEST_JWT_SECRET = 'test-jwt-secret-for-integration-tests';
  const VALID_PASSWORD = 'Password123'; // Meets strength requirements

  /**
   * Generate a mock UUID
   */
  const generateUuid = (): string => {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  };

  /**
   * Create a mock user object
   */
  const createMockUser = (overrides: Partial<any> = {}): any => {
    const id = overrides.id || generateUuid();
    return {
      id,
      email: overrides.email || `user-${id}@test.com`,
      password_hash: overrides.password_hash || '',
      name: overrides.name || 'Test User',
      role: overrides.role || Role.MEMBER,
      is_active: overrides.is_active !== undefined ? overrides.is_active : true,
      created_at: overrides.created_at || new Date(),
      updated_at: overrides.updated_at || new Date(),
      last_login: overrides.last_login || null,
    };
  };

  /**
   * Create a mock session object
   */
  const createMockSession = (overrides: Partial<any> = {}): any => {
    const id = overrides.id || generateUuid();
    return {
      id,
      user_id: overrides.user_id || generateUuid(),
      refresh_token: overrides.refresh_token || `refresh-token-${id}`,
      user_agent: overrides.user_agent || 'Test User Agent',
      ip_address: overrides.ip_address || '127.0.0.1',
      expires_at: overrides.expires_at || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      created_at: overrides.created_at || new Date(),
      user: overrides.user || null,
    };
  };

  beforeEach(async () => {
    // Reset in-memory stores
    userStore = new Map();
    sessionStore = new Map();
    userIdCounter = 0;
    sessionIdCounter = 0;

    // Create mock PrismaService
    const mockPrismaService = {
      user: {
        findUnique: jest.fn().mockImplementation(({ where }) => {
          if (where.email) {
            for (const user of userStore.values()) {
              if (user.email === where.email) {
                return Promise.resolve(user);
              }
            }
          }
          if (where.id) {
            return Promise.resolve(userStore.get(where.id) || null);
          }
          return Promise.resolve(null);
        }),
        findFirst: jest.fn().mockImplementation(() => {
          return Promise.resolve(userStore.values().next().value || null);
        }),
        count: jest.fn().mockImplementation(() => {
          return Promise.resolve(userStore.size);
        }),
        create: jest.fn().mockImplementation(({ data }) => {
          const id = generateUuid();
          const user = {
            id,
            is_active: true, // Default to active
            ...data,
            created_at: new Date(),
            updated_at: new Date(),
          };
          userStore.set(id, user);
          return Promise.resolve(user);
        }),
        update: jest.fn().mockImplementation(({ where, data }) => {
          const user = userStore.get(where.id);
          if (user) {
            const updatedUser = { ...user, ...data, updated_at: new Date() };
            userStore.set(where.id, updatedUser);
            return Promise.resolve(updatedUser);
          }
          return Promise.resolve(null);
        }),
        delete: jest.fn().mockImplementation(({ where }) => {
          const user = userStore.get(where.id);
          userStore.delete(where.id);
          return Promise.resolve(user);
        }),
      },
      session: {
        findUnique: jest.fn().mockImplementation(({ where, include }) => {
          let session: any = null;
          if (where.refresh_token) {
            for (const s of sessionStore.values()) {
              if (s.refresh_token === where.refresh_token) {
                session = s;
                break;
              }
            }
          }
          if (where.id) {
            session = sessionStore.get(where.id) || null;
          }
          if (session && include?.user) {
            session = { ...session, user: userStore.get(session.user_id) };
          }
          return Promise.resolve(session);
        }),
        findMany: jest.fn().mockImplementation(({ where }) => {
          const sessions: any[] = [];
          for (const session of sessionStore.values()) {
            if (where.user_id && session.user_id !== where.user_id) continue;
            if (where.expires_at?.gt && session.expires_at <= where.expires_at.gt) continue;
            if (where.expires_at?.lt && session.expires_at >= where.expires_at.lt) continue;
            sessions.push(session);
          }
          return Promise.resolve(sessions);
        }),
        create: jest.fn().mockImplementation(({ data }) => {
          const id = generateUuid();
          const session = {
            id,
            ...data,
            created_at: new Date(),
          };
          sessionStore.set(id, session);
          return Promise.resolve(session);
        }),
        update: jest.fn().mockImplementation(({ where, data }) => {
          const session = sessionStore.get(where.id);
          if (session) {
            const updatedSession = { ...session, ...data };
            sessionStore.set(where.id, updatedSession);
            return Promise.resolve(updatedSession);
          }
          return Promise.resolve(null);
        }),
        delete: jest.fn().mockImplementation(({ where }) => {
          const session = sessionStore.get(where.id);
          sessionStore.delete(where.id);
          return Promise.resolve(session);
        }),
        deleteMany: jest.fn().mockImplementation(({ where }) => {
          let count = 0;
          const toDelete: string[] = [];
          for (const [id, session] of sessionStore.entries()) {
            if (where.user_id && session.user_id === where.user_id) {
              toDelete.push(id);
              count++;
            }
            if (where.expires_at?.lt && session.expires_at < where.expires_at.lt) {
              toDelete.push(id);
              count++;
            }
          }
          toDelete.forEach((id) => sessionStore.delete(id));
          return Promise.resolve({ count });
        }),
      },
    };

    // Create mock ConfigService
    const mockConfigService = {
      get: jest.fn().mockImplementation((key: string) => {
        if (key === 'JWT_SECRET') return TEST_JWT_SECRET;
        return null;
      }),
    };

    module = await Test.createTestingModule({
      imports: [
        JwtModule.register({
          secret: TEST_JWT_SECRET,
          signOptions: { expiresIn: '15m' },
        }),
      ],
      providers: [
        AuthService,
        PasswordService,
        TokenService,
        SessionService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    passwordService = module.get<PasswordService>(PasswordService);
    tokenService = module.get<TokenService>(TokenService);
    sessionService = module.get<SessionService>(SessionService);
    prismaService = module.get(PrismaService);
  });

  afterEach(async () => {
    await module.close();
  });

  describe('Full Registration -> Login -> Refresh -> Logout Flow', () => {
    /**
     * TC-INT-001: Complete authentication lifecycle
     *
     * Priority: Critical
     * Category: Integration
     *
     * Tests the entire authentication flow from user registration
     * through login, token refresh, and logout.
     */
    it('should complete full authentication lifecycle', async () => {
      // Step 1: Register a new user
      const registerDto = {
        email: 'lifecycle@test.com',
        password: VALID_PASSWORD,
        name: 'Lifecycle Test User',
      };

      const registerResult = await authService.register(
        registerDto,
        undefined,
        'Test Browser',
        '192.168.1.1',
      );

      expect(registerResult).toBeDefined();
      expect(registerResult.user.email).toBe(registerDto.email.toLowerCase());
      expect(registerResult.accessToken).toBeDefined();
      expect(registerResult.refreshToken).toBeDefined();
      expect(registerResult.user.role).toBe(Role.ADMIN); // First user is admin

      // Step 2: Login with the registered user
      const loginDto = {
        email: registerDto.email,
        password: VALID_PASSWORD,
      };

      const loginResult = await authService.login(loginDto, 'Test Browser', '192.168.1.1');

      expect(loginResult).toBeDefined();
      expect(loginResult.user.email).toBe(registerDto.email.toLowerCase());
      expect(loginResult.accessToken).toBeDefined();
      expect(loginResult.refreshToken).toBeDefined();

      // Verify access token is valid JWT
      const decodedToken = tokenService.verifyAccessToken(loginResult.accessToken);
      expect(decodedToken.sub).toBe(loginResult.user.id);
      expect(decodedToken.email).toBe(loginResult.user.email);
      expect(decodedToken.role).toBe(loginResult.user.role);

      // Step 3: Refresh the token
      const refreshResult = await authService.refresh(
        loginResult.refreshToken,
        'Test Browser',
        '192.168.1.1',
      );

      expect(refreshResult).toBeDefined();
      expect(refreshResult.accessToken).toBeDefined();
      expect(refreshResult.refreshToken).toBeDefined();
      expect(refreshResult.refreshToken).not.toBe(loginResult.refreshToken); // Rotated

      // Step 4: Logout
      await authService.logout(refreshResult.refreshToken);

      // Step 5: Verify refresh token is now invalid
      await expect(
        authService.refresh(refreshResult.refreshToken, 'Test Browser', '192.168.1.1'),
      ).rejects.toThrow(UnauthorizedException);
    });

    /**
     * TC-INT-002: Multiple sessions for same user
     *
     * Priority: High
     * Category: Integration
     */
    it('should handle multiple sessions for the same user', async () => {
      // Register user
      const registerResult = await authService.register(
        { email: 'multi@test.com', password: VALID_PASSWORD, name: 'Multi Session' },
        undefined,
        'Browser 1',
        '192.168.1.1',
      );

      // Login from second device
      const loginResult1 = await authService.login(
        { email: 'multi@test.com', password: VALID_PASSWORD },
        'Browser 2',
        '192.168.1.2',
      );

      // Login from third device
      const loginResult2 = await authService.login(
        { email: 'multi@test.com', password: VALID_PASSWORD },
        'Browser 3',
        '192.168.1.3',
      );

      // All sessions should be valid
      const sessions = await sessionService.getUserSessions(registerResult.user.id);
      expect(sessions.length).toBeGreaterThanOrEqual(3);

      // Logout from one session shouldn't affect others
      await authService.logout(loginResult1.refreshToken);

      // Other sessions still valid
      const refreshResult = await authService.refresh(
        loginResult2.refreshToken,
        'Browser 3',
        '192.168.1.3',
      );
      expect(refreshResult.accessToken).toBeDefined();
    });
  });

  describe('First User Admin, Second User Member', () => {
    /**
     * TC-INT-003: First registered user becomes ADMIN
     *
     * Priority: Critical
     * Category: Functional
     */
    it('should make first registered user an ADMIN', async () => {
      expect(userStore.size).toBe(0); // Ensure clean state

      const result = await authService.register(
        { email: 'first@test.com', password: VALID_PASSWORD, name: 'First User' },
        undefined,
      );

      expect(result.user.role).toBe(Role.ADMIN);
    });

    /**
     * TC-INT-004: Second registered user becomes MEMBER
     *
     * Priority: Critical
     * Category: Functional
     */
    it('should make second registered user a MEMBER', async () => {
      // Register first user (admin)
      await authService.register(
        { email: 'first@test.com', password: VALID_PASSWORD, name: 'First User' },
        undefined,
      );

      // Register second user (should be member)
      const secondResult = await authService.register(
        { email: 'second@test.com', password: VALID_PASSWORD, name: 'Second User' },
        undefined,
      );

      expect(secondResult.user.role).toBe(Role.MEMBER);
    });

    /**
     * TC-INT-005: Third user also becomes MEMBER
     *
     * Priority: High
     * Category: Functional
     */
    it('should make third and subsequent users MEMBER', async () => {
      // Register first user
      await authService.register(
        { email: 'first@test.com', password: VALID_PASSWORD, name: 'First' },
        undefined,
      );

      // Register second user
      await authService.register(
        { email: 'second@test.com', password: VALID_PASSWORD, name: 'Second' },
        undefined,
      );

      // Register third user
      const thirdResult = await authService.register(
        { email: 'third@test.com', password: VALID_PASSWORD, name: 'Third' },
        undefined,
      );

      expect(thirdResult.user.role).toBe(Role.MEMBER);
    });
  });

  describe('Admin Role Management', () => {
    /**
     * TC-INT-006: Admin can create users with specific roles
     *
     * Priority: Critical
     * Category: Functional
     */
    it('should allow admin to create user with VIEWER role', async () => {
      // Register first user (admin)
      await authService.register(
        { email: 'admin@test.com', password: VALID_PASSWORD, name: 'Admin' },
        undefined,
      );

      // Admin creates a viewer
      const viewerResult = await authService.register(
        {
          email: 'viewer@test.com',
          password: VALID_PASSWORD,
          name: 'Viewer User',
          role: Role.VIEWER,
        },
        Role.ADMIN,
      );

      expect(viewerResult.user.role).toBe(Role.VIEWER);
    });

    /**
     * TC-INT-007: Admin can create another admin
     *
     * Priority: High
     * Category: Functional
     */
    it('should allow admin to create another admin', async () => {
      // Register first user (admin)
      await authService.register(
        { email: 'admin@test.com', password: VALID_PASSWORD, name: 'Admin' },
        undefined,
      );

      // Admin creates another admin
      const secondAdminResult = await authService.register(
        {
          email: 'admin2@test.com',
          password: VALID_PASSWORD,
          name: 'Second Admin',
          role: Role.ADMIN,
        },
        Role.ADMIN,
      );

      expect(secondAdminResult.user.role).toBe(Role.ADMIN);
    });

    /**
     * TC-INT-008: Admin can create member explicitly
     *
     * Priority: Medium
     * Category: Functional
     */
    it('should allow admin to explicitly set MEMBER role', async () => {
      // Register first user
      await authService.register(
        { email: 'admin@test.com', password: VALID_PASSWORD, name: 'Admin' },
        undefined,
      );

      // Admin explicitly creates member
      const memberResult = await authService.register(
        {
          email: 'member@test.com',
          password: VALID_PASSWORD,
          name: 'Member',
          role: Role.MEMBER,
        },
        Role.ADMIN,
      );

      expect(memberResult.user.role).toBe(Role.MEMBER);
    });
  });

  describe('Non-Admin Role Restrictions', () => {
    /**
     * TC-INT-009: Non-admin cannot create users with roles
     *
     * Priority: Critical
     * Category: Security
     */
    it('should reject role assignment from MEMBER', async () => {
      // Register first user (admin)
      await authService.register(
        { email: 'admin@test.com', password: VALID_PASSWORD, name: 'Admin' },
        undefined,
      );

      // MEMBER tries to create user with role
      await expect(
        authService.register(
          {
            email: 'new@test.com',
            password: VALID_PASSWORD,
            name: 'New User',
            role: Role.ADMIN,
          },
          Role.MEMBER,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    /**
     * TC-INT-010: VIEWER cannot assign roles
     *
     * Priority: Critical
     * Category: Security
     */
    it('should reject role assignment from VIEWER', async () => {
      // Register first user
      await authService.register(
        { email: 'admin@test.com', password: VALID_PASSWORD, name: 'Admin' },
        undefined,
      );

      // VIEWER tries to create user with role
      await expect(
        authService.register(
          {
            email: 'new@test.com',
            password: VALID_PASSWORD,
            name: 'New User',
            role: Role.MEMBER,
          },
          Role.VIEWER,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    /**
     * TC-INT-011: Non-admin can register without role (gets MEMBER)
     *
     * Priority: High
     * Category: Functional
     */
    it('should allow non-admin registration without role specification', async () => {
      // Register first user
      await authService.register(
        { email: 'admin@test.com', password: VALID_PASSWORD, name: 'Admin' },
        undefined,
      );

      // Register without role (by non-admin context)
      const result = await authService.register(
        { email: 'new@test.com', password: VALID_PASSWORD, name: 'New User' },
        undefined,
      );

      expect(result.user.role).toBe(Role.MEMBER);
    });
  });

  describe('Token Refresh and Rotation', () => {
    /**
     * TC-INT-012: Refresh token rotation creates new token
     *
     * Priority: Critical
     * Category: Security
     */
    it('should rotate refresh token on refresh', async () => {
      const registerResult = await authService.register(
        { email: 'rotate@test.com', password: VALID_PASSWORD, name: 'Rotate Test' },
        undefined,
      );

      const originalRefreshToken = registerResult.refreshToken;

      const refreshResult = await authService.refresh(originalRefreshToken);

      expect(refreshResult.refreshToken).toBeDefined();
      expect(refreshResult.refreshToken).not.toBe(originalRefreshToken);
      expect(refreshResult.refreshToken.length).toBeGreaterThan(0);
    });

    /**
     * TC-INT-013: Old refresh token invalid after rotation
     *
     * Priority: Critical
     * Category: Security
     */
    it('should invalidate old refresh token after rotation', async () => {
      const registerResult = await authService.register(
        { email: 'invalid@test.com', password: VALID_PASSWORD, name: 'Invalid Test' },
        undefined,
      );

      const originalRefreshToken = registerResult.refreshToken;

      // Rotate token
      await authService.refresh(originalRefreshToken);

      // Try to use old token
      await expect(authService.refresh(originalRefreshToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    /**
     * TC-INT-014: New access token contains correct user data
     *
     * Priority: High
     * Category: Functional
     */
    it('should generate new access token with correct user data', async () => {
      const registerResult = await authService.register(
        { email: 'tokendata@test.com', password: VALID_PASSWORD, name: 'Token Data' },
        undefined,
      );

      const refreshResult = await authService.refresh(registerResult.refreshToken);

      const decoded = tokenService.verifyAccessToken(refreshResult.accessToken);

      expect(decoded.sub).toBe(registerResult.user.id);
      expect(decoded.email).toBe(registerResult.user.email);
      expect(decoded.role).toBe(registerResult.user.role);
    });

    /**
     * TC-INT-015: Expired refresh token throws error
     *
     * Priority: Critical
     * Category: Security
     */
    it('should reject expired refresh token', async () => {
      const registerResult = await authService.register(
        { email: 'expired@test.com', password: VALID_PASSWORD, name: 'Expired Test' },
        undefined,
      );

      // Manually expire the session
      for (const session of sessionStore.values()) {
        if (session.refresh_token === registerResult.refreshToken) {
          session.expires_at = new Date(Date.now() - 1000); // Set to past
          break;
        }
      }

      await expect(authService.refresh(registerResult.refreshToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('Logout Functionality', () => {
    /**
     * TC-INT-016: Single logout invalidates one session
     *
     * Priority: Critical
     * Category: Functional
     */
    it('should invalidate session on logout', async () => {
      const registerResult = await authService.register(
        { email: 'logout@test.com', password: VALID_PASSWORD, name: 'Logout Test' },
        undefined,
      );

      await authService.logout(registerResult.refreshToken);

      await expect(authService.refresh(registerResult.refreshToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    /**
     * TC-INT-017: Logout with non-existent token does not throw
     *
     * Priority: Medium
     * Category: Edge Case
     */
    it('should handle logout with non-existent token gracefully', async () => {
      // Should not throw
      await expect(
        authService.logout('non-existent-refresh-token'),
      ).resolves.not.toThrow();
    });

    /**
     * TC-INT-018: Logout does not affect other user sessions
     *
     * Priority: High
     * Category: Security
     */
    it('should not affect other user sessions on logout', async () => {
      // Register two users
      const user1 = await authService.register(
        { email: 'user1@test.com', password: VALID_PASSWORD, name: 'User 1' },
        undefined,
      );

      const user2 = await authService.register(
        { email: 'user2@test.com', password: VALID_PASSWORD, name: 'User 2' },
        undefined,
      );

      // Logout user 1
      await authService.logout(user1.refreshToken);

      // User 2's session should still work
      const refreshResult = await authService.refresh(user2.refreshToken);
      expect(refreshResult.accessToken).toBeDefined();
    });
  });

  describe('LogoutAll Functionality', () => {
    /**
     * TC-INT-019: LogoutAll invalidates all sessions
     *
     * Priority: Critical
     * Category: Functional
     */
    it('should invalidate all user sessions on logoutAll', async () => {
      const registerResult = await authService.register(
        { email: 'logoutall@test.com', password: VALID_PASSWORD, name: 'Logout All' },
        undefined,
      );

      // Create additional sessions via login
      const login1 = await authService.login(
        { email: 'logoutall@test.com', password: VALID_PASSWORD },
        'Browser 1',
      );

      const login2 = await authService.login(
        { email: 'logoutall@test.com', password: VALID_PASSWORD },
        'Browser 2',
      );

      // Logout all
      const count = await authService.logoutAll(registerResult.user.id);
      expect(count).toBeGreaterThanOrEqual(3);

      // All sessions should be invalid
      await expect(authService.refresh(registerResult.refreshToken)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(authService.refresh(login1.refreshToken)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(authService.refresh(login2.refreshToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    /**
     * TC-INT-020: LogoutAll does not affect other users
     *
     * Priority: High
     * Category: Security
     */
    it('should not affect other users on logoutAll', async () => {
      const user1 = await authService.register(
        { email: 'user1@test.com', password: VALID_PASSWORD, name: 'User 1' },
        undefined,
      );

      const user2 = await authService.register(
        { email: 'user2@test.com', password: VALID_PASSWORD, name: 'User 2' },
        undefined,
      );

      // Logout all sessions for user 1
      await authService.logoutAll(user1.user.id);

      // User 2's session should still be valid
      const refreshResult = await authService.refresh(user2.refreshToken);
      expect(refreshResult.accessToken).toBeDefined();
    });
  });

  describe('Disabled Account Handling', () => {
    /**
     * TC-INT-021: Disabled account cannot login
     *
     * Priority: Critical
     * Category: Security
     */
    it('should reject login for disabled account', async () => {
      // Register user
      const registerResult = await authService.register(
        { email: 'disabled@test.com', password: VALID_PASSWORD, name: 'Disabled User' },
        undefined,
      );

      // Disable the account
      const user = userStore.get(registerResult.user.id);
      user.is_active = false;
      userStore.set(registerResult.user.id, user);

      // Try to login
      await expect(
        authService.login({ email: 'disabled@test.com', password: VALID_PASSWORD }),
      ).rejects.toThrow(UnauthorizedException);
    });

    /**
     * TC-INT-022: Disabled account gets correct error message
     *
     * Priority: High
     * Category: Security
     */
    it('should return "Account is disabled" message for disabled accounts', async () => {
      const registerResult = await authService.register(
        { email: 'disabled2@test.com', password: VALID_PASSWORD, name: 'Disabled User 2' },
        undefined,
      );

      // Disable the account
      const user = userStore.get(registerResult.user.id);
      user.is_active = false;
      userStore.set(registerResult.user.id, user);

      try {
        await authService.login({ email: 'disabled2@test.com', password: VALID_PASSWORD });
        fail('Should have thrown UnauthorizedException');
      } catch (error) {
        expect(error).toBeInstanceOf(UnauthorizedException);
        expect(error.message).toBe('Account is disabled');
      }
    });

    /**
     * TC-INT-023: Disabled account cannot refresh token
     *
     * Priority: Critical
     * Category: Security
     */
    it('should reject token refresh for disabled account', async () => {
      const registerResult = await authService.register(
        { email: 'refresh-disabled@test.com', password: VALID_PASSWORD, name: 'Refresh Disabled' },
        undefined,
      );

      // Disable the account after registration
      const user = userStore.get(registerResult.user.id);
      user.is_active = false;
      userStore.set(registerResult.user.id, user);

      // Try to refresh
      await expect(authService.refresh(registerResult.refreshToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    /**
     * TC-INT-024: Re-enabled account can login again
     *
     * Priority: High
     * Category: Functional
     */
    it('should allow login after account is re-enabled', async () => {
      const registerResult = await authService.register(
        { email: 'reenable@test.com', password: VALID_PASSWORD, name: 'Re-enable User' },
        undefined,
      );

      // Disable then re-enable
      const user = userStore.get(registerResult.user.id);
      user.is_active = false;
      userStore.set(registerResult.user.id, user);

      // Should fail
      await expect(
        authService.login({ email: 'reenable@test.com', password: VALID_PASSWORD }),
      ).rejects.toThrow();

      // Re-enable
      user.is_active = true;
      userStore.set(registerResult.user.id, user);

      // Should succeed
      const loginResult = await authService.login({
        email: 'reenable@test.com',
        password: VALID_PASSWORD,
      });
      expect(loginResult.accessToken).toBeDefined();
    });
  });

  describe('Profile Update Flows', () => {
    /**
     * TC-INT-025: Get profile returns correct user data
     *
     * Priority: High
     * Category: Functional
     */
    it('should return correct profile data', async () => {
      const registerResult = await authService.register(
        { email: 'profile@test.com', password: VALID_PASSWORD, name: 'Profile User' },
        undefined,
      );

      const profile = await authService.getProfile(registerResult.user.id);

      expect(profile.id).toBe(registerResult.user.id);
      expect(profile.email).toBe('profile@test.com');
      expect(profile.name).toBe('Profile User');
      expect(profile.role).toBe(Role.ADMIN);
    });

    /**
     * TC-INT-026: Update name successfully
     *
     * Priority: High
     * Category: Functional
     */
    it('should update user name', async () => {
      const registerResult = await authService.register(
        { email: 'updatename@test.com', password: VALID_PASSWORD, name: 'Original Name' },
        undefined,
      );

      const updatedProfile = await authService.updateProfile(registerResult.user.id, {
        name: 'New Name',
      });

      expect(updatedProfile.name).toBe('New Name');
      expect(updatedProfile.email).toBe('updatename@test.com'); // Unchanged
    });

    /**
     * TC-INT-027: Update email successfully
     *
     * Priority: High
     * Category: Functional
     */
    it('should update user email', async () => {
      const registerResult = await authService.register(
        { email: 'oldemail@test.com', password: VALID_PASSWORD, name: 'Email User' },
        undefined,
      );

      const updatedProfile = await authService.updateProfile(registerResult.user.id, {
        email: 'newemail@test.com',
      });

      expect(updatedProfile.email).toBe('newemail@test.com');
      expect(updatedProfile.name).toBe('Email User'); // Unchanged
    });

    /**
     * TC-INT-028: Update both name and email
     *
     * Priority: Medium
     * Category: Functional
     */
    it('should update both name and email together', async () => {
      const registerResult = await authService.register(
        { email: 'both@test.com', password: VALID_PASSWORD, name: 'Both User' },
        undefined,
      );

      const updatedProfile = await authService.updateProfile(registerResult.user.id, {
        name: 'New Both Name',
        email: 'newboth@test.com',
      });

      expect(updatedProfile.name).toBe('New Both Name');
      expect(updatedProfile.email).toBe('newboth@test.com');
    });

    /**
     * TC-INT-029: Reject duplicate email on update
     *
     * Priority: Critical
     * Category: Security
     */
    it('should reject email update if email already in use', async () => {
      // Register two users
      await authService.register(
        { email: 'existing@test.com', password: VALID_PASSWORD, name: 'Existing' },
        undefined,
      );

      const user2 = await authService.register(
        { email: 'tryupdate@test.com', password: VALID_PASSWORD, name: 'Try Update' },
        undefined,
      );

      // Try to update to existing email
      await expect(
        authService.updateProfile(user2.user.id, { email: 'existing@test.com' }),
      ).rejects.toThrow(ConflictException);
    });

    /**
     * TC-INT-030: Allow updating to same email (no-op)
     *
     * Priority: Low
     * Category: Edge Case
     */
    it('should allow updating to same email', async () => {
      const registerResult = await authService.register(
        { email: 'sameemail@test.com', password: VALID_PASSWORD, name: 'Same Email' },
        undefined,
      );

      const updatedProfile = await authService.updateProfile(registerResult.user.id, {
        email: 'sameemail@test.com',
      });

      expect(updatedProfile.email).toBe('sameemail@test.com');
    });

    /**
     * TC-INT-031: Profile not found throws error
     *
     * Priority: High
     * Category: Negative
     */
    it('should throw error for non-existent user profile', async () => {
      await expect(authService.getProfile('non-existent-uuid')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('Password Validation Integration', () => {
    /**
     * TC-INT-032: Weak password rejected on registration
     *
     * Priority: Critical
     * Category: Security
     */
    it('should reject registration with weak password', async () => {
      await expect(
        authService.register(
          { email: 'weak@test.com', password: 'weak', name: 'Weak Password' },
          undefined,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    /**
     * TC-INT-033: Password without uppercase rejected
     *
     * Priority: High
     * Category: Security
     */
    it('should reject password without uppercase', async () => {
      await expect(
        authService.register(
          { email: 'noupper@test.com', password: 'password123', name: 'No Upper' },
          undefined,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    /**
     * TC-INT-034: Password without lowercase rejected
     *
     * Priority: High
     * Category: Security
     */
    it('should reject password without lowercase', async () => {
      await expect(
        authService.register(
          { email: 'nolower@test.com', password: 'PASSWORD123', name: 'No Lower' },
          undefined,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    /**
     * TC-INT-035: Password without number rejected
     *
     * Priority: High
     * Category: Security
     */
    it('should reject password without number', async () => {
      await expect(
        authService.register(
          { email: 'nonumber@test.com', password: 'PasswordABC', name: 'No Number' },
          undefined,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    /**
     * TC-INT-036: Short password rejected
     *
     * Priority: High
     * Category: Security
     */
    it('should reject password shorter than 8 characters', async () => {
      await expect(
        authService.register(
          { email: 'short@test.com', password: 'Pass1', name: 'Short' },
          undefined,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('Email Handling', () => {
    /**
     * TC-INT-037: Email normalized to lowercase on registration
     *
     * Priority: High
     * Category: Functional
     */
    it('should normalize email to lowercase on registration', async () => {
      const result = await authService.register(
        { email: 'UPPERCASE@TEST.COM', password: VALID_PASSWORD, name: 'Uppercase' },
        undefined,
      );

      expect(result.user.email).toBe('uppercase@test.com');
    });

    /**
     * TC-INT-038: Login works with different email casing
     *
     * Priority: High
     * Category: Functional
     */
    it('should allow login with different email casing', async () => {
      await authService.register(
        { email: 'casing@test.com', password: VALID_PASSWORD, name: 'Casing Test' },
        undefined,
      );

      const loginResult = await authService.login({
        email: 'CASING@TEST.COM',
        password: VALID_PASSWORD,
      });

      expect(loginResult.user.email).toBe('casing@test.com');
    });

    /**
     * TC-INT-039: Duplicate email rejected (case insensitive)
     *
     * Priority: Critical
     * Category: Security
     */
    it('should reject duplicate email registration case insensitively', async () => {
      await authService.register(
        { email: 'duplicate@test.com', password: VALID_PASSWORD, name: 'First' },
        undefined,
      );

      await expect(
        authService.register(
          { email: 'DUPLICATE@TEST.COM', password: VALID_PASSWORD, name: 'Second' },
          undefined,
        ),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('Invalid Credentials Handling', () => {
    /**
     * TC-INT-040: Wrong password rejected
     *
     * Priority: Critical
     * Category: Security
     */
    it('should reject login with wrong password', async () => {
      await authService.register(
        { email: 'wrongpass@test.com', password: VALID_PASSWORD, name: 'Wrong Pass' },
        undefined,
      );

      await expect(
        authService.login({ email: 'wrongpass@test.com', password: 'WrongPassword123' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    /**
     * TC-INT-041: Non-existent email rejected
     *
     * Priority: Critical
     * Category: Security
     */
    it('should reject login with non-existent email', async () => {
      await expect(
        authService.login({ email: 'nonexistent@test.com', password: VALID_PASSWORD }),
      ).rejects.toThrow(UnauthorizedException);
    });

    /**
     * TC-INT-042: Same error message for wrong email and wrong password
     *
     * Priority: High
     * Category: Security
     *
     * Prevents user enumeration attacks
     */
    it('should return same error for wrong email and wrong password', async () => {
      await authService.register(
        { email: 'security@test.com', password: VALID_PASSWORD, name: 'Security' },
        undefined,
      );

      let wrongEmailError: any;
      let wrongPasswordError: any;

      try {
        await authService.login({ email: 'nonexistent@test.com', password: VALID_PASSWORD });
      } catch (e) {
        wrongEmailError = e;
      }

      try {
        await authService.login({ email: 'security@test.com', password: 'WrongPassword123' });
      } catch (e) {
        wrongPasswordError = e;
      }

      expect(wrongEmailError.message).toBe(wrongPasswordError.message);
      expect(wrongEmailError.message).toBe('Invalid email or password');
    });
  });

  describe('User Validation', () => {
    /**
     * TC-INT-043: ValidateUser returns user for active user
     *
     * Priority: High
     * Category: Functional
     */
    it('should return user for active user on validateUser', async () => {
      const registerResult = await authService.register(
        { email: 'validate@test.com', password: VALID_PASSWORD, name: 'Validate' },
        undefined,
      );

      const validatedUser = await authService.validateUser(registerResult.user.id);

      expect(validatedUser).toBeDefined();
      expect(validatedUser?.id).toBe(registerResult.user.id);
      expect(validatedUser?.email).toBe('validate@test.com');
    });

    /**
     * TC-INT-044: ValidateUser returns null for inactive user
     *
     * Priority: Critical
     * Category: Security
     */
    it('should return null for inactive user on validateUser', async () => {
      const registerResult = await authService.register(
        { email: 'inactive@test.com', password: VALID_PASSWORD, name: 'Inactive' },
        undefined,
      );

      // Deactivate user
      const user = userStore.get(registerResult.user.id);
      user.is_active = false;
      userStore.set(registerResult.user.id, user);

      const validatedUser = await authService.validateUser(registerResult.user.id);

      expect(validatedUser).toBeNull();
    });

    /**
     * TC-INT-045: ValidateUser returns null for non-existent user
     *
     * Priority: High
     * Category: Negative
     */
    it('should return null for non-existent user on validateUser', async () => {
      const validatedUser = await authService.validateUser('non-existent-uuid');

      expect(validatedUser).toBeNull();
    });
  });

  describe('Session Metadata Tracking', () => {
    /**
     * TC-INT-046: Session stores user agent
     *
     * Priority: Medium
     * Category: Functional
     */
    it('should store user agent in session', async () => {
      const registerResult = await authService.register(
        { email: 'useragent@test.com', password: VALID_PASSWORD, name: 'User Agent' },
        undefined,
        'Mozilla/5.0 Test Browser',
        '192.168.1.1',
      );

      const sessions = await sessionService.getUserSessions(registerResult.user.id);

      expect(sessions.length).toBeGreaterThan(0);
      expect(sessions[0].userAgent).toBe('Mozilla/5.0 Test Browser');
    });

    /**
     * TC-INT-047: Session stores IP address
     *
     * Priority: Medium
     * Category: Functional
     */
    it('should store IP address in session', async () => {
      const registerResult = await authService.register(
        { email: 'ipaddr@test.com', password: VALID_PASSWORD, name: 'IP Address' },
        undefined,
        'Test Browser',
        '10.0.0.50',
      );

      const sessions = await sessionService.getUserSessions(registerResult.user.id);

      expect(sessions.length).toBeGreaterThan(0);
      expect(sessions[0].ipAddress).toBe('10.0.0.50');
    });

    /**
     * TC-INT-048: Session updates metadata on refresh
     *
     * Priority: Low
     * Category: Functional
     */
    it('should update session metadata on refresh', async () => {
      const registerResult = await authService.register(
        { email: 'refresh-meta@test.com', password: VALID_PASSWORD, name: 'Refresh Meta' },
        undefined,
        'Original Browser',
        '192.168.1.1',
      );

      // Refresh with different metadata
      await authService.refresh(registerResult.refreshToken, 'New Browser', '10.0.0.100');

      const sessions = await sessionService.getUserSessions(registerResult.user.id);

      // Should have updated metadata
      const session = sessions.find((s) => s.userAgent === 'New Browser');
      expect(session).toBeDefined();
    });
  });

  describe('Last Login Tracking', () => {
    /**
     * TC-INT-049: Registration sets last_login
     *
     * Priority: Medium
     * Category: Functional
     */
    it('should set last_login on registration', async () => {
      const beforeRegister = new Date();

      const registerResult = await authService.register(
        { email: 'lastlogin@test.com', password: VALID_PASSWORD, name: 'Last Login' },
        undefined,
      );

      const user = userStore.get(registerResult.user.id);

      expect(user.last_login).toBeDefined();
      expect(user.last_login.getTime()).toBeGreaterThanOrEqual(beforeRegister.getTime());
    });

    /**
     * TC-INT-050: Login updates last_login
     *
     * Priority: Medium
     * Category: Functional
     */
    it('should update last_login on login', async () => {
      await authService.register(
        { email: 'loginupdate@test.com', password: VALID_PASSWORD, name: 'Login Update' },
        undefined,
      );

      // Wait a bit to ensure time difference
      await new Promise((resolve) => setTimeout(resolve, 10));

      const beforeLogin = new Date();

      await authService.login({ email: 'loginupdate@test.com', password: VALID_PASSWORD });

      // Find user and check last_login
      for (const user of userStore.values()) {
        if (user.email === 'loginupdate@test.com') {
          expect(user.last_login.getTime()).toBeGreaterThanOrEqual(beforeLogin.getTime());
          break;
        }
      }
    });
  });
});
