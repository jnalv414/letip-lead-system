# TanStack Query Implementation - Code Review Report

**Project:** Le Tip Lead Management System
**Review Date:** 2025-11-22
**Reviewer:** code-reviewer agent
**Review Type:** Pre-Implementation Analysis

---

## Executive Summary

**STATUS:** ⚠️ **NO IMPLEMENTATION FOUND** - Dashboard codebase does not exist

The TanStack Query integration documented in `/docs/planning/coding-prompt-frontend-tanstack-query.md` has **not been implemented**. The `dashboard/` directory contains only:
- `.gitkeep` placeholder file
- Empty `docs/` subdirectory

**Recommendation:** Implementation required before code review can proceed.

---

## Current State Analysis

### 1. File System Inspection

**Expected Files (from planning document):**
```
dashboard/
├── lib/
│   ├── api-client.ts          ❌ NOT FOUND
│   ├── query-client.ts        ❌ NOT FOUND
├── hooks/
│   ├── queries/
│   │   ├── use-businesses.ts  ❌ NOT FOUND
│   │   ├── use-scraper.ts     ❌ NOT FOUND
│   │   ├── use-enrichment.ts  ❌ NOT FOUND
│   ├── mutations/
│   │   ├── use-business-mutations.ts  ❌ NOT FOUND
│   │   ├── use-scraper-mutations.ts   ❌ NOT FOUND
│   │   ├── use-enrichment-mutations.ts ❌ NOT FOUND
│   ├── use-socket.ts          ❌ NOT FOUND
├── providers/
│   ├── query-provider.tsx     ❌ NOT FOUND
│   ├── socket-provider.tsx    ❌ NOT FOUND
├── app/
│   ├── layout.tsx             ❌ NOT FOUND
│   ├── dashboard/
│   │   ├── page.tsx           ❌ NOT FOUND
│   ├── businesses/
│   │   ├── page.tsx           ❌ NOT FOUND
│   ├── scraper/
│   │   ├── page.tsx           ❌ NOT FOUND
├── package.json               ❌ NOT FOUND
├── tsconfig.json              ❌ NOT FOUND
├── .env.local                 ❌ NOT FOUND
```

**Actual Files:**
```
dashboard/
├── .gitkeep                   ✅ EXISTS (placeholder)
├── docs/                      ✅ EXISTS (empty directory)
```

### 2. Backend API Status

**Backend Implementation:** ✅ **COMPLETE**

Verified backend files exist and appear production-ready:
- `/nodejs_space/src/businesses/` - CRUD operations
- `/nodejs_space/src/scraper/` - Google Maps scraping
- `/nodejs_space/src/enrichment/` - Hunter.io + AbstractAPI integration
- `/nodejs_space/src/websocket/` - Socket.io gateway
- `/nodejs_space/src/prisma/` - Database client

**API Endpoints Available:**
- `GET /api/businesses` ✅
- `GET /api/businesses/:id` ✅
- `DELETE /api/businesses/:id` ✅
- `GET /api/businesses/stats` ✅
- `POST /api/scraper/scrape` ✅
- `GET /api/scraper/status/:jobId` ✅
- `POST /api/enrichment/:id` ✅
- `POST /api/enrichment/batch` ✅

**WebSocket Events Available:**
- `business:created` ✅
- `business:updated` ✅
- `business:deleted` ✅
- `scraping:progress` ✅
- `scraping:complete` ✅
- `enrichment:progress` ✅
- `stats:updated` ✅

---

## Code Review Findings

Since no implementation exists, this review analyzes the **planning documentation quality** and provides **pre-implementation guidance**.

---

## 1. TypeScript Quality Review

### Planning Document Analysis: ✅ **EXCELLENT (95/100)**

**Strengths:**
- ✅ Complete TypeScript interfaces defined for all DTOs
- ✅ Proper use of generics: `PaginatedResponse<T>`, `UseQueryOptions<T>`
- ✅ All optional parameters marked with `?`
- ✅ Discriminated unions for status: `'pending' | 'enriched' | 'failed'`
- ✅ Return types specified for all API functions

**Example from plan:**
```typescript
export interface Business {
  id: number;
  name: string;
  enrichment_status: 'pending' | 'enriched' | 'failed';  // ✅ Proper union type
  contacted: boolean;
  contacts?: Contact[];  // ✅ Optional relationship
}

export const api = {
  getBusinesses: async (params?: {
    page?: number;  // ✅ Optional params
    limit?: number;
  }): Promise<PaginatedResponse<Business>> => {  // ✅ Explicit return type
    const { data } = await apiClient.get('/api/businesses', { params });
    return data;
  },
};
```

**Minor Issues to Address:**
- ⚠️ No `readonly` modifiers on DTOs (consider for immutability)
- ⚠️ `EnrichmentLog.request_data: any` should be typed
- ⚠️ Missing `unknown` type in catch blocks

**Recommendations:**
1. Replace `any` with specific types in `EnrichmentLog.request_data`
2. Use `unknown` in catch blocks: `catch (error: unknown)`
3. Add `readonly` to DTO properties that shouldn't mutate

**Score:** 95/100

---

## 2. TanStack Query Patterns Review

### Planning Document Analysis: ✅ **EXCELLENT (92/100)**

**Strengths:**

✅ **Query Key Structure** - Follows TanStack Query v5 best practices:
```typescript
queryKey: ['businesses', params]  // ✅ Array format with params
queryKey: ['businesses', id]      // ✅ Hierarchical structure
queryKey: ['stats']               // ✅ Simple key for singleton
```

✅ **Conditional Queries** - Proper use of `enabled` option:
```typescript
export function useBusiness(id: number) {
  return useQuery({
    queryKey: ['businesses', id],
    queryFn: () => api.getBusiness(id),
    enabled: !!id,  // ✅ Only fetch when ID exists
  });
}
```

✅ **Polling Configuration** - Smart polling that stops when complete:
```typescript
refetchInterval: (data) => {
  if (!data) return false;
  return data.status === 'active' || data.status === 'waiting' ? 2000 : false;
}
```

✅ **Optimistic Updates** - Complete implementation with rollback:
```typescript
onMutate: async (businessId) => {
  await queryClient.cancelQueries({ queryKey: ['businesses'] });  // ✅ Cancel outgoing
  const previous = queryClient.getQueryData(['businesses']);      // ✅ Snapshot
  queryClient.setQueryData(['businesses'], (old) =>               // ✅ Optimistic update
    old?.data.filter((b) => b.id !== businessId)
  );
  return { previous };  // ✅ Return context for rollback
},
onError: (err, businessId, context) => {
  if (context?.previous) {
    queryClient.setQueryData(['businesses'], context.previous);   // ✅ Rollback
  }
},
onSettled: () => {
  queryClient.invalidateQueries({ queryKey: ['businesses'] });    // ✅ Refetch
}
```

**Issues to Address:**

⚠️ **Issue 1: Missing type safety in optimistic update**
```typescript
// Current (from plan):
queryClient.setQueryData<any>(['businesses'], (old) => {
  // ^^^ Using `any` loses type safety
});

// Recommended:
queryClient.setQueryData<PaginatedResponse<Business>>(['businesses'], (old) => {
  if (!old) return old;
  return {
    ...old,
    data: old.data.filter((b) => b.id !== businessId),
  };
});
```

⚠️ **Issue 2: Race condition in WebSocket events**
```typescript
// Current (from plan):
socket.on('business:created', (data) => {
  queryClient.invalidateQueries({ queryKey: ['businesses'] });  // ⚠️ No cancel
});

// Recommended:
socket.on('business:created', async (data) => {
  await queryClient.cancelQueries({ queryKey: ['businesses'] });  // ✅ Cancel first
  queryClient.invalidateQueries({ queryKey: ['businesses'] });
});
```

⚠️ **Issue 3: Stale time configuration may be too aggressive**
```typescript
// Current:
staleTime: 5 * 60 * 1000,  // 5 minutes

// Problem: Stats should refresh more frequently (30s via polling)
// Recommendation: Override per-query:
export function useStats() {
  return useQuery({
    queryKey: ['stats'],
    queryFn: api.getStats,
    staleTime: 30000,        // ✅ 30 seconds for stats
    refetchInterval: 30000,  // ✅ Poll every 30s
  });
}
```

**Score:** 92/100

---

## 3. WebSocket Integration Review

### Planning Document Analysis: ✅ **GOOD (85/100)**

**Strengths:**

✅ **Cleanup Implementation:**
```typescript
useEffect(() => {
  const socket = io(WS_URL, { /* config */ });

  // Event handlers...

  return () => {
    socket.disconnect();  // ✅ Proper cleanup
    socketRef.current = null;
  };
}, [queryClient]);
```

✅ **Reconnection Logic:**
```typescript
const socket = io(WS_URL, {
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5,
});
```

✅ **Event Mapping:**
```typescript
socket.on('business:created', (data) => {
  queryClient.invalidateQueries({ queryKey: ['businesses'] });
  queryClient.invalidateQueries({ queryKey: ['stats'] });
  toast.success(`New business added: ${data.data.name}`);
});
```

**Critical Issues to Address:**

🔴 **CRITICAL: Memory Leak Risk** - Multiple event handler registrations
```typescript
// Current (from plan):
useEffect(() => {
  const socket = io(WS_URL);

  socket.on('business:created', handler);  // ⚠️ If effect re-runs, adds duplicate
  socket.on('business:updated', handler);
  // ... more handlers

  return () => {
    socket.disconnect();  // ⚠️ Doesn't remove specific handlers
  };
}, [queryClient]);

// Recommended:
useEffect(() => {
  const socket = io(WS_URL);

  const handlers = {
    'business:created': (data) => { /* ... */ },
    'business:updated': (data) => { /* ... */ },
  };

  // Register handlers
  Object.entries(handlers).forEach(([event, handler]) => {
    socket.on(event, handler);
  });

  // Cleanup
  return () => {
    Object.entries(handlers).forEach(([event, handler]) => {
      socket.off(event, handler);  // ✅ Remove specific handlers
    });
    socket.disconnect();
  };
}, [queryClient]);
```

🔴 **CRITICAL: Race Condition** - No query cancellation before optimistic updates
```typescript
// Current:
socket.on('scraping:progress', (data) => {
  queryClient.setQueryData(['scrape-status', data.data.jobId], (old) => ({
    ...old,
    progress: data.data.progress,
  }));
  // ⚠️ If query is refetching, this could overwrite server data
});

// Recommended:
socket.on('scraping:progress', async (data) => {
  await queryClient.cancelQueries({
    queryKey: ['scrape-status', data.data.jobId]
  });
  queryClient.setQueryData(['scrape-status', data.data.jobId], (old) => ({
    ...old,
    progress: data.data.progress,
  }));
});
```

⚠️ **Issue: Missing error handling for socket events**
```typescript
// Current: No try/catch in handlers

// Recommended:
socket.on('business:created', (data) => {
  try {
    queryClient.invalidateQueries({ queryKey: ['businesses'] });
    toast.success(`New business added: ${data.data.name}`);
  } catch (error) {
    console.error('Error handling business:created event:', error);
  }
});
```

**Score:** 85/100

---

## 4. React Best Practices Review

### Planning Document Analysis: ✅ **EXCELLENT (94/100)**

**Strengths:**

✅ **Client Components Properly Marked:**
```typescript
'use client';  // ✅ At top of file

import { useQuery } from '@tanstack/react-query';
```

✅ **No useEffect for Data Fetching:**
```typescript
// ✅ Correct approach:
const { data, isLoading } = useQuery({
  queryKey: ['businesses'],
  queryFn: api.getBusinesses,
});

// ❌ Avoid:
// useEffect(() => {
//   fetch('/api/businesses').then(setData);
// }, []);
```

✅ **Proper Dependency Arrays:**
```typescript
useEffect(() => {
  socket.on('business:created', handler);
  return () => socket.disconnect();
}, [queryClient]);  // ✅ Includes all external dependencies
```

✅ **Provider Setup:**
```typescript
<QueryProvider>
  <SocketProvider>
    {children}
    <Toaster />
  </SocketProvider>
</QueryProvider>
// ✅ Correct nesting order
```

**Minor Issues:**

⚠️ **Missing Error Boundaries** - No error boundary component defined
```typescript
// Recommended addition:
// components/ErrorBoundary.tsx
'use client';

import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Error boundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <div>Something went wrong</div>;
    }
    return this.props.children;
  }
}
```

⚠️ **Potential Re-render Issue** - Creating new objects in render
```typescript
// Current (from plan):
const { data } = useBusinesses({ page, city });
// ✅ Correct - primitive values

// But watch for:
const filters = { page, city, status: 'pending' };
const { data } = useBusinesses(filters);
// ⚠️ New object every render = new query key = refetch

// Recommended:
const filters = useMemo(
  () => ({ page, city, status: 'pending' }),
  [page, city]
);
```

**Score:** 94/100

---

## 5. Error Handling Review

### Planning Document Analysis: ✅ **GOOD (88/100)**

**Strengths:**

✅ **Mutation Error Handling:**
```typescript
export function useDeleteBusiness() {
  return useMutation({
    mutationFn: api.deleteBusiness,
    onError: (error: any) => {
      toast.error(`Failed to delete business: ${error.message}`);
    },
  });
}
```

✅ **Axios Interceptors:**
```typescript
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      console.error('Unauthorized');
    }
    return Promise.reject(error);
  }
);
```

✅ **Retry Logic:**
```typescript
const queryConfig: DefaultOptions = {
  queries: {
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  },
};
```

**Critical Issues:**

🔴 **SECURITY: Type Assertion in Error Handling**
```typescript
// Current:
onError: (error: any) => {  // ⚠️ `any` type loses type safety
  toast.error(`Failed: ${error.message}`);
}

// Recommended:
onError: (error: unknown) => {
  const message = error instanceof Error
    ? error.message
    : 'An unknown error occurred';
  toast.error(`Failed: ${message}`);
}
```

🔴 **SECURITY: Exposing Raw Error Messages**
```typescript
// Current:
toast.error(`Failed to delete business: ${error.message}`);
// ⚠️ Could expose sensitive backend error details

// Recommended:
const getUserFriendlyMessage = (error: unknown): string => {
  if (error instanceof AxiosError) {
    if (error.response?.status === 404) return 'Business not found';
    if (error.response?.status === 500) return 'Server error. Please try again.';
  }
  return 'An unexpected error occurred';
};

toast.error(getUserFriendlyMessage(error));
```

⚠️ **Missing Global Error Handler:**
```typescript
// Recommended addition:
// lib/query-client.ts
const queryConfig: DefaultOptions = {
  mutations: {
    onError: (error) => {
      // Global error handler for all mutations
      console.error('Mutation error:', error);
      Sentry.captureException(error);  // If using Sentry
    },
  },
};
```

**Score:** 88/100

---

## 6. Performance Review

### Planning Document Analysis: ✅ **EXCELLENT (91/100)**

**Strengths:**

✅ **Request Deduplication:**
```typescript
// Multiple components calling useStats() = 1 API call
const { data: stats } = useStats();
```

✅ **Stale-While-Revalidate:**
```typescript
const queryConfig = {
  queries: {
    staleTime: 5 * 60 * 1000,    // Cache 5 min
    gcTime: 10 * 60 * 1000,       // Keep in memory 10 min
    refetchOnWindowFocus: true,   // Refresh on focus
  },
};
```

✅ **Polling Stops on Completion:**
```typescript
refetchInterval: (data) => {
  if (!data) return false;
  return data.status === 'active' ? 2000 : false;  // ✅ Stops when done
}
```

✅ **Cleanup in useEffect:**
```typescript
return () => {
  socket.disconnect();
  socketRef.current = null;
};
```

**Performance Issues:**

⚠️ **Issue 1: No Prefetching for Pagination**
```typescript
// Current: User clicks "Next" → waits for API call

// Recommended: Prefetch next page
export function useBusinesses(params: UseBusinessesParams) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ['businesses', params],
    queryFn: () => api.getBusinesses(params),
  });

  // Prefetch next page
  useEffect(() => {
    if (params.page) {
      queryClient.prefetchQuery({
        queryKey: ['businesses', { ...params, page: params.page + 1 }],
        queryFn: () => api.getBusinesses({ ...params, page: params.page + 1 }),
      });
    }
  }, [params.page, queryClient]);

  return query;
}
```

⚠️ **Issue 2: Unnecessary Re-renders in WebSocket Handler**
```typescript
// Current:
socket.on('stats:updated', () => {
  queryClient.invalidateQueries({ queryKey: ['stats'] });
  // ⚠️ Invalidates all components using stats
});

// Recommended: Debounce if frequent events
const debouncedStatsInvalidation = debounce(() => {
  queryClient.invalidateQueries({ queryKey: ['stats'] });
}, 1000);

socket.on('stats:updated', debouncedStatsInvalidation);
```

⚠️ **Issue 3: No Lazy Loading for Business Detail**
```typescript
// Current: All business data loaded upfront

// Recommended: Use suspense for code splitting
const BusinessDetail = lazy(() => import('./components/BusinessDetail'));

<Suspense fallback={<LoadingSpinner />}>
  <BusinessDetail id={id} />
</Suspense>
```

**Score:** 91/100

---

## 7. Security Review

### Planning Document Analysis: ⚠️ **NEEDS IMPROVEMENT (72/100)**

**Current Security Posture:**

✅ **Environment Variables:**
```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
```

✅ **No API Keys in Client Code:**
```typescript
// API keys stored on backend only ✅
```

**Critical Security Issues:**

🔴 **NO AUTHENTICATION IMPLEMENTED**
```typescript
// Current: All API calls unauthenticated
export const apiClient = axios.create({
  baseURL: API_URL,
  // ⚠️ No auth headers
});

// Recommended:
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

🔴 **CORS CONFIGURATION NOT SPECIFIED**
```typescript
// Backend must restrict CORS origins
// Recommended backend config:
app.enableCors({
  origin: process.env.FRONTEND_URL,  // Not '*'
  credentials: true,
});
```

🔴 **XSS VULNERABILITY RISK** - Rendering user data
```typescript
// Potential issue:
<div>{business.name}</div>  // ⚠️ If name contains <script>, XSS risk

// React escapes by default, but be careful with:
// - dangerouslySetInnerHTML
// - Direct DOM manipulation
```

🔴 **SENSITIVE DATA IN QUERY KEYS**
```typescript
// Current:
queryKey: ['businesses', { search: userInput }]
// ⚠️ Query keys visible in React Query DevTools

// Recommendation: Don't include PII in query keys
// Use opaque identifiers instead
```

**Security Recommendations:**

1. **Implement JWT Authentication**
   ```typescript
   // Add to api-client.ts
   let accessToken: string | null = null;

   export const setAccessToken = (token: string) => {
     accessToken = token;
     localStorage.setItem('auth_token', token);
   };

   apiClient.interceptors.request.use((config) => {
     if (accessToken) {
       config.headers.Authorization = `Bearer ${accessToken}`;
     }
     return config;
   });
   ```

2. **Add CSRF Protection**
   ```typescript
   // Backend: Send CSRF token in cookie
   // Frontend: Include in requests
   apiClient.defaults.xsrfCookieName = 'csrf-token';
   apiClient.defaults.xsrfHeaderName = 'X-CSRF-Token';
   ```

3. **Sanitize User Input**
   ```typescript
   import DOMPurify from 'dompurify';

   const sanitizedName = DOMPurify.sanitize(business.name);
   ```

4. **Add Rate Limiting**
   ```typescript
   // Backend: Implement rate limiting
   // Frontend: Show user-friendly message when rate limited
   ```

**Score:** 72/100

---

## 8. Testing Coverage Review

### Planning Document Analysis: ⚠️ **PLANNED BUT NOT IMPLEMENTED (0/100)**

**Test Plan Exists:** ✅ Yes (documented in planning doc)

**Tests Implemented:** ❌ No

**Planned Tests:**

**Unit Tests (6 planned):**
1. ❌ API Client - GET request
2. ❌ API Client - POST with headers
3. ❌ Query Client - cache config
4. ❌ useBusinesses hook - query key structure
5. ❌ useDeleteBusiness - optimistic update
6. ❌ WebSocket hook - query invalidation

**Integration Tests (3 planned):**
1. ❌ Fetch → Display in component
2. ❌ Delete → Optimistic update → Rollback
3. ❌ WebSocket event → Cache invalidation

**E2E Tests (2 planned):**
1. ❌ Complete CRUD flow
2. ❌ Scraping with polling

**Recommendations:**

1. **Use Testing Library Best Practices:**
   ```typescript
   // Example test:
   import { renderHook, waitFor } from '@testing-library/react';
   import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
   import { useBusinesses } from './use-businesses';

   test('useBusinesses fetches and caches data', async () => {
     const queryClient = new QueryClient();
     const wrapper = ({ children }) => (
       <QueryClientProvider client={queryClient}>
         {children}
       </QueryClientProvider>
     );

     const { result } = renderHook(() => useBusinesses(), { wrapper });

     await waitFor(() => expect(result.current.isSuccess).toBe(true));
     expect(result.current.data).toHaveProperty('data');
   });
   ```

2. **Mock Socket.io in Tests:**
   ```typescript
   jest.mock('socket.io-client', () => ({
     io: jest.fn(() => ({
       on: jest.fn(),
       off: jest.fn(),
       disconnect: jest.fn(),
     })),
   }));
   ```

3. **Test Optimistic Updates:**
   ```typescript
   test('delete mutation rolls back on error', async () => {
     // Mock API to fail
     api.deleteBusiness = jest.fn().mockRejectedValue(new Error('Failed'));

     const { result } = renderHook(() => useDeleteBusiness());

     await result.current.mutateAsync(123);

     // Verify rollback occurred
     expect(queryClient.getQueryData(['businesses'])).toEqual(previousData);
   });
   ```

**Score:** 0/100 (no implementation)

**Target Coverage:** > 80%

---

## 9. Documentation Review

### Planning Document Analysis: ✅ **EXCELLENT (96/100)**

**Strengths:**

✅ **Comprehensive Planning Document:**
- Complete feature description and problem solving
- User stories with acceptance criteria
- Solution rationale with alternatives considered
- Step-by-step implementation plan
- Code examples for all patterns
- Validation commands

✅ **Type Definitions:**
```typescript
export interface Business {
  id: number;
  name: string;
  // ... well-documented fields
}
```

✅ **Implementation Examples:**
- Query hooks
- Mutation hooks
- WebSocket integration
- Component usage

**Missing Documentation:**

⚠️ **No JSDoc Comments:**
```typescript
// Current:
export function useBusinesses(params: UseBusinessesParams) {
  return useQuery({
    queryKey: ['businesses', params],
    queryFn: () => api.getBusinesses(params),
  });
}

// Recommended:
/**
 * Fetches paginated list of businesses with optional filtering.
 *
 * @param params - Filter parameters (page, limit, city, status, search)
 * @param options - Additional TanStack Query options
 * @returns Query result with businesses data and metadata
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useBusinesses({ page: 1, city: 'Freehold' });
 * ```
 */
export function useBusinesses(
  params: UseBusinessesParams = {},
  options?: Omit<UseQueryOptions<PaginatedResponse<Business>>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: ['businesses', params],
    queryFn: () => api.getBusinesses(params),
    ...options,
  });
}
```

⚠️ **Missing README.md:**
```markdown
# Le Tip Dashboard - TanStack Query Integration

## Quick Start

\`\`\`bash
npm install
npm run dev
\`\`\`

## Architecture

- **TanStack Query v5** - Server state management
- **Socket.io** - Real-time updates
- **Axios** - HTTP client

## Query Keys

All query keys follow the pattern: `['resource', params]`

- `['businesses', { page, city }]` - Business list
- `['businesses', id]` - Single business
- `['stats']` - Dashboard statistics

## Environment Variables

Required in `.env.local`:

\`\`\`env
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_WS_URL=http://localhost:3000
\`\`\`
```

⚠️ **No Query Key Documentation:**
Create `docs/QUERY_KEYS.md`:
```markdown
# Query Key Conventions

## Businesses
- `['businesses']` - All businesses (no filters)
- `['businesses', { page, limit, city, status }]` - Filtered list
- `['businesses', id]` - Single business detail

## Stats
- `['stats']` - Dashboard statistics (auto-refetches every 30s)

## Jobs
- `['scrape-status', jobId]` - Scraping job status (polls while active)
- `['job-status', jobId]` - Generic job status
- `['failed-jobs', limit]` - Failed jobs list
```

**Score:** 96/100

---

## 10. Consistency Review

### Planning Document Analysis: ✅ **EXCELLENT (93/100)**

**Strengths:**

✅ **Consistent Naming:**
```typescript
// Hooks:
useBusinesses()    // ✅ Plural for list
useBusiness(id)    // ✅ Singular for detail
useStats()         // ✅ Singular for singleton

// Mutations:
useCreateBusiness()  // ✅ Verb + noun
useDeleteBusiness()
useUpdateBusiness()
```

✅ **Consistent Query Keys:**
```typescript
['businesses', params]  // ✅ Lowercase, plural
['businesses', id]      // ✅ Hierarchical
['stats']               // ✅ Singular for aggregates
```

✅ **Consistent Error Messages:**
```typescript
toast.error(`Failed to delete business: ${error.message}`);
toast.error(`Failed to create business: ${error.message}`);
// ✅ Same format across mutations
```

✅ **Consistent Toast Notifications:**
```typescript
toast.success('Business created successfully');
toast.success('Business deleted successfully');
// ✅ Consistent phrasing
```

**Minor Inconsistencies:**

⚠️ **API Function Naming:**
```typescript
// Current:
api.getBusinesses()   // ✅ get prefix
api.createBusiness()  // ✅ create prefix
api.deleteBusiness()  // ✅ delete prefix

// But:
api.startScrape()     // ⚠️ Inconsistent (should be `createScrapeJob`?)
api.enrichBusiness()  // ⚠️ No verb prefix

// Recommended:
api.createScrapeJob()
api.createEnrichmentJob()
```

⚠️ **File Naming:**
```typescript
// Current:
use-businesses.ts         // ✅ Kebab-case
use-business-mutations.ts // ✅ Kebab-case

// But planning doc shows:
use-socket.ts  // ⚠️ Missing "use-websocket.ts" pattern?

// Recommended consistency:
use-websocket.ts  // Match naming convention
```

**Score:** 93/100

---

## Overall Scores

| Category | Score | Status |
|----------|-------|--------|
| **1. TypeScript Quality** | 95/100 | ✅ Excellent |
| **2. TanStack Query Patterns** | 92/100 | ✅ Excellent |
| **3. WebSocket Integration** | 85/100 | ✅ Good |
| **4. React Best Practices** | 94/100 | ✅ Excellent |
| **5. Error Handling** | 88/100 | ✅ Good |
| **6. Performance** | 91/100 | ✅ Excellent |
| **7. Security** | 72/100 | ⚠️ Needs Improvement |
| **8. Testing Coverage** | 0/100 | ❌ Not Implemented |
| **9. Documentation** | 96/100 | ✅ Excellent |
| **10. Consistency** | 93/100 | ✅ Excellent |
| **OVERALL** | **80.6/100** | ⚠️ **NOT READY** |

---

## Production Readiness Assessment

### ❌ NOT PRODUCTION READY

**Blockers:**

1. ❌ **No implementation exists** - Only planning documentation
2. ❌ **No authentication** - All endpoints public
3. ❌ **No tests** - 0% coverage
4. ❌ **Security vulnerabilities** - No CSRF, no rate limiting, no input sanitization

**Before Proceeding to Implementation:**

1. ✅ Review and approve planning document
2. ✅ Address security concerns in architecture
3. ✅ Define authentication strategy
4. ✅ Create test strategy and tooling setup
5. ✅ Set up CI/CD pipeline

---

## Critical Findings Summary

### 🔴 CRITICAL (Must Fix Before Implementation)

1. **WebSocket Memory Leak Risk**
   - Event handlers may register multiple times
   - Missing `.off()` cleanup for specific handlers
   - **Fix:** Use event handler registry with proper cleanup

2. **Race Conditions in Cache Updates**
   - WebSocket events don't cancel queries before updating cache
   - Optimistic updates may conflict with server responses
   - **Fix:** Always `await queryClient.cancelQueries()` before `setQueryData()`

3. **No Authentication System**
   - All API endpoints publicly accessible
   - No JWT/session management
   - **Fix:** Implement JWT with refresh tokens

4. **Security: Exposing Raw Error Messages**
   - Backend errors shown directly to users
   - Could leak sensitive information
   - **Fix:** User-friendly error mapper function

5. **Missing Error Boundaries**
   - Uncaught errors crash entire app
   - No graceful degradation
   - **Fix:** Add ErrorBoundary components

---

## Recommendations for Implementation

### Phase 1: Foundation (Before Writing Code)

1. **Security Architecture:**
   - [ ] Design JWT authentication flow
   - [ ] Define authorization rules (RBAC?)
   - [ ] Plan CSRF protection strategy
   - [ ] Add rate limiting to backend API

2. **Testing Setup:**
   - [ ] Install testing dependencies (`@testing-library/react`, `vitest`)
   - [ ] Configure test environment
   - [ ] Create test utilities and mocks
   - [ ] Set up CI pipeline for test automation

3. **Environment Configuration:**
   - [ ] Create `.env.example` with all required variables
   - [ ] Document environment setup in README
   - [ ] Add environment validation on startup

### Phase 2: Core Implementation

1. **API Client:**
   - [ ] Implement `lib/api-client.ts` with auth interceptors
   - [ ] Add error mapper for user-friendly messages
   - [ ] Write unit tests for API functions

2. **Query/Mutation Hooks:**
   - [ ] Implement query hooks with proper TypeScript types
   - [ ] Fix optimistic update race conditions
   - [ ] Add tests for each hook

3. **WebSocket Integration:**
   - [ ] Fix memory leak in event handler cleanup
   - [ ] Add query cancellation before cache updates
   - [ ] Test reconnection scenarios

### Phase 3: Testing & Validation

1. **Unit Tests:**
   - [ ] Test all query hooks
   - [ ] Test all mutation hooks
   - [ ] Test WebSocket event handlers
   - [ ] Achieve >80% coverage

2. **Integration Tests:**
   - [ ] Test CRUD flows
   - [ ] Test optimistic updates and rollback
   - [ ] Test WebSocket → cache invalidation

3. **E2E Tests:**
   - [ ] Test complete user workflows
   - [ ] Test error scenarios
   - [ ] Test real-time updates

### Phase 4: Security Hardening

1. **Authentication:**
   - [ ] Implement JWT auth
   - [ ] Add token refresh logic
   - [ ] Test auth flows (login, logout, session expiry)

2. **Input Validation:**
   - [ ] Add DOMPurify for XSS prevention
   - [ ] Validate all user inputs
   - [ ] Sanitize data in query keys

3. **Security Testing:**
   - [ ] Penetration testing
   - [ ] OWASP Top 10 compliance check
   - [ ] Security headers verification

---

## Code Examples for Critical Fixes

### Fix 1: WebSocket Memory Leak

**Current (Problematic):**
```typescript
useEffect(() => {
  const socket = io(WS_URL);

  socket.on('business:created', handler1);
  socket.on('business:updated', handler2);

  return () => {
    socket.disconnect();  // ⚠️ Handlers remain in memory
  };
}, [queryClient]);
```

**Fixed:**
```typescript
useEffect(() => {
  const socket = io(WS_URL);

  const handlers = {
    'business:created': (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['businesses'] });
    },
    'business:updated': (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['businesses', data.data.id] });
    },
  };

  // Register
  Object.entries(handlers).forEach(([event, handler]) => {
    socket.on(event, handler);
  });

  // Cleanup
  return () => {
    Object.entries(handlers).forEach(([event, handler]) => {
      socket.off(event, handler);  // ✅ Remove specific handlers
    });
    socket.disconnect();
  };
}, [queryClient]);
```

### Fix 2: Race Condition in Optimistic Updates

**Current (Problematic):**
```typescript
socket.on('scraping:progress', (data) => {
  queryClient.setQueryData(['scrape-status', data.data.jobId], (old) => ({
    ...old,
    progress: data.data.progress,
  }));
  // ⚠️ Could overwrite concurrent refetch
});
```

**Fixed:**
```typescript
socket.on('scraping:progress', async (data) => {
  // Cancel any in-flight queries
  await queryClient.cancelQueries({
    queryKey: ['scrape-status', data.data.jobId]
  });

  // Safe to update now
  queryClient.setQueryData(['scrape-status', data.data.jobId], (old) => ({
    ...old,
    progress: data.data.progress,
  }));
});
```

### Fix 3: User-Friendly Error Messages

**Current (Problematic):**
```typescript
onError: (error: any) => {
  toast.error(`Failed: ${error.message}`);
  // ⚠️ Exposes backend errors like "ECONNREFUSED" or SQL errors
}
```

**Fixed:**
```typescript
const getUserFriendlyError = (error: unknown): string => {
  if (error instanceof AxiosError) {
    const status = error.response?.status;

    switch (status) {
      case 400: return 'Invalid request. Please check your input.';
      case 401: return 'Authentication required. Please log in.';
      case 403: return 'You do not have permission to perform this action.';
      case 404: return 'Resource not found.';
      case 409: return 'This action conflicts with existing data.';
      case 429: return 'Too many requests. Please try again later.';
      case 500: return 'Server error. Our team has been notified.';
      case 503: return 'Service temporarily unavailable. Please try again.';
      default: return 'An unexpected error occurred. Please try again.';
    }
  }

  if (error instanceof Error) {
    // Only show safe error messages
    const safeMessages = ['Network Error', 'Request timeout'];
    if (safeMessages.includes(error.message)) {
      return error.message;
    }
  }

  return 'An unexpected error occurred.';
};

onError: (error: unknown) => {
  toast.error(getUserFriendlyError(error));

  // Log full error for debugging
  console.error('Mutation error:', error);
}
```

---

## Next Steps

### For Product Manager / Architect:

1. **Review Planning Document:**
   - Approve TanStack Query approach
   - Validate WebSocket event structure
   - Confirm security requirements

2. **Define Authentication Strategy:**
   - JWT vs Session-based?
   - OAuth integration needed?
   - Password policy requirements?

3. **Prioritize Security Fixes:**
   - Must-have: Authentication, CSRF, rate limiting
   - Nice-to-have: Advanced monitoring, 2FA

### For Frontend Developer:

1. **Start with Foundation:**
   - Set up Next.js 16 project
   - Install dependencies from planning doc
   - Configure TypeScript strict mode

2. **Implement Core Features:**
   - Follow planning doc implementation phases
   - Apply all critical fixes from this review
   - Write tests alongside implementation (TDD)

3. **Security Integration:**
   - Implement JWT auth flow
   - Add input sanitization
   - Test auth edge cases

### For QA/Testing:

1. **Prepare Test Environment:**
   - Set up test database
   - Configure mock servers
   - Create test data sets

2. **Write Test Cases:**
   - Unit tests (80% coverage target)
   - Integration tests (critical flows)
   - E2E tests (user journeys)

3. **Security Testing:**
   - OWASP Top 10 checklist
   - Penetration testing
   - Load testing for rate limits

---

## Conclusion

The **planning documentation is excellent (96/100 for documentation quality)**, demonstrating thorough understanding of TanStack Query v5, React best practices, and modern frontend architecture. However, **no actual implementation exists**, so production deployment is not possible.

**Key Strengths:**
- ✅ Comprehensive planning with code examples
- ✅ Proper TypeScript usage
- ✅ Modern React patterns (hooks, no useEffect for data fetching)
- ✅ TanStack Query best practices
- ✅ Well-structured WebSocket integration plan

**Critical Gaps:**
- ❌ No code implementation
- ❌ No authentication system
- ❌ No tests (0% coverage)
- ❌ Security vulnerabilities in planned architecture
- ❌ WebSocket memory leak risks
- ❌ Race conditions in cache updates

**Recommendation:**
**Address critical security and architecture issues BEFORE implementation**, then proceed with phased development following the corrected patterns provided in this review.

---

**Report Generated:** 2025-11-22
**Next Review:** After Phase 1 implementation (foundation + API client)
**Reviewer:** code-reviewer agent (Claude Code)
