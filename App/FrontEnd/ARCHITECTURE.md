# Frontend Architecture - Vertical Slice Architecture

## Overview

The LeTip Lead System frontend is built with **vertical slice architecture** from day one. This architecture organizes code by feature rather than technical layer, promoting feature isolation, independent development, and easier maintenance.

## Core Principles

1. **Feature Independence** - Each feature is self-contained with its own API client, hooks, types, and components
2. **Co-location** - Related code lives together (hooks next to components that use them)
3. **Explicit Dependencies** - Features expose public APIs via barrel exports (`index.ts`)
4. **Shared Infrastructure** - Common utilities, UI components, and core services are centralized
5. **Minimal Cross-Feature Coupling** - Features communicate through well-defined interfaces

## Directory Structure

```
App/FrontEnd/
├── features/                    # Feature-based vertical slices
│   ├── business-management/     # Business CRUD operations
│   │   ├── components/          # Feature-specific components
│   │   ├── hooks/               # Custom hooks (useBusinesses, etc.)
│   │   ├── api/                 # API client for this feature
│   │   ├── types/               # TypeScript types for this feature
│   │   └── index.ts             # Public API (barrel export)
│   │
│   ├── map-scraping/            # Google Maps scraping feature
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── api/
│   │   ├── types/
│   │   └── index.ts
│   │
│   ├── lead-enrichment/         # Contact enrichment feature
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── api/
│   │   ├── types/
│   │   └── index.ts
│   │
│   └── dashboard-analytics/     # Dashboard stats feature
│       ├── components/
│       ├── hooks/
│       ├── api/
│       ├── types/
│       └── index.ts
│
├── shared/                      # Shared UI and utilities
│   ├── ui/                      # ShadCN components (Button, Card, etc.)
│   ├── charts/                  # Recharts configurations
│   └── utils/                   # Helper functions
│
├── core/                        # Core infrastructure
│   ├── api/                     # Base API client
│   ├── providers/               # React providers (WebSocket, Query)
│   └── types/                   # Global type definitions
│
├── app/                         # Next.js App Router
│   ├── layout.tsx               # Root layout
│   └── (dashboard)/             # Dashboard routes
│
├── hooks/                       # Global hooks (legacy, migrate to features)
├── lib/                         # Global utilities (legacy, migrate to core)
└── types/                       # Global types (legacy, migrate to core)
```

## Feature Structure

Each feature follows this pattern:

### 1. API Layer (`api/`)
Feature-specific API client built on top of core API client.

```typescript
// features/business-management/api/business-api.ts
import { apiClient } from '@/core/api/api-client';

export const businessApi = {
  async getBusinesses(params) { /* ... */ },
  async getBusiness(id) { /* ... */ },
};
```

### 2. Types (`types/`)
TypeScript interfaces specific to the feature.

```typescript
// features/business-management/types/business.types.ts
export interface BusinessFilters {
  city?: string;
  industry?: string;
  enrichmentStatus?: 'pending' | 'enriched' | 'failed';
}
```

### 3. Hooks (`hooks/`)
Custom React hooks for data fetching and state management.

```typescript
// features/business-management/hooks/use-businesses.ts
export function useBusinesses(params) {
  return useQuery({
    queryKey: businessKeys.list(params),
    queryFn: () => businessApi.getBusinesses(params),
  });
}
```

### 4. Components (`components/`)
React components specific to the feature.

```typescript
// features/business-management/components/business-list.tsx
export function BusinessList() {
  const { data } = useBusinesses();
  const { isConnected } = useBusinessWebSocket();
  // ...
}
```

### 5. Barrel Export (`index.ts`)
Public API of the feature - only exports what other features need.

```typescript
// features/business-management/index.ts
export { BusinessList } from './components/business-list';
export { useBusinesses, useCreateBusiness } from './hooks/use-businesses';
export type { Business, BusinessFilters } from './types/business.types';
```

## Core Infrastructure

### API Client (`core/api/`)
Base Axios instance with interceptors for all features.

```typescript
// core/api/api-client.ts
export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 30000,
});
```

### Providers (`core/providers/`)
React Context providers for global state.

- **AppProviders** - Combines all providers (React Query, WebSocket)
- **WebSocketProvider** - Socket.io client for real-time updates

### Types (`core/types/`)
Re-exports from `/types/api.ts` plus global utility types.

## Data Flow

### 1. REST API Calls
```
Component → Hook (useBusinesses) → API Client (businessApi) → Backend
```

### 2. WebSocket Real-time Updates
```
Backend Event → WebSocket Provider → Feature Hook (useBusinessWebSocket) → React Query Cache → Component Re-render
```

### 3. Mutations
```
Component → Mutation Hook (useCreateBusiness) → API Client → Backend → Cache Invalidation → Refetch
```

## Feature Communication

Features should **not** import directly from each other. Instead:

1. **Shared Types** - Use `core/types/global.types.ts`
2. **Shared Components** - Use `shared/ui/`
3. **Cross-Feature Actions** - Use WebSocket events or React Query cache

Example (CORRECT):
```typescript
// features/lead-enrichment/hooks/use-enrichment.ts
import { businessKeys } from '@/features/business-management'; // Import from barrel export

queryClient.invalidateQueries({ queryKey: businessKeys.lists() });
```

Example (WRONG):
```typescript
// ❌ Don't import internal implementation details
import { businessApi } from '@/features/business-management/api/business-api';
```

## State Management Strategy

### React Query (Primary)
- Server state (API data) managed by React Query
- Automatic caching, refetching, and background updates
- Feature-specific query keys for isolation

### WebSocket Integration
- Real-time events update React Query cache
- No separate WebSocket state - cache is source of truth
- Events trigger cache invalidation or optimistic updates

### Local Component State
- Form state: React Hook Form
- UI state: `useState` in components
- No global UI state management (no Redux/Zustand needed)

## Best Practices

### 1. Keep Features Independent
- Features should work in isolation
- Minimize cross-feature dependencies
- Use barrel exports to control public API

### 2. Co-locate Related Code
```
✅ GOOD:
features/business-management/
  hooks/use-businesses.ts
  components/business-list.tsx  (uses hook above)

❌ BAD:
hooks/use-businesses.ts
components/business/business-list.tsx  (far from hook)
```

### 3. Use TypeScript Strictly
- All API responses typed
- No `any` types
- Shared types in `core/types/`

### 4. Feature Naming Convention
- Folders: `kebab-case` (e.g., `business-management`)
- Files: `kebab-case` (e.g., `business-list.tsx`)
- Components: `PascalCase` (e.g., `BusinessList`)
- Hooks: `camelCase` with `use` prefix (e.g., `useBusinesses`)

### 5. WebSocket Pattern
Each feature with real-time needs has two hooks:
- Data fetching hook: `useBusinesses()`
- WebSocket hook: `useBusinessWebSocket()`

```typescript
function MyComponent() {
  const { data } = useBusinesses();        // Fetch initial data
  const { isConnected } = useBusinessWebSocket(); // Subscribe to updates
  // Component automatically re-renders when WebSocket updates cache
}
```

## Testing Strategy

### Unit Tests
Test hooks and utilities in isolation:
```typescript
// features/business-management/hooks/__tests__/use-businesses.test.ts
it('fetches businesses with filters', async () => {
  const { result } = renderHook(() => useBusinesses({ city: 'Freehold' }));
  await waitFor(() => expect(result.current.isSuccess).toBe(true));
});
```

### Integration Tests
Test components with mocked API:
```typescript
// features/business-management/components/__tests__/business-list.test.tsx
it('displays businesses from API', async () => {
  render(<BusinessList />);
  await screen.findByText('ABC Plumbing');
});
```

### E2E Tests
Test full user flows across features (Playwright/Cypress).

## Migration Strategy

The codebase has legacy code in `/hooks`, `/lib`, and `/types`. Migration plan:

1. **New features** → Always use vertical slice architecture
2. **Existing code** → Refactor incrementally as features are touched
3. **Shared utilities** → Move to `/core` or `/shared` as needed

## Performance Considerations

1. **Code Splitting** - Features loaded on-demand via dynamic imports
2. **React Query Caching** - Reduces redundant API calls
3. **WebSocket Efficiency** - Single connection for all features
4. **Component Optimization** - Use `React.memo` for expensive components

## Future Enhancements

- **Feature flags** - Enable/disable features via environment variables
- **Feature analytics** - Track feature usage and performance
- **Feature documentation** - Auto-generate docs from TypeScript types
- **Micro-frontends** - Potentially extract features into separate bundles

## Resources

- [Next.js 16 Documentation](https://nextjs.org/docs)
- [React Query Documentation](https://tanstack.com/query/latest)
- [Vertical Slice Architecture](https://www.jimmybogard.com/vertical-slice-architecture/)
- [Feature-Sliced Design](https://feature-sliced.design/)

## Questions?

For architecture questions or feature proposals, refer to:
- `/Volumes/HOME-EX/Users/justinnalven/.claude/projects/letip-lead-systen/letip-lead-system/App/FrontEnd/CLAUDE.md`
- `/Volumes/HOME-EX/Users/justinnalven/.claude/projects/letip-lead-systen/letip-lead-system/docs/orchestration/FINAL_HANDOFF.md`
