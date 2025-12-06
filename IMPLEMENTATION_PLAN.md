# Implementation Plan: JWT Auth + WebSocket Security + 100% Test Coverage

## Overview

This plan implements a complete authentication system with role-based access control (RBAC), secure WebSocket authentication, and expands test coverage to 100%.

**User Model:** Multi-user with roles (admin, member, viewer)
**Token Strategy:** JWT access tokens + HTTP-only refresh token cookies
**Test Coverage Target:** 100% (unit + integration + E2E)

---

## Phase 1: Authentication System (Backend)

### 1.1 Database Schema Updates

**New Prisma Models:**

```prisma
model user {
  id             String    @id @default(uuid())
  email          String    @unique
  password_hash  String
  name           String
  role           Role      @default(MEMBER)
  is_active      Boolean   @default(true)
  created_at     DateTime  @default(now())
  updated_at     DateTime  @updatedAt
  last_login     DateTime?

  sessions       session[]
  job_history    job_history[]

  @@index([email])
  @@index([role])
}

model session {
  id            String   @id @default(uuid())
  user_id       String
  refresh_token String   @unique
  user_agent    String?
  ip_address    String?
  expires_at    DateTime
  created_at    DateTime @default(now())

  user          user     @relation(fields: [user_id], references: [id], onDelete: Cascade)

  @@index([user_id])
  @@index([refresh_token])
  @@index([expires_at])
}

enum Role {
  ADMIN
  MEMBER
  VIEWER
}
```

**Files to Create:**
- `prisma/migrations/YYYYMMDD_add_user_auth/migration.sql`

**Files to Modify:**
- `prisma/schema.prisma` - Add user, session models and Role enum
- Link `job_history.userId` to `user.id`

---

### 1.2 Auth Module Structure

**New Directory:** `src/features/auth/`

```
src/features/auth/
├── auth.module.ts              # Module registration
├── api/
│   ├── auth.controller.ts      # Login, register, logout, refresh endpoints
│   └── dto/
│       ├── login.dto.ts        # email, password
│       ├── register.dto.ts     # email, password, name
│       └── auth-response.dto.ts # user + access token
├── domain/
│   ├── auth.service.ts         # Core auth logic
│   ├── token.service.ts        # JWT generation/validation
│   ├── password.service.ts     # bcrypt hashing
│   └── session.service.ts      # Refresh token management
├── guards/
│   ├── jwt-auth.guard.ts       # Validates access token
│   ├── roles.guard.ts          # RBAC authorization
│   └── ws-auth.guard.ts        # WebSocket authentication
├── decorators/
│   ├── current-user.decorator.ts  # @CurrentUser() param decorator
│   ├── roles.decorator.ts         # @Roles() method decorator
│   └── public.decorator.ts        # @Public() bypass auth
└── strategies/
    └── jwt.strategy.ts         # Passport JWT strategy
```

---

### 1.3 Auth Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Create new user | No (first user) or Admin only |
| POST | `/api/auth/login` | Authenticate user | No |
| POST | `/api/auth/logout` | Invalidate session | Yes |
| POST | `/api/auth/refresh` | Get new access token | Cookie only |
| GET | `/api/auth/me` | Get current user | Yes |
| PATCH | `/api/auth/me` | Update profile | Yes |

**Response Format:**
```typescript
// Login/Register Response
{
  user: { id, email, name, role },
  accessToken: "eyJ...",  // 15 min expiry
  // refreshToken set as HTTP-only cookie
}
```

---

### 1.4 Token Strategy

**Access Token (JWT):**
- Stored in memory (frontend state)
- 15 minute expiration
- Contains: `{ sub: userId, email, role }`
- Sent via `Authorization: Bearer <token>` header

**Refresh Token:**
- Stored in HTTP-only, Secure, SameSite=Strict cookie
- 7 day expiration
- Stored in database for revocation
- Rotated on each refresh (one-time use)

**Cookie Configuration:**
```typescript
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/api/auth/refresh',
};
```

---

### 1.5 Guard Implementation

**JwtAuthGuard (Global):**
```typescript
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    // Check for @Public() decorator
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) return true;
    return super.canActivate(context);
  }
}
```

**RolesGuard:**
```typescript
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) return true;

    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.includes(user.role);
  }
}
```

---

### 1.6 Protecting Existing Endpoints

**Controller Updates:**

```typescript
// business.controller.ts
@ApiTags('Businesses')
@Controller('api/businesses')
@UseGuards(JwtAuthGuard, RolesGuard)  // Add guards
export class BusinessController {

  @Get()
  @Roles(Role.ADMIN, Role.MEMBER, Role.VIEWER)  // All roles can read
  findAll(@Query() query: QueryBusinessesDto) { ... }

  @Post()
  @Roles(Role.ADMIN, Role.MEMBER)  // Only admin/member can create
  create(@Body() dto: CreateBusinessDto, @CurrentUser() user: User) { ... }

  @Delete(':id')
  @Roles(Role.ADMIN)  // Only admin can delete
  remove(@Param('id') id: number) { ... }
}
```

**Role Permissions Matrix:**

| Action | ADMIN | MEMBER | VIEWER |
|--------|-------|--------|--------|
| View businesses | ✅ | ✅ | ✅ |
| Create business | ✅ | ✅ | ❌ |
| Delete business | ✅ | ❌ | ❌ |
| Start scraping | ✅ | ✅ | ❌ |
| Enrich leads | ✅ | ✅ | ❌ |
| Generate outreach | ✅ | ✅ | ❌ |
| View analytics | ✅ | ✅ | ✅ |
| Manage users | ✅ | ❌ | ❌ |

---

### 1.7 WebSocket Authentication

**Connection Handshake:**
```typescript
// websocket.gateway.ts
@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
    credentials: true,
  },
})
export class EventsGateway implements OnGatewayConnection {
  constructor(private tokenService: TokenService) {}

  async handleConnection(client: Socket) {
    try {
      const token = this.extractToken(client);
      const payload = await this.tokenService.verifyAccessToken(token);

      // Attach user to socket
      client.data.user = payload;
      client.join(`user:${payload.sub}`);

      this.logger.log(`Authenticated client connected: ${client.id}`);
    } catch (error) {
      this.logger.warn(`Unauthorized connection attempt: ${client.id}`);
      client.emit('auth:error', { message: 'Authentication required' });
      client.disconnect();
    }
  }

  private extractToken(client: Socket): string {
    // Try auth header first
    const authHeader = client.handshake.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      return authHeader.slice(7);
    }

    // Fallback to query param (for initial connection)
    return client.handshake.auth?.token;
  }
}
```

---

### 1.8 Dependencies to Add

```bash
cd App/BackEnd
yarn add @nestjs/passport @nestjs/jwt passport passport-jwt bcrypt
yarn add -D @types/passport-jwt @types/bcrypt
```

---

## Phase 2: Authentication System (Frontend)

### 2.1 Auth Context & State

**New Directory:** `core/auth/`

```
core/auth/
├── auth-provider.tsx       # Auth context provider
├── auth-context.ts         # Context definition
├── use-auth.ts             # Auth hook
├── auth-api.ts             # Auth API client
└── types.ts                # User, Role types
```

**Auth State:**
```typescript
interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
}
```

---

### 2.2 Protected Routes

**Route Guard Component:**
```typescript
// components/auth/protected-route.tsx
export function ProtectedRoute({
  children,
  roles
}: {
  children: ReactNode;
  roles?: Role[]
}) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading]);

  if (isLoading) return <LoadingSpinner />;

  if (roles && user && !roles.includes(user.role)) {
    return <AccessDenied />;
  }

  return <>{children}</>;
}
```

---

### 2.3 Auth Pages

**New Pages:**
- `/login` - Login form
- `/register` - Registration form (admin-only or first user)
- `/forgot-password` - Password reset request
- `/reset-password` - Password reset form

**Login Page Structure:**
```typescript
// app/login/page.tsx
export default function LoginPage() {
  const { login, isLoading } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      router.push('/');
    } catch (err) {
      setError('Invalid email or password');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
      <Card variant="glass" className="w-full max-w-md">
        <CardHeader>
          <LetipLogo />
          <CardTitle>Sign In</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <Input label="Email" type="email" ... />
            <Input label="Password" type="password" ... />
            <Button type="submit" loading={isLoading}>Sign In</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

### 2.4 API Client Updates

**Update api-client.ts:**
```typescript
// Add token to requests
apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Try to refresh token
      const refreshed = await tryRefreshToken();
      if (refreshed) {
        // Retry original request
        return apiClient(error.config);
      }
      // Redirect to login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

---

### 2.5 WebSocket Auth Integration

**Update websocket-provider.tsx:**
```typescript
export function WebSocketProvider({ children }: Props) {
  const { accessToken, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      socket?.disconnect();
      return;
    }

    const socketInstance = io(WS_URL, {
      auth: { token: accessToken },
      transports: ['websocket', 'polling'],
      reconnection: true,
    });

    // Handle auth errors
    socketInstance.on('auth:error', () => {
      console.error('WebSocket auth failed');
      // Trigger token refresh
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [accessToken, isAuthenticated]);

  // ... rest of provider
}
```

---

## Phase 3: Test Suite Expansion (100% Coverage)

### 3.1 Backend Test Structure

```
App/BackEnd/
├── src/
│   └── **/*.spec.ts              # Unit tests (co-located)
├── test/
│   ├── setup/
│   │   ├── test-database.ts      # Test DB setup/teardown
│   │   ├── mock-factories.ts     # Test data factories
│   │   └── test-utils.ts         # Common test utilities
│   ├── unit/
│   │   ├── auth/
│   │   │   ├── auth.service.spec.ts
│   │   │   ├── token.service.spec.ts
│   │   │   ├── password.service.spec.ts
│   │   │   └── jwt.strategy.spec.ts
│   │   ├── business/
│   │   │   ├── business.service.spec.ts
│   │   │   └── business.controller.spec.ts
│   │   └── ...
│   ├── integration/
│   │   ├── auth.integration.spec.ts
│   │   ├── business.integration.spec.ts
│   │   ├── enrichment.integration.spec.ts
│   │   ├── scraper.integration.spec.ts
│   │   └── websocket.integration.spec.ts
│   └── e2e/
│       ├── auth.e2e-spec.ts
│       ├── business-crud.e2e-spec.ts
│       ├── enrichment-flow.e2e-spec.ts
│       └── scraping-flow.e2e-spec.ts
```

---

### 3.2 Backend Unit Tests to Add

**Auth Module Tests:**

| File | Test Cases |
|------|------------|
| `auth.service.spec.ts` | register, login, logout, validateUser, getProfile |
| `token.service.spec.ts` | generateAccessToken, generateRefreshToken, verifyToken, extractPayload |
| `password.service.spec.ts` | hash, compare, validateStrength |
| `session.service.spec.ts` | createSession, revokeSession, rotateRefreshToken, cleanExpired |
| `jwt.strategy.spec.ts` | validate callback, token extraction |
| `jwt-auth.guard.spec.ts` | canActivate, @Public bypass |
| `roles.guard.spec.ts` | role validation, missing roles |

**Business Module Tests:**

| File | Test Cases |
|------|------------|
| `business.service.spec.ts` | create, findAll, findOne, update, remove, getStats |
| `business.controller.spec.ts` | all endpoints with mocked service |
| `business.repository.spec.ts` | Prisma queries |

**Enrichment Module Tests:**

| File | Test Cases |
|------|------------|
| `enrichment.service.spec.ts` | enrichBusiness, batchEnrich, handleApiError |
| `hunter-api-client.spec.ts` | domainSearch, emailVerify, rateLimitHandling |
| `abstract-api-client.spec.ts` | companyLookup, errorHandling |

**WebSocket Tests:**

| File | Test Cases |
|------|------------|
| `websocket.gateway.spec.ts` | connection, disconnection, event emission |
| `ws-auth.guard.spec.ts` | token validation, connection rejection |

---

### 3.3 Backend Integration Tests

**auth.integration.spec.ts:**
```typescript
describe('Auth Integration', () => {
  it('should register new user with valid data');
  it('should reject registration with duplicate email');
  it('should login with valid credentials');
  it('should reject login with wrong password');
  it('should refresh access token with valid refresh token');
  it('should reject refresh with expired token');
  it('should invalidate session on logout');
  it('should block access after logout');
});
```

**business.integration.spec.ts:**
```typescript
describe('Business Integration', () => {
  it('should create business and emit WebSocket event');
  it('should paginate businesses correctly');
  it('should filter by city and enrichment_status');
  it('should cascade delete contacts on business removal');
  it('should update stats after mutations');
});
```

---

### 3.4 Frontend Test Structure

```
App/FrontEnd/
├── __tests__/
│   ├── setup/
│   │   ├── test-utils.tsx        # Wrapper with providers
│   │   ├── mock-data.ts          # Factories for test data
│   │   ├── mock-server.ts        # MSW handlers
│   │   └── websocket-mock.ts     # Socket.io mocks
│   ├── unit/
│   │   ├── hooks/
│   │   │   ├── use-auth.test.tsx
│   │   │   ├── use-stats.test.tsx
│   │   │   ├── use-businesses.test.tsx
│   │   │   └── use-socket-listener.test.tsx
│   │   └── components/
│   │       ├── ui/
│   │       │   ├── badge.test.tsx
│   │       │   ├── button.test.tsx
│   │       │   ├── card.test.tsx
│   │       │   └── input.test.tsx
│   │       ├── dashboard/
│   │       │   ├── dashboard-stats.test.tsx
│   │       │   ├── business-card.test.tsx
│   │       │   └── activity-feed.test.tsx
│   │       └── auth/
│   │           ├── login-form.test.tsx
│   │           ├── register-form.test.tsx
│   │           └── protected-route.test.tsx
│   ├── integration/
│   │   ├── auth-flow.test.tsx
│   │   ├── dashboard-integration.test.tsx
│   │   ├── business-crud.test.tsx
│   │   └── websocket-events.test.tsx
│   └── e2e/
│       ├── visual/
│       │   ├── login-page.visual.test.tsx
│       │   ├── dashboard.visual.test.tsx
│       │   └── business-list.visual.test.tsx
│       └── flows/
│           ├── auth-flow.e2e.test.tsx
│           ├── scraping-flow.e2e.test.tsx
│           └── enrichment-flow.e2e.test.tsx
```

---

### 3.5 Frontend Unit Tests to Add

**Hook Tests:**

| Hook | Test Cases |
|------|------------|
| `useAuth` | login, logout, refreshToken, user state |
| `useStats` | fetch, loading, error, stale time |
| `useBusinesses` | list, pagination, filters |
| `useCreateBusiness` | mutate, invalidate, optimistic |
| `useSocketListener` | subscribe, unsubscribe, handler calls |
| `useDebounce` | delay, cancel, immediate |

**Component Tests:**

| Component | Test Cases |
|-----------|------------|
| `LoginForm` | render, validation, submit, error display |
| `ProtectedRoute` | redirect unauthenticated, allow authenticated, role check |
| `DashboardStats` | loading skeleton, render values, WebSocket update |
| `BusinessCard` | render business data, click actions, status badge |
| `SearchForm` | input validation, submit, loading state |
| `ConnectionStatus` | connected, disconnected, reconnecting |

---

### 3.6 E2E Tests (Chrome DevTools MCP)

**Visual Tests:**
```typescript
// e2e/visual/dashboard.visual.test.tsx
describe('Dashboard Visual', () => {
  it('renders correctly on desktop', async () => {
    await mcp.navigate('http://localhost:3001/');
    const screenshot = await mcp.takeScreenshot();
    expect(screenshot).toMatchSnapshot();
  });

  it('renders correctly on mobile', async () => {
    await mcp.resizePage(375, 812);
    const screenshot = await mcp.takeScreenshot();
    expect(screenshot).toMatchSnapshot();
  });
});
```

**Flow Tests:**
```typescript
// e2e/flows/auth-flow.e2e.test.tsx
describe('Auth Flow E2E', () => {
  it('should complete login flow', async () => {
    await mcp.navigate('/login');
    await mcp.fill('[data-testid="email-input"]', 'test@example.com');
    await mcp.fill('[data-testid="password-input"]', 'password123');
    await mcp.click('[data-testid="submit-button"]');
    await mcp.waitFor('Dashboard');
    expect(await mcp.takeSnapshot()).toContain('Dashboard');
  });
});
```

---

### 3.7 Test Utilities & Mocks

**Backend Test Database:**
```typescript
// test/setup/test-database.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.TEST_DATABASE_URL } }
});

export async function resetDatabase() {
  await prisma.$transaction([
    prisma.outreach_message.deleteMany(),
    prisma.enrichment_log.deleteMany(),
    prisma.contact.deleteMany(),
    prisma.business.deleteMany(),
    prisma.session.deleteMany(),
    prisma.user.deleteMany(),
  ]);
}

export async function seedTestData() {
  // Create test user
  const user = await prisma.user.create({
    data: {
      email: 'test@example.com',
      password_hash: await hash('password123', 10),
      name: 'Test User',
      role: 'ADMIN',
    },
  });

  // Create test businesses
  await prisma.business.createMany({
    data: businessFactory.buildList(10),
  });

  return { user };
}
```

**Frontend Mock Server (MSW):**
```typescript
// __tests__/setup/mock-server.ts
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

export const handlers = [
  http.post('/api/auth/login', async ({ request }) => {
    const { email, password } = await request.json();
    if (email === 'test@example.com' && password === 'password123') {
      return HttpResponse.json({
        user: { id: '1', email, name: 'Test', role: 'ADMIN' },
        accessToken: 'mock-jwt-token',
      });
    }
    return new HttpResponse(null, { status: 401 });
  }),

  http.get('/api/businesses', () => {
    return HttpResponse.json({
      data: businessFactory.buildList(5),
      meta: { total: 5, page: 1, limit: 20 },
    });
  }),

  // ... more handlers
];

export const server = setupServer(...handlers);
```

---

## Phase 4: Implementation Order

### Week 1: Backend Auth Foundation
1. [ ] Add Prisma user/session models + migration
2. [ ] Install auth dependencies (passport, jwt, bcrypt)
3. [ ] Create auth module structure
4. [ ] Implement password.service.ts
5. [ ] Implement token.service.ts
6. [ ] Implement session.service.ts
7. [ ] Implement auth.service.ts
8. [ ] Create JWT strategy
9. [ ] Create auth.controller.ts endpoints
10. [ ] Write unit tests for all auth services

### Week 2: Backend Guards & Protection
1. [ ] Implement JwtAuthGuard (global)
2. [ ] Implement RolesGuard
3. [ ] Create @Public(), @Roles(), @CurrentUser() decorators
4. [ ] Apply guards to all existing controllers
5. [ ] Implement WebSocket authentication
6. [ ] Write guard unit tests
7. [ ] Write auth integration tests

### Week 3: Frontend Auth
1. [ ] Create auth context and provider
2. [ ] Implement auth API client
3. [ ] Create login page
4. [ ] Create register page
5. [ ] Implement ProtectedRoute component
6. [ ] Update API client with token handling
7. [ ] Update WebSocket provider for auth
8. [ ] Write auth component tests
9. [ ] Write auth flow integration tests

### Week 4: Test Suite Completion
1. [ ] Add remaining backend unit tests
2. [ ] Add backend integration tests
3. [ ] Add frontend component unit tests
4. [ ] Add frontend hook tests
5. [ ] Enable and fix E2E tests
6. [ ] Add visual regression tests
7. [ ] Achieve 100% coverage target
8. [ ] Document testing patterns in CLAUDE.md

---

## Files to Create/Modify Summary

### Backend - New Files (24)
```
src/features/auth/
├── auth.module.ts
├── api/
│   ├── auth.controller.ts
│   └── dto/
│       ├── login.dto.ts
│       ├── register.dto.ts
│       └── auth-response.dto.ts
├── domain/
│   ├── auth.service.ts
│   ├── token.service.ts
│   ├── password.service.ts
│   └── session.service.ts
├── guards/
│   ├── jwt-auth.guard.ts
│   ├── roles.guard.ts
│   └── ws-auth.guard.ts
├── decorators/
│   ├── current-user.decorator.ts
│   ├── roles.decorator.ts
│   └── public.decorator.ts
└── strategies/
    └── jwt.strategy.ts

test/
├── setup/
│   ├── test-database.ts
│   └── mock-factories.ts
├── unit/auth/*.spec.ts (8 files)
├── integration/*.spec.ts (5 files)
└── e2e/*.spec.ts (4 files)
```

### Backend - Modify Files (8)
```
prisma/schema.prisma
src/app.module.ts
src/websocket/websocket.gateway.ts
src/features/business-management/api/business.controller.ts
src/features/map-scraping/api/scraper.controller.ts
src/features/lead-enrichment/api/enrichment.controller.ts
src/features/outreach-campaigns/api/outreach.controller.ts
src/features/analytics/api/analytics.controller.ts
```

### Frontend - New Files (18)
```
core/auth/
├── auth-provider.tsx
├── auth-context.ts
├── use-auth.ts
├── auth-api.ts
└── types.ts

app/login/page.tsx
app/register/page.tsx

components/auth/
├── login-form.tsx
├── register-form.tsx
├── protected-route.tsx
└── access-denied.tsx

__tests__/
├── unit/hooks/*.test.tsx (6 files)
├── unit/components/auth/*.test.tsx (3 files)
├── integration/*.test.tsx (4 files)
└── e2e/flows/*.test.tsx (3 files)
```

### Frontend - Modify Files (4)
```
core/api/api-client.ts
core/providers/app-providers.tsx
core/providers/websocket-provider.tsx
app/layout.tsx
```

---

## Success Criteria

### Authentication
- [ ] Users can register (admin-only after first user)
- [ ] Users can login and receive JWT
- [ ] Access tokens expire after 15 minutes
- [ ] Refresh tokens rotate on each use
- [ ] HTTP-only cookies prevent XSS token theft
- [ ] All API endpoints require authentication
- [ ] Role-based access control enforced
- [ ] WebSocket connections authenticated
- [ ] Logout invalidates all sessions

### Test Coverage
- [ ] Backend unit test coverage: 100%
- [ ] Backend integration test coverage: 100%
- [ ] Frontend unit test coverage: 100%
- [ ] Frontend integration test coverage: 100%
- [ ] E2E tests pass for all critical flows
- [ ] Visual regression tests baseline established
- [ ] CI/CD runs all tests on PR

---

## Dependencies to Add

### Backend
```bash
yarn add @nestjs/passport @nestjs/jwt passport passport-jwt bcrypt cookie-parser
yarn add -D @types/passport-jwt @types/bcrypt @types/cookie-parser
```

### Frontend
```bash
npm install js-cookie
npm install -D @types/js-cookie msw
```

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Breaking existing API clients | High | Add @Public() to health check, version API |
| Cookie auth issues on localhost | Medium | Configure proper CORS, test with HTTPS |
| Test database isolation | Medium | Use separate test DB, reset between tests |
| Token refresh race conditions | Low | Implement request queue during refresh |
| WebSocket reconnection loops | Low | Add exponential backoff, max attempts |

---

## Ready for Implementation

This plan provides a complete blueprint for implementing enterprise-grade authentication and 100% test coverage. The phased approach ensures each component is tested before moving forward.

**Estimated Total Effort:** 4 weeks
**Files to Create:** ~42
**Files to Modify:** ~12
**New Tests:** ~60+
