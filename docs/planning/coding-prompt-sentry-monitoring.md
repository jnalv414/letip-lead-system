# Coding Prompt: Sentry Error Monitoring & Performance Tracking

## Feature Description and Problem Solving

### Problem
The current application has no visibility into production errors, performance issues, or user-impacting bugs:

1. **No Error Tracking**
   ```typescript
   // Current: Errors logged to console only
   try {
     await enrichBusiness(id);
   } catch (error) {
     console.error('Enrichment failed:', error);  // Lost forever
   }
   ```
   **Problems:**
   - Errors disappear after server restart
   - No visibility into production issues
   - Can't reproduce bugs without user reports
   - No error aggregation or patterns
   - No notification when critical errors occur

2. **No Performance Monitoring**
   - Can't identify slow API endpoints
   - No database query profiling
   - No frontend performance tracking
   - Can't measure real user experience

3. **No User Context**
   - Don't know which users experiencing errors
   - Can't filter errors by business ID, location, etc.
   - No breadcrumbs showing what led to error
   - Can't replay user sessions

### Solution
Implement **Sentry** for comprehensive error tracking and performance monitoring:

**Sentry Benefits:**
- **Error Tracking:** Capture all exceptions with stack traces
- **Performance Monitoring:** Track API response times, database queries
- **User Context:** Attach user ID, business ID, request data
- **Breadcrumbs:** See actions leading to error
- **Alerts:** Slack/email when critical errors occur
- **Session Replay:** Watch user sessions (frontend)
- **Release Tracking:** Connect errors to deploys
- **Source Maps:** See original TypeScript code in stack traces

**Before (No Sentry):**
```
User reports: "Enrichment is broken"
→ Check logs: Nothing (already rotated)
→ Ask user for details
→ Can't reproduce
→ Give up
```

**After (With Sentry):**
```
Sentry alert: "EnrichmentService.enrichBusiness() failed 15 times in last hour"
→ Click error
→ See stack trace, user context, request data
→ Identify: Hunter.io API key expired
→ Fix immediately
→ Users notified
```

**Performance Example:**
```
Sentry Performance Dashboard shows:
- GET /api/businesses: Average 850ms (⚠️ slow!)
- Database query "SELECT * FROM businesses": 720ms
- Action: Add index on enrichment_status column
- Result: Average drops to 45ms ✅
```

---

## User Story

**As a** developer or product owner
**I want** real-time error tracking and performance monitoring
**So that** I can fix bugs proactively, optimize performance, and improve user experience

**Acceptance:**
- All backend errors captured with stack traces
- All frontend errors captured with stack traces
- Performance tracked for all API endpoints
- User context attached (business ID, user agent, etc.)
- Alerts sent for critical errors (>10 in 5 minutes)
- Source maps uploaded for readable stack traces
- Session replay enabled for frontend debugging
- Performance insights show slow endpoints

---

## Solution and Approach Rationale

### Why Sentry Over Alternatives

| Solution | Pros | Cons | Verdict |
|----------|------|------|---------|
| **Sentry** | Best-in-class error tracking, performance monitoring, session replay, affordable | Paid (free tier generous) | ✅ **Best choice** |
| LogRocket | Session replay, performance | Expensive ($99+/month) | ❌ Too expensive |
| Datadog | Enterprise monitoring suite | Very expensive, overkill | ❌ Too complex |
| Rollbar | Error tracking | No performance monitoring | ❌ Less features |
| New Relic | APM, monitoring | Expensive, complex setup | ❌ Overkill |
| CloudWatch Logs | Free (AWS), log aggregation | No error grouping, basic | ❌ Too basic |

**Why Sentry wins:**
- **Free tier:** 5,000 errors/month, 10,000 performance transactions/month
- **Full-stack:** Backend + Frontend + Performance
- **Session Replay:** See exactly what user did
- **Source Maps:** TypeScript support
- **Integrations:** Slack, GitHub, Jira
- **Industry standard:** Used by Airbnb, Microsoft, Dropbox

---

## Relevant Files and Context

### Files to Modify

1. **App/BackEnd/src/main.ts** - Initialize Sentry for backend
2. **App/BackEnd/src/app.module.ts** - Configure Sentry module
3. **App/FrontEnd/app/layout.tsx** - Initialize Sentry for frontend
4. **App/FrontEnd/next.config.js** - Configure source maps upload

### Files to Create

1. **App/BackEnd/sentry.config.ts** - Sentry backend configuration
2. **App/FrontEnd/sentry.client.config.ts** - Sentry client configuration
3. **App/FrontEnd/sentry.server.config.ts** - Sentry server configuration
4. **App/FrontEnd/sentry.edge.config.ts** - Sentry edge configuration
5. **.sentryclirc** - Sentry CLI config for source map upload

### Environment Variables

**Add to `App/BackEnd/.env`:**
```env
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
SENTRY_ENVIRONMENT=development
SENTRY_RELEASE=letip-backend@1.0.0
SENTRY_TRACES_SAMPLE_RATE=0.1  # 10% of transactions
```

**Add to `App/FrontEnd/.env.local`:**
```env
NEXT_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
SENTRY_ENVIRONMENT=development
SENTRY_RELEASE=letip-dashboard@1.0.0
SENTRY_TRACES_SAMPLE_RATE=0.1  # 10% of transactions
SENTRY_REPLAYS_SESSION_SAMPLE_RATE=0.1  # 10% of sessions
SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE=1.0  # 100% of error sessions
SENTRY_ORG=your-org
SENTRY_PROJECT=letip-dashboard
SENTRY_AUTH_TOKEN=your-auth-token
```

### Dependencies

**Backend:**
```bash
cd nodejs_space
yarn add @sentry/node @sentry/profiling-node
```

**Frontend:**
```bash
cd dashboard
npm install @sentry/nextjs
```

---

## Implementation Plan

### Phase 1: Sentry Account Setup (10-15 minutes)

**Step 1.1: Create Sentry account**
1. Go to https://sentry.io/signup/
2. Sign up with GitHub or email
3. Create new organization: "le-tip" or your company name

**Step 1.2: Create backend project**
1. Click "Create Project"
2. Select platform: Node.js
3. Project name: "letip-backend"
4. Copy DSN: `https://xxx@xxx.ingest.sentry.io/xxx`

**Step 1.3: Create frontend project**
1. Click "Create Project"
2. Select platform: Next.js
3. Project name: "letip-dashboard"
4. Copy DSN: `https://xxx@xxx.ingest.sentry.io/xxx`

**Step 1.4: Generate auth token for source maps**
1. Go to Settings → Account → API → Auth Tokens
2. Click "Create New Token"
3. Scopes: `project:releases`, `org:read`
4. Copy token

---

### Phase 2: Backend Sentry Integration (30-45 minutes)

**Step 2.1: Install dependencies**
```bash
cd nodejs_space
yarn add @sentry/node @sentry/profiling-node
```

**Step 2.2: Create Sentry configuration**

**File:** `App/BackEnd/src/sentry.config.ts`
```typescript
import * as Sentry from '@sentry/node';
import { ProfilingIntegration } from '@sentry/profiling-node';

export function initSentry() {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.SENTRY_ENVIRONMENT || 'development',
    release: process.env.SENTRY_RELEASE || 'letip-backend@unknown',

    // Performance monitoring
    tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1'),

    // Profiling
    profilesSampleRate: parseFloat(process.env.SENTRY_PROFILES_SAMPLE_RATE || '0.1'),
    integrations: [
      new ProfilingIntegration(),
    ],

    // Filter out sensitive data
    beforeSend(event, hint) {
      // Remove API keys from error data
      if (event.request?.data) {
        const data = event.request.data as any;
        if (data.api_key) data.api_key = '[REDACTED]';
        if (data.password) data.password = '[REDACTED]';
      }
      return event;
    },

    // Ignore specific errors
    ignoreErrors: [
      // Browser-only errors
      'ResizeObserver loop limit exceeded',
      // Network errors
      'Network request failed',
    ],
  });
}

export { Sentry };
```

**Step 2.3: Initialize Sentry in main.ts**

**File:** `App/BackEnd/src/main.ts`
```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { initSentry, Sentry } from './sentry.config';

async function bootstrap() {
  // Initialize Sentry FIRST (before anything else)
  initSentry();

  const app = await NestFactory.create(AppModule);

  // ... existing setup ...

  // Sentry error handler (must be registered last)
  app.use(Sentry.Handlers.requestHandler());
  app.use(Sentry.Handlers.tracingHandler());

  await app.listen(3000);

  // Capture successful startup
  Sentry.captureMessage('Backend started successfully', 'info');
}

bootstrap().catch((error) => {
  // Capture startup errors
  Sentry.captureException(error);
  throw error;
});
```

**Step 2.4: Add Sentry interceptor for NestJS**

**File:** `App/BackEnd/src/common/interceptors/sentry.interceptor.ts`
```typescript
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Sentry } from '../../sentry.config';

@Injectable()
export class SentryInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();

    // Start Sentry transaction
    const transaction = Sentry.startTransaction({
      op: 'http.server',
      name: `${request.method} ${request.url}`,
    });

    // Add user context
    if (request.user) {
      Sentry.setUser({
        id: request.user.id,
        email: request.user.email,
      });
    }

    // Add request context
    Sentry.setContext('request', {
      method: request.method,
      url: request.url,
      params: request.params,
      query: request.query,
    });

    return next.handle().pipe(
      tap(() => {
        // End transaction on success
        transaction.finish();
      }),
      catchError((error) => {
        // Capture error with context
        Sentry.captureException(error, {
          contexts: {
            request: {
              method: request.method,
              url: request.url,
              params: request.params,
              query: request.query,
            },
          },
        });

        // End transaction
        transaction.finish();

        return throwError(() => error);
      }),
    );
  }
}
```

**Step 2.5: Register interceptor globally**

**File:** `App/BackEnd/src/app.module.ts`
```typescript
import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { SentryInterceptor } from './common/interceptors/sentry.interceptor';

@Module({
  // ... existing imports ...
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: SentryInterceptor,
    },
    // ... other providers ...
  ],
})
export class AppModule {}
```

**Step 2.6: Add manual error capture in services**

**File:** `App/BackEnd/src/enrichment/enrichment.service.ts` (example)
```typescript
import { Sentry } from '../sentry.config';

async enrichBusiness(businessId: number) {
  try {
    // Set context for this operation
    Sentry.setContext('business', {
      id: businessId,
    });

    const result = await this.callHunterAPI(domain);
    return result;
  } catch (error) {
    // Capture with additional context
    Sentry.captureException(error, {
      tags: {
        service: 'hunter.io',
        operation: 'enrichment',
      },
      extra: {
        businessId,
        domain,
      },
    });

    throw error;
  }
}
```

**Step 2.7: Add environment variables**

**File:** `App/BackEnd/.env`
```env
# ... existing vars ...

# Sentry
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
SENTRY_ENVIRONMENT=development
SENTRY_RELEASE=letip-backend@1.0.0
SENTRY_TRACES_SAMPLE_RATE=0.1
SENTRY_PROFILES_SAMPLE_RATE=0.1
```

---

### Phase 3: Frontend Sentry Integration (30-45 minutes)

**Step 3.1: Install Sentry for Next.js**
```bash
cd dashboard
npx @sentry/wizard@latest -i nextjs
# Follow wizard prompts
```

**Alternatively, manual setup:**
```bash
npm install @sentry/nextjs
```

**Step 3.2: Create Sentry configurations**

**File:** `App/FrontEnd/sentry.client.config.ts`
```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.SENTRY_ENVIRONMENT || 'development',
  release: process.env.SENTRY_RELEASE || 'letip-dashboard@unknown',

  // Performance monitoring
  tracesSampleRate: parseFloat(process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE || '0.1'),

  // Session replay
  replaysSessionSampleRate: parseFloat(process.env.NEXT_PUBLIC_SENTRY_REPLAYS_SESSION_SAMPLE_RATE || '0.1'),
  replaysOnErrorSampleRate: parseFloat(process.env.NEXT_PUBLIC_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE || '1.0'),
  integrations: [
    new Sentry.Replay({
      maskAllText: true,  // Mask sensitive text
      blockAllMedia: false,  // Don't block images/videos
    }),
  ],

  // Filter sensitive data
  beforeSend(event, hint) {
    // Remove passwords, API keys, etc.
    if (event.request?.data) {
      const data = event.request.data as any;
      if (data.password) data.password = '[REDACTED]';
      if (data.api_key) data.api_key = '[REDACTED]';
    }
    return event;
  },

  // Ignore common errors
  ignoreErrors: [
    'ResizeObserver loop limit exceeded',
    'Non-Error promise rejection captured',
  ],
});
```

**File:** `App/FrontEnd/sentry.server.config.ts`
```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.SENTRY_ENVIRONMENT || 'development',
  release: process.env.SENTRY_RELEASE || 'letip-dashboard@unknown',

  // Performance monitoring (server-side)
  tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1'),

  // Profiling
  profilesSampleRate: parseFloat(process.env.SENTRY_PROFILES_SAMPLE_RATE || '0.1'),
});
```

**File:** `App/FrontEnd/sentry.edge.config.ts`
```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.SENTRY_ENVIRONMENT || 'development',
  release: process.env.SENTRY_RELEASE || 'letip-dashboard@unknown',
  tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1'),
});
```

**Step 3.3: Configure Next.js for Sentry**

**File:** `App/FrontEnd/next.config.js`
```javascript
const { withSentryConfig } = require('@sentry/nextjs');

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',  // Static export
  // ... existing config ...
};

module.exports = withSentryConfig(
  nextConfig,
  {
    // Sentry Webpack Plugin options
    org: process.env.SENTRY_ORG,
    project: process.env.SENTRY_PROJECT,
    authToken: process.env.SENTRY_AUTH_TOKEN,

    // Upload source maps
    silent: true,
    widenClientFileUpload: true,
    hideSourceMaps: true,
    disableLogger: true,
  },
  {
    // Sentry SDK options
    automaticVercelMonitors: false,
  }
);
```

**Step 3.4: Add manual error capture in components**

**File:** `App/FrontEnd/hooks/mutations/use-business-mutations.ts` (example)
```typescript
import * as Sentry from '@sentry/nextjs';

export function useDeleteBusiness() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => api.deleteBusiness(id),
    onError: (error: any, businessId) => {
      // Capture error with context
      Sentry.captureException(error, {
        tags: {
          operation: 'delete_business',
        },
        extra: {
          businessId,
        },
      });

      toast.error(`Failed to delete business: ${error.message}`);
    },
  });
}
```

**Step 3.5: Add user context on authentication**

**File:** `App/FrontEnd/app/layout.tsx` (example)
```typescript
import * as Sentry from '@sentry/nextjs';

export default function RootLayout({ children }) {
  // Set user context (if authenticated)
  useEffect(() => {
    // Example: After user logs in
    const user = getUserFromSession();
    if (user) {
      Sentry.setUser({
        id: user.id,
        email: user.email,
        username: user.name,
      });
    }
  }, []);

  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

**Step 3.6: Add environment variables**

**File:** `App/FrontEnd/.env.local`
```env
# ... existing vars ...

# Sentry
NEXT_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
SENTRY_ENVIRONMENT=development
SENTRY_RELEASE=letip-dashboard@1.0.0
NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE=0.1
NEXT_PUBLIC_SENTRY_REPLAYS_SESSION_SAMPLE_RATE=0.1
NEXT_PUBLIC_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE=1.0
SENTRY_ORG=your-org
SENTRY_PROJECT=letip-dashboard
SENTRY_AUTH_TOKEN=your-auth-token
```

---

### Phase 4: Alerts & Notifications (15-20 minutes)

**Step 4.1: Configure Slack integration**
1. In Sentry dashboard, go to Settings → Integrations
2. Find "Slack" and click "Install"
3. Authorize Slack workspace
4. Select channel: #alerts or #errors

**Step 4.2: Create alert rules**

**Critical Error Alert:**
1. Go to Alerts → Create Alert Rule
2. Conditions:
   - When: Event is first seen OR seen more than 10 times in 5 minutes
   - If: Issue level is error OR fatal
3. Actions:
   - Send notification to Slack #alerts
   - Send email to admin@letip.com

**Performance Alert:**
1. Create Alert Rule
2. Conditions:
   - When: Transaction duration is greater than 1000ms
   - For: More than 10 requests in 5 minutes
3. Actions:
   - Send notification to Slack #performance

**Step 4.3: Configure issue ownership**
1. Go to Settings → Issues → Ownership Rules
2. Add rules:
   ```
   # Backend errors
   path:App/BackEnd/* @backend-team

   # Frontend errors
   path:App/FrontEnd/* @frontend-team

   # Enrichment errors
   service:enrichment @data-team
   ```

---

### Phase 5: Release Tracking & Deploy Integration (15-20 minutes)

**Step 5.1: Create Sentry release on deploy**

**File:** `scripts/deploy.sh` (update)
```bash
#!/bin/bash
set -e

# Get version from git
VERSION=$(git rev-parse --short HEAD)
RELEASE="letip-backend@${VERSION}"

echo "🚀 Deploying ${RELEASE}..."

# Create Sentry release
sentry-cli releases new "$RELEASE"
sentry-cli releases set-commits "$RELEASE" --auto
sentry-cli releases finalize "$RELEASE"

# Deploy (existing code)
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d

# Mark release as deployed
sentry-cli releases deploys "$RELEASE" new -e production

echo "✅ Deployment complete!"
```

**Step 5.2: Install Sentry CLI**
```bash
# macOS
brew install getsentry/tools/sentry-cli

# Linux/Windows
curl -sL https://sentry.io/get-cli/ | bash
```

**Step 5.3: Configure Sentry CLI**

**File:** `.sentryclirc` (project root)
```ini
[defaults]
url=https://sentry.io/
org=your-org
project=letip-backend

[auth]
token=your-auth-token
```

**Step 5.4: Update Docker builds to include source maps**

**File:** `App/BackEnd/Dockerfile` (update build stage)
```dockerfile
# Stage 2: Build
FROM node:20-alpine AS builder

WORKDIR /app

# ... existing code ...

# Build with source maps
RUN yarn build

# Upload source maps to Sentry
ARG SENTRY_AUTH_TOKEN
ARG SENTRY_ORG
ARG SENTRY_PROJECT
ARG SENTRY_RELEASE

RUN if [ -n "$SENTRY_AUTH_TOKEN" ]; then \
      npx @sentry/cli releases files "${SENTRY_RELEASE}" upload-sourcemaps ./dist; \
    fi
```

---

## Testing Strategy

### Manual Tests (5 tests)

1. **Trigger test error in backend**
   ```bash
   curl http://localhost:3000/api/test-error
   # Check Sentry dashboard for error
   ```

2. **Trigger test error in frontend**
   ```typescript
   <Button onClick={() => { throw new Error('Test error'); }}>
     Test Error
   </Button>
   ```

3. **Check performance transaction**
   - Make API request
   - Check Sentry Performance tab
   - Verify transaction appears

4. **Check session replay**
   - Navigate dashboard with errors
   - Check Sentry Session Replay
   - Verify session recorded

5. **Check Slack alert**
   - Trigger 15 errors in 2 minutes
   - Check Slack #alerts channel
   - Verify alert received

---

## Acceptance Criteria

### Functional Requirements (15 criteria)

1. ✅ Sentry initialized for backend
2. ✅ Sentry initialized for frontend (client + server + edge)
3. ✅ All backend exceptions captured automatically
4. ✅ All frontend exceptions captured automatically
5. ✅ Performance transactions tracked for API endpoints
6. ✅ Session replay enabled for frontend
7. ✅ User context attached to errors (user ID, email)
8. ✅ Request context attached (method, URL, params)
9. ✅ Source maps uploaded for readable stack traces
10. ✅ Slack alerts configured for critical errors
11. ✅ Release tracking enabled (git SHA)
12. ✅ Sensitive data filtered (passwords, API keys)
13. ✅ Performance alerts for slow endpoints (>1s)
14. ✅ Issue ownership rules configured
15. ✅ Breadcrumbs track user actions before error

### Performance Requirements

1. ✅ Sentry overhead <5ms per request
2. ✅ Source maps uploaded during build (not runtime)
3. ✅ Sample rate configured (10% transactions, 10% sessions)

---

## Validation Commands

### 1. Verify Sentry Installed
```bash
# Backend
cd nodejs_space
grep @sentry package.json
# Expected: "@sentry/node": "^x.x.x"

# Frontend
cd dashboard
grep @sentry package.json
# Expected: "@sentry/nextjs": "^x.x.x"
```

### 2. Test Backend Error Capture
```bash
# Add test endpoint
# File: App/BackEnd/src/app.controller.ts
@Get('test-error')
testError() {
  throw new Error('Test error from backend');
}

# Trigger error
curl http://localhost:3000/test-error

# Check Sentry dashboard
# Expected: Error appears with stack trace
```

### 3. Test Frontend Error Capture
```typescript
// App/FrontEnd/app/page.tsx
<Button onClick={() => {
  throw new Error('Test error from frontend');
}}>
  Test Error
</Button>

// Click button
// Check Sentry dashboard
// Expected: Error appears with React component tree
```

### 4. Test Performance Tracking
```bash
# Make API request
curl http://localhost:3000/api/businesses

# Check Sentry → Performance → Transactions
# Expected: Transaction "GET /api/businesses" appears with timing
```

### 5. Test Session Replay
```bash
# 1. Navigate dashboard in Chrome
# 2. Trigger error (throw Error)
# 3. Go to Sentry → Session Replay
# Expected: Video replay of session
```

### 6. Test Slack Alert
```bash
# Trigger 15 errors rapidly
for i in {1..15}; do
  curl http://localhost:3000/test-error &
done

# Wait 1 minute
# Check Slack #alerts channel
# Expected: Alert message with error link
```

### 7. Verify Source Maps
```bash
# Check error in Sentry dashboard
# Click stack trace line
# Expected: See original TypeScript code, not compiled JavaScript
```

### 8. Test Release Tracking
```bash
# Create release
VERSION=$(git rev-parse --short HEAD)
sentry-cli releases new "letip-backend@$VERSION"

# Check Sentry → Releases
# Expected: New release appears
```

### 9. Test User Context
```typescript
// Set user context
import * as Sentry from '@sentry/nextjs';
Sentry.setUser({ id: 123, email: 'test@example.com' });

// Trigger error
throw new Error('Test');

// Check Sentry error
// Expected: User info appears in error details
```

### 10. Verify Sensitive Data Filtered
```bash
# Trigger error with sensitive data
curl -X POST http://localhost:3000/api/test-error \
  -d '{"api_key": "secret123", "password": "pass123"}'

# Check Sentry error
# Expected: api_key and password show "[REDACTED]"
```

---

## Summary

This implementation transforms Le Tip from **blind production debugging** to **proactive error monitoring** with:

✅ **Error Tracking** (all exceptions captured)
✅ **Performance Monitoring** (slow endpoints identified)
✅ **Session Replay** (watch user sessions)
✅ **Slack Alerts** (instant notifications)
✅ **User Context** (know who's affected)
✅ **Source Maps** (readable stack traces)
✅ **Release Tracking** (connect errors to deploys)
✅ **Sensitive Data Filtering** (secure)

**Estimated Implementation Time:** 2-3 hours
**Free Tier:** 5,000 errors/month, 10,000 transactions/month
**Value:** Proactive bug fixing, faster debugging, better user experience
