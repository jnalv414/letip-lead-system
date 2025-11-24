# TanStack Query v5 Implementation Guide

**Project**: Le Tip Lead System Dashboard
**Architecture**: Three-Layer TanStack Query v5 + Next.js 16 + React 19.2
**Status**: Orchestration Complete, Ready for Agent Execution
**Start Date**: 2025-11-22

---

## Quick Start for Agents

### Before You Begin
1. **Read These Documents** (in order):
   - `/COORDINATION_REPORT.md` - Status & overview
   - `/dashboard/docs/AGENT_COORDINATION_PLAN.md` - Your role & dependencies
   - `/dashboard/docs/TANSTACK_QUERY_PATTERNS.md` - Implementation reference

2. **Understand Your Role**:
   - Agent 1 (fullstack-developer): Build API client layer
   - Agent 2 (fullstack-developer): Implement query/mutation hooks
   - Agent 3 (fullstack-developer): Create WebSocket-Query bridge
   - Agent 4 (fullstack-developer): Setup providers & integration

3. **Know Your Timeline**:
   - Sequential implementation (dependencies must be resolved)
   - Estimated total: 11-16 hours over 2-3 days
   - Daily standup at 9:00 AM for status updates

---

## Architecture Overview

### Three-Layer Design

```
┌─────────────────────────────────────────────────┐
│ Layer 4: Provider Setup & Integration (Agent 4) │
│ ├─ ReactQueryProvider, WebSocketProvider        │
│ └─ app/layout.tsx, error boundaries             │
└─────────────────────────────────────────────────┘
                         ↑
┌─────────────────────────────────────────────────┐
│ Layer 3: WebSocket-Query Bridge (Agent 3)      │
│ ├─ Real-time event handlers                    │
│ ├─ Cache invalidation from events              │
│ └─ Automatic synchronization                   │
└─────────────────────────────────────────────────┘
                         ↑
┌─────────────────────────────────────────────────┐
│ Layer 2: Query/Mutation Hooks (Agent 2)         │
│ ├─ useBusinesses, useBusiness                  │
│ ├─ useScrapeBusinesses, useEnrichBusiness      │
│ └─ Optimistic updates, polling patterns        │
└─────────────────────────────────────────────────┘
                         ↑
┌─────────────────────────────────────────────────┐
│ Layer 1: API Client (Agent 1)                   │
│ ├─ Typed axios client                          │
│ ├─ Request/response interceptors               │
│ └─ Query key factory                           │
└─────────────────────────────────────────────────┘
```

### Data Flow

```
React Component
    ├─ useBusinesses()           → Query hook
    │   ├─ Uses queryKeys.businesses.list()
    │   ├─ Calls apiClient.get()
    │   └─ Returns cached data
    │
    ├─ useScrapeBusinesses()     → Mutation hook
    │   ├─ Calls apiClient.post()
    │   ├─ Invalidates businesses list
    │   └─ Polling via useJobStatus()
    │
    └─ useWebSocketSync()        → Real-time bridge
        └─ Listens for events
            ├─ business:updated  → Updates cache
            ├─ scraping:complete → Invalidates list
            └─ stats:updated     → Refreshes stats
```

---

## Implementation Layers

### Layer 1: API Client (Agent 1)

**Goal**: Build a strongly-typed HTTP client with interceptors

**Deliverables**:
- `lib/api.ts` - Axios client configuration
- `lib/queryKeys.ts` - Typed query key factory
- `types/api.ts` - All endpoint response types
- Request/response interceptors (auth, error handling)

**Key Patterns**:
```typescript
// Query key factory - use everywhere
queryKeys.businesses.list({ city: 'NYC' })
queryKeys.business.detail(123)

// API client with interceptors
apiClient.get('/api/businesses', { signal })
apiClient.post('/api/enrichment/123')
```

**Status**: Ready to implement
**Blocks**: Agent 2 (wait for types & API client)
**References**: `TANSTACK_QUERY_PATTERNS.md` section 9 (API Client Integration)

---

### Layer 2: Query/Mutation Hooks (Agent 2)

**Goal**: Implement all React hooks for data fetching with TanStack Query v5

**Deliverables**:
- Query hooks: useBusinesses, useBusiness, useBusinessContacts, useJobStatus, useStatsQuery
- Mutation hooks: useScrapeBusinesses, useEnrichBusiness, useBatchEnrichment
- Test suite with 80%+ coverage

**Key Patterns**:
```typescript
// Queries
useQuery({
  queryKey: queryKeys.businesses.list(filters),
  queryFn: ({ signal }) => apiClient.get('/api/businesses'),
  staleTime: 30 * 1000,
})

// Mutations with optimistic updates
useMutation({
  mutationFn: (id) => apiClient.post(`/api/enrichment/${id}`),
  onMutate: (id) => {
    // Update cache optimistically
  },
  onError: (err, id, context) => {
    // Rollback on error
  },
  onSettled: () => {
    // Refetch after success/error
  },
})

// Polling pattern
useJobStatus('job-123') // Polls every 2s until complete
```

**Status**: Blocked until Agent 1 completes
**Blocks**: Agent 3 (wait for hook implementation)
**References**: `TANSTACK_QUERY_PATTERNS.md` sections 2-5

---

### Layer 3: WebSocket-Query Bridge (Agent 3)

**Goal**: Connect real-time WebSocket events to TanStack Query cache

**Deliverables**:
- `hooks/useWebSocketSync.ts` - Socket.io setup hook
- `lib/cache/webSocketInvalidation.ts` - Event handlers
- Socket.io client with reconnection logic
- Typed event definitions

**Key Patterns**:
```typescript
// Hook setup in provider
useWebSocketSync()

// Event handlers
socket.on('business:updated', (data) => {
  queryClient.setQueryData(
    queryKeys.business.detail(data.id),
    data
  )
})

// Immutable cache updates
queryClient.setQueryData(key, (old) => ({
  ...old,
  ...updates
}))
```

**Event Mapping**:
- `business:created` → Add to list cache
- `business:updated` → Update detail + list
- `business:deleted` → Remove from caches
- `scraping:progress` → Update progress
- `scraping:complete` → Complete job, refetch list
- `enrichment:complete` → Refetch business detail
- `stats:updated` → Refetch stats

**Status**: Blocked until Agent 2 completes
**Blocks**: Agent 4 (wait for WebSocket hook)
**References**: `TANSTACK_QUERY_PATTERNS.md` sections 6

---

### Layer 4: Provider Setup & Integration (Agent 4)

**Goal**: Compose all three layers and make them available to the app

**Deliverables**:
- `providers/ReactQueryProvider.tsx` - QueryClient setup
- `providers/WebSocketProvider.tsx` - Socket.io wrapper
- `app/layout.tsx` - Provider composition
- Error boundaries and global error handling

**Key Patterns**:
```typescript
// Provider composition (app/layout.tsx)
<ReactQueryProvider>
  <WebSocketProvider>
    <ErrorBoundary>
      {children}
    </ErrorBoundary>
  </WebSocketProvider>
</ReactQueryProvider>

// Default query configs
new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: 3,
    },
  },
})
```

**Status**: Blocked until Agents 2 & 3 complete
**Blocks**: None (final integration)
**References**: `TANSTACK_QUERY_PATTERNS.md` section 7

---

## Core Concepts

### Query Key Convention

**Rule**: `['resource', filters/id]` or `['resource', { key: value }]`

```typescript
// ✓ Correct
['businesses']                              // Root
['businesses', { city: 'NYC', page: 1 }]   // With filters
['business', { id: 123 }]                  // Single
['business', { id: 123 }, 'contacts']      // Nested

// ✗ Incorrect
['BUSINESSES']                  // Wrong case
['get_businesses']              // HTTP method
['businesses/1']                // Slash notation
```

**Factory Pattern** (MUST use this):
```typescript
export const queryKeys = {
  businesses: {
    all: () => ['businesses'] as const,
    list: (filters) => ['businesses', filters] as const,
    detail: (id) => ['business', { id }] as const,
  },
}

// Usage
queryKey: queryKeys.businesses.list({ city: 'NYC' })
```

### Cache Invalidation Strategy

**Decision Tree**:
1. Does mutation return data? → Use `onSuccess` with `setQueryData`
2. Multiple resources affected? → Invalidate prefix `['businesses']`
3. Time-sensitive? → Use `refetchType: 'active'`

**Patterns**:
```typescript
// Pattern 1: Update from mutation response
onSuccess: (data) => {
  queryClient.setQueryData(queryKeys.business.detail(data.id), data)
}

// Pattern 2: Invalidate multiple related
onSettled: () =>
  queryClient.invalidateQueries({ queryKey: ['businesses'] })

// Pattern 3: WebSocket-driven
socket.on('event', (data) => {
  queryClient.setQueryData(key, (old) => updateData(old, data))
})
```

### Optimistic Updates

**Flow**:
1. User performs action
2. `onMutate` cancels refetches, snapshots cache, updates optimistically
3. If mutation fails: `onError` rolls back from snapshot
4. Always refetch: `onSettled` ensures correctness

**Example**:
```typescript
useMutation({
  mutationFn: (id) => enrichBusiness(id),
  onMutate: async (id) => {
    await queryClient.cancelQueries({ queryKey: ['business', { id }] })
    const previous = queryClient.getQueryData(['business', { id }])
    queryClient.setQueryData(['business', { id }], (old) => ({
      ...old,
      enrichment_status: 'enriching',
    }))
    return { previous }
  },
  onError: (err, id, context) => {
    if (context?.previous) {
      queryClient.setQueryData(['business', { id }], context.previous)
    }
  },
  onSettled: () =>
    queryClient.invalidateQueries({ queryKey: ['business', { id }] }),
})
```

---

## Backend API Reference

### Available Endpoints

```
GET    /api/businesses               paginated list with filters
GET    /api/businesses/:id           single business with contacts
GET    /api/businesses/stats         dashboard statistics
POST   /api/scraper/scrape           start scraping
GET    /api/scraper/status/:jobId    poll scrape progress
POST   /api/enrichment/:id           enrich single business
POST   /api/enrichment/batch         batch enrichment
GET    /api/jobs/:id                 generic job status
GET    /api/jobs/failed              list failed jobs
```

### WebSocket Events

```
business:created       { data: Business }
business:updated       { data: Business }
business:deleted       { data: { id: number } }
scraping:progress      { data: { jobId, progress } }
scraping:complete      { data: { jobId, found, saved } }
enrichment:complete    { data: { businessId } }
stats:updated          (trigger dashboard refetch)
```

---

## File Organization

```
dashboard/
├── docs/
│   ├── TANSTACK_QUERY_PATTERNS.md     ← Patterns reference
│   └── AGENT_COORDINATION_PLAN.md     ← Execution plan
│
├── lib/
│   ├── api.ts                         ← Agent 1
│   ├── queryKeys.ts                   ← Agent 1
│   └── cache/
│       └── webSocketInvalidation.ts   ← Agent 3
│
├── types/
│   └── api.ts                         ← Agent 1
│
├── hooks/
│   ├── useBusinesses.ts               ← Agent 2
│   ├── useBusiness.ts                 ← Agent 2
│   ├── useJobStatus.ts                ← Agent 2
│   ├── useScrapeBusinesses.ts         ← Agent 2
│   ├── useEnrichBusiness.ts           ← Agent 2
│   ├── useWebSocketSync.ts            ← Agent 3
│   └── __tests__/
│       └── *.test.ts                  ← Agent 2
│
├── providers/
│   ├── ReactQueryProvider.tsx         ← Agent 4
│   └── WebSocketProvider.tsx          ← Agent 4
│
└── app/
    └── layout.tsx                     ← Agent 4
```

---

## Development Workflow

### Agent 1: API Client
```bash
1. Create lib/api.ts with axios setup
2. Create types/api.ts with all endpoint types
3. Create lib/queryKeys.ts with factory
4. Write interceptors for auth & errors
5. Test with real backend
6. Commit and notify Agent 2
```

### Agent 2: Hooks
```bash
1. Wait for Agent 1 completion
2. Create hooks/queries/ with all query hooks
3. Create hooks/mutations/ with all mutation hooks
4. Implement optimistic updates for critical mutations
5. Write comprehensive tests
6. Test with dashboard UI
7. Commit and notify Agent 3
```

### Agent 3: WebSocket Bridge
```bash
1. Wait for Agent 2 completion
2. Create hooks/useWebSocketSync.ts
3. Create lib/cache/webSocketInvalidation.ts
4. Implement all event handlers
5. Test real-time sync with backend
6. Test race conditions with HTTP
7. Commit and notify Agent 4
```

### Agent 4: Providers
```bash
1. Wait for Agent 3 completion
2. Create providers/ReactQueryProvider.tsx
3. Create providers/WebSocketProvider.tsx
4. Setup app/layout.tsx with provider composition
5. Add error boundaries
6. Integration testing
7. Performance testing
8. Final merge
```

---

## Testing Strategy

### Unit Testing (Each Agent)
- Mock axios/socket.io
- Test individual hooks
- Test cache updates
- Test error handling

### Integration Testing
- Test hook + WebSocket together
- Test HTTP mutation + real-time event
- Test polling with concurrent events

### End-to-End Testing
- Real backend server
- Real WebSocket events
- Full user workflows
- Performance benchmarks

---

## Quality Gates

Before merging, verify:
- [ ] No TypeScript errors
- [ ] 80%+ test coverage
- [ ] All patterns from docs followed
- [ ] No console warnings/errors
- [ ] Performance acceptable (< 100ms queries)
- [ ] Peer code review approved

---

## Common Issues & Solutions

### Issue: Query key mismatch breaks invalidation
**Solution**: Use the factory pattern everywhere

### Issue: WebSocket updates don't trigger re-renders
**Solution**: Always use immutable updates (spread, map, filter)

### Issue: Race condition between HTTP and WebSocket
**Solution**: Check cache timestamp before updating

### Issue: Memory leak from WebSocket listeners
**Solution**: Cleanup listeners in provider unmount

### Issue: Optimistic update rollback is slow
**Solution**: Snapshot entire object in onMutate

---

## Performance Tips

1. **Use `staleTime`** to avoid unnecessary refetches
2. **Use `gcTime`** to keep data available on fast navigation
3. **Prefer `setQueryData`** over `invalidateQueries` when possible
4. **Enable `refetchInBackground`** for real-time data
5. **Use `enabled`** for dependent queries
6. **Prefetch on hover** to anticipate navigation
7. **Batch mutations** for multiple updates

---

## Escalation Path

| Issue | Owner | Escalate To |
|-------|-------|------------|
| TypeScript error | Current agent | Orchestrator |
| Query key conflict | Current agent | Orchestrator |
| Cache logic question | Current agent | Review patterns doc |
| Blocking dependency | Any agent | Orchestrator |
| Performance issue | Any agent | Orchestrator |

---

## Success Checklist

### Implementation Complete When:
- [ ] All types exported and used correctly
- [ ] All hooks implemented and tested
- [ ] WebSocket events sync to cache
- [ ] Providers compose without errors
- [ ] Dashboard displays data correctly
- [ ] Real-time updates visible on screen
- [ ] Optimistic updates feel instant
- [ ] Error handling is comprehensive
- [ ] Performance benchmarks met
- [ ] Full test coverage achieved

---

## Documentation

**Patterns Reference**: `/dashboard/docs/TANSTACK_QUERY_PATTERNS.md`
- 700+ lines
- All patterns needed for implementation
- Code examples for each pattern
- Common pitfalls and solutions

**Coordination Plan**: `/dashboard/docs/AGENT_COORDINATION_PLAN.md`
- Role assignments
- Dependency graph
- Risk mitigation
- Timeline

**Coordination Report**: `/COORDINATION_REPORT.md`
- Status overview
- Context summary
- Integration points
- Quality checklist

---

## Questions?

1. **Patterns question?** → Review `/dashboard/docs/TANSTACK_QUERY_PATTERNS.md`
2. **Timeline question?** → Check `/dashboard/docs/AGENT_COORDINATION_PLAN.md`
3. **Blocking issue?** → Contact Orchestrator (Context Manager Agent)

---

## Getting Started

### Right Now
1. Read this document
2. Read `/dashboard/docs/AGENT_COORDINATION_PLAN.md` for your role
3. Read `/dashboard/docs/TANSTACK_QUERY_PATTERNS.md` for patterns

### Tomorrow (Agent 1)
1. Create lib/api.ts with axios setup
2. Create types/api.ts with all endpoint types
3. Create lib/queryKeys.ts

### Day 2+ (Other agents)
1. Wait for previous layer completion
2. Implement your deliverables
3. Test thoroughly
4. Notify next agent

---

**Created**: 2025-11-22
**Status**: READY FOR EXECUTION
**Maintained By**: Context Manager Agent
