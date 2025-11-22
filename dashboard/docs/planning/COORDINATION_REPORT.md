# TanStack Query v5 Implementation - Coordination Report

**Orchestrator**: Context Manager Agent
**Report Date**: 2025-11-22
**Status**: COORDINATION COMPLETE - READY FOR AGENT EXECUTION

---

## Executive Summary

The Context Manager has successfully orchestrated and documented a comprehensive three-layer TanStack Query v5 implementation strategy for the Le Tip Lead System dashboard. All critical resources are in place, dependencies are clearly mapped, and agents are ready to begin implementation.

### Key Deliverables Created

1. **Shared Patterns Documentation** (61 KB, 700+ lines)
   - Comprehensive TanStack Query v5 reference guide
   - All patterns extracted from context7 latest docs
   - Specific to Le Tip Lead System architecture
   - Ready for agent reference during implementation

2. **Agent Coordination Plan** (15 KB, 400+ lines)
   - Clear role assignments for 4 specialized agents
   - Explicit dependency graph and handoff points
   - Risk mitigation strategies
   - Success criteria for each layer and globally

3. **Coordination Report** (This document)
   - Status tracking and validation summary
   - Context index for agent reference
   - Integration points analysis
   - Quality assurance checklist

---

## Context Gathering Summary

### Documentation Sources Retrieved

| Source | Content | Snippets | Quality |
|--------|---------|----------|---------|
| /tanstack/query | Query/mutation patterns, cache management | 1100+ | High |
| /vercel/next.js | App Router, providers, SSR patterns | 3300+ | High |
| /facebook/react | Error boundaries, hooks, Suspense | 3100+ | High |

**Total Context Gathered**: 7,500+ code snippets + comprehensive documentation

### Key Patterns Documented

**TanStack Query v5**:
- Query hook configuration with v5 API (staleTime, gcTime, enabled)
- Optimistic update patterns with rollback
- Cache invalidation decision tree
- Polling patterns for long-running jobs
- Dependent queries with proper `enabled` flag
- Background refetch with isFetching states

**Next.js App Router**:
- Client components with 'use client' directive
- Server components and provider composition
- Data passing from server to client
- Error boundaries and error.tsx pattern
- Layout and page routing

**React 19.2**:
- Hook composition and custom hooks
- Error boundary implementation
- Suspense boundaries for async operations
- Immutable state updates

**WebSocket Integration**:
- Real-time event handling patterns
- Cache synchronization strategies
- Race condition prevention
- Reconnection with exponential backoff

---

## Implementation Architecture

### Layer 1: API Client (Agent 1)
**Status**: Specification Complete

**Deliverables**:
```typescript
lib/
├── api.ts                          // Axios client + interceptors
├── queryKeys.ts                    // Typed query key factory
└── interceptors/
    ├── auth.ts                     // Auth token management
    ├── error.ts                    // Error mapping & retry
    └── request.ts                  // Request logging

types/
└── api.ts                          // All endpoint interfaces
```

**Key Design Decisions**:
- Axios instead of fetch for interceptor support
- Typed query key factory using `as const`
- Request signal support for TanStack Query abort
- Separate error mapping for query/mutation errors

**Dependencies**: None
**Estimated Implementation**: 2-4 hours

---

### Layer 2: Query/Mutation Hooks (Agent 2)
**Status**: Specification Complete

**Deliverables**:
```typescript
hooks/
├── queries/
│   ├── useBusinesses.ts            // List with filters/pagination
│   ├── useBusiness.ts              // Single detail
│   ├── useBusinessContacts.ts      // Dependent query
│   ├── useJobStatus.ts             // Polling pattern
│   └── useStatsQuery.ts            // Dashboard stats
├── mutations/
│   ├── useScrapeBusinesses.ts      // With invalidation
│   ├── useEnrichBusiness.ts        // With optimistic updates
│   └── useBatchEnrichment.ts       // Batch with progress
└── __tests__/
    └── *.test.ts                   // Complete test suite
```

**Key Design Decisions**:
- Separate folders for queries vs mutations
- Query key factory as parameter
- Optimistic updates for enrichment (UX critical)
- Polling with dynamic refetchInterval based on status
- `enabled` field for dependent queries

**Dependencies**: Layer 1 (API client + types)
**Estimated Implementation**: 4-6 hours
**Blocks**: Layer 3 (needs hooks for cache access)

---

### Layer 3: WebSocket-Query Bridge (Agent 3)
**Status**: Specification Complete

**Deliverables**:
```typescript
hooks/
└── useWebSocketSync.ts             // Socket.io setup hook

lib/cache/
├── webSocketInvalidation.ts        // Event handlers
├── events.ts                       // Typed event definitions
└── eventHandlers/
    ├── business.ts                 // CRUD events
    ├── scraping.ts                 // Scrape progress/complete
    ├── enrichment.ts               // Enrichment events
    └── stats.ts                    // Stats events
```

**Key Design Decisions**:
- Centralized event handler file for maintainability
- Immutable cache updates (spread/map/filter)
- Cache existence checks before updates
- Typed Socket.io events
- Automatic reconnection with backoff

**Event Mapping**:
| Event | Action | Cache Operation |
|-------|--------|-----------------|
| business:created | New business available | Add to list cache |
| business:updated | Business data changed | Update detail + list cache |
| business:deleted | Business removed | Remove from all caches |
| scraping:progress | Progress update | setQueryData with progress |
| scraping:complete | Job finished | Complete job, invalidate list |
| enrichment:complete | Enrichment done | Invalidate business detail |
| stats:updated | Stats changed | Invalidate stats query |

**Dependencies**: Layer 2 (hooks) + Layer 1 (types)
**Estimated Implementation**: 2-3 hours
**Blocks**: Layer 4 (provides integration hook)

---

### Layer 4: Provider Setup & Integration (Agent 4)
**Status**: Specification Complete

**Deliverables**:
```typescript
providers/
├── ReactQueryProvider.tsx          // QueryClient setup
├── WebSocketProvider.tsx           // Socket.io wrapper
└── ErrorBoundary.tsx               // Global error handling

app/
├── layout.tsx                      // Provider composition
├── error.tsx                       // Error boundary
└── loading.tsx                     // Loading states

config/
└── queryClient.ts                  // Shared QueryClient config
```

**Key Design Decisions**:
- QueryClient created once per app instance
- WebSocketProvider depends on ReactQueryProvider
- Error boundary wraps entire app
- Environment-based API/WebSocket URLs
- Default query/mutation configs at provider level

**Provider Stack**:
```tsx
<html>
  <body>
    <ReactQueryProvider>
      <WebSocketProvider>
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </WebSocketProvider>
    </ReactQueryProvider>
  </body>
</html>
```

**Dependencies**: Layer 2 + Layer 3 (needs all hooks)
**Estimated Implementation**: 2-3 hours

---

## Dependency Validation

### Critical Path
```
Agent 1: API Client
    ↓ (3-4 hours)
Agent 2: Hooks
    ↓ (4-6 hours)
Agent 3: WebSocket Bridge
    ↓ (2-3 hours)
Agent 4: Providers
    ↓ (2-3 hours)
Total: 11-16 hours (spread across 2-3 days)
```

### No Parallel Dependencies
All layers have strict dependencies - must be implemented sequentially.

### Parallel Testing
Each agent can write tests during implementation without blocking others.

---

## Query Key Convention Validation

**Convention**: `['resource', filters/id]` or `['resource', { id/key }]`

**Validated Examples**:
```typescript
// ✓ Correct patterns
['businesses'] // Root
['businesses', { city: 'NYC', page: 1 }] // With filters
['business', { id: 123 }] // Single resource
['business', { id: 123 }, 'contacts'] // Nested
['business-stats'] // Aggregated

// ✗ Avoid these patterns
['BUSINESSES'] // Wrong case
['get_businesses'] // HTTP method included
['businesses/1'] // Slash notation
['business-1'] // Ambiguous format
```

**Factory Pattern** (from `TANSTACK_QUERY_PATTERNS.md`):
```typescript
export const queryKeys = {
  businesses: {
    all: () => ['businesses'],
    list: (filters) => ['businesses', filters],
    detail: (id) => ['business', { id }],
  },
}
```

**Validation**: All agents must use factory for consistency.

---

## Cache Invalidation Strategy

### Decision Tree Implemented

```
Query Result Changes
├─ Use mutation response directly?
│  ├─ Yes → onSuccess with setQueryData
│  └─ No → onSettled with invalidateQueries
├─ Multiple resources affected?
│  ├─ Yes → invalidate prefix (e.g., ['businesses'])
│  └─ No → invalidate exact key
└─ Time-sensitive (real-time)?
   ├─ Yes → refetchType: 'active'
   └─ No → default behavior
```

**Implemented Patterns**:

1. **Optimistic Update** (e.g., enrich business):
   ```typescript
   onMutate: snapshot + optimistic update
   onError: rollback from snapshot
   onSettled: invalidate for correctness
   ```

2. **Response Update** (e.g., create business):
   ```typescript
   onSuccess: setQueryData with response
   ```

3. **List Invalidation** (e.g., scrape completion):
   ```typescript
   onSettled: invalidateQueries(['businesses'])
   ```

4. **WebSocket-Driven** (real-time events):
   ```typescript
   on('event'): setQueryData or invalidateQueries
   ```

---

## WebSocket-Query Sync Validation

### Event-to-Cache Mapping

| Server Event | Cache Update | Trigger |
|--------------|--------------|---------|
| business:created | Add to list | Setdata (prepend) |
| business:updated | Update detail + list | setQueryData (merge) |
| business:deleted | Remove from all | setQueryData (filter) |
| scraping:progress | Update job progress | setQueryData (partial) |
| scraping:complete | Complete job + refetch | setQueryData + invalidate |
| enrichment:complete | Invalidate detail | invalidateQueries |
| stats:updated | Invalidate stats | invalidateQueries |

### Race Condition Prevention

**Scenario 1**: HTTP mutation in progress, WebSocket event arrives
```typescript
// Cancel ongoing refetch before optimistic update
await queryClient.cancelQueries({ queryKey })
// Update cache
queryClient.setQueryData(key, data)
// WebSocket event won't override optimistic state
```

**Scenario 2**: WebSocket event arrives, HTTP refetch completes
```typescript
// Refetch will always be latest from server
// WebSocket might be older, but refetch is authoritative
```

**Solution**: Cache check before update
```typescript
socket.on('event', (data) => {
  const existing = queryClient.getQueryData(key)
  // Only update if new data is fresher
  if (!existing || data.timestamp > existing.timestamp) {
    queryClient.setQueryData(key, data)
  }
})
```

---

## Integration Points

### Provider Composition
```typescript
// app/layout.tsx
<ReactQueryProvider>           // Must be outermost
  <WebSocketProvider>          // Depends on Query Provider
    <ErrorBoundary>            // Global error handling
      {children}
    </ErrorBoundary>
  </WebSocketProvider>
</ReactQueryProvider>
```

### Hook Access
```typescript
// Inside client component
const queryClient = useQueryClient()  // From React Query Provider
const { data } = useBusinesses()      // From hooks layer
useWebSocketSync()                    // Setup real-time

// Automatic cache sync via WebSocket
// No manual coordination needed
```

### Error Handling Flow
```
API Error
  ↓
Axios Interceptor (401, 5xx handling)
  ↓
Query/Mutation Error
  ↓
Component Error Boundary
  ↓
Global Error Boundary (app/error.tsx)
```

---

## Testing Strategy

### Unit Tests (Layer 1-2)
```typescript
// Test each hook independently
- useBusinesses with various filters
- useBusiness with different IDs
- useJobStatus polling behavior
- Optimistic update + rollback
```

**Mock Strategy**: Mock axios responses
**Tools**: Vitest + @testing-library/react

### Integration Tests (Layer 2-3)
```typescript
// Test hook + WebSocket interaction
- WebSocket event triggers cache update
- HTTP mutation doesn't conflict with event
- Polling continues during WebSocket events
```

**Mock Strategy**: Mock both axios and socket.io
**Tools**: MSW (Mock Service Worker) + Socket.io server mock

### E2E Tests (All Layers)
```typescript
// Full flow with real backend
- Create business via API
- See it appear in list via WebSocket
- Enrich it optimistically
- See enrichment complete via WebSocket
- Real-time stats update
```

**Tools**: Playwright + real backend server

---

## Performance Considerations

### Query Configuration
```typescript
// Businesses list: Changes frequently
staleTime: 30s        // Quick updates
gcTime: 10m           // Keep in memory

// Single business: Stable reference
staleTime: 60s
gcTime: 30m

// Job status: Time-sensitive
staleTime: 0          // Always refetch on access
refetchInterval: 2s   // Poll actively
```

### WebSocket Optimization
```typescript
// Batch updates when possible
socket.on('businesses:bulk-update', (data) => {
  queryClient.setQueriesData(
    { queryKey: ['businesses'] },
    (old) => updateList(old, data)
  )
})

// Prefetch upcoming data
useEffect(() => {
  queryClient.prefetchQuery({
    queryKey: ['business', nextId],
    queryFn: () => getBusinessDetail(nextId),
  })
}, [currentId])
```

### Cache Size Management
```typescript
// Garbage collection
gcTime: 10 * 60 * 1000  // 10 minutes

// Manual cleanup for sensitive data
onUnmount: () => queryClient.removeQueries({
  queryKey: ['business']
})
```

---

## Quality Assurance Checklist

### TypeScript
- [ ] No `any` types used
- [ ] All API responses typed
- [ ] Query keys are `as const`
- [ ] Strict mode enabled
- [ ] No implicit any errors

### TanStack Query
- [ ] All hooks use v5 API (not v4)
- [ ] Proper `enabled` for dependent queries
- [ ] Stale time is reasonable per endpoint
- [ ] GC time prevents premature cleanup
- [ ] Error handling is comprehensive

### WebSocket
- [ ] No memory leaks from listeners
- [ ] Reconnection doesn't duplicate events
- [ ] Cache updates are immutable
- [ ] No race conditions with HTTP

### Performance
- [ ] Initial load < 100ms
- [ ] Re-renders optimized
- [ ] WebSocket doesn't block UI
- [ ] Large lists virtualized

### Testing
- [ ] 80%+ code coverage
- [ ] All hooks tested
- [ ] Error paths tested
- [ ] WebSocket events mocked correctly

### Documentation
- [ ] Code commented where needed
- [ ] JSDoc for all exports
- [ ] README for setup
- [ ] Examples for common patterns

---

## Risk Assessment & Mitigation

### High Risk: Query Key Inconsistency
- **Impact**: Cache invalidation failures, stale data
- **Probability**: Medium (centralized factory helps)
- **Mitigation**:
  - Code review on all query key usage
  - Orchestrator validates before merge
  - Tests for query key consistency

### High Risk: WebSocket Race Conditions
- **Impact**: Data inconsistency between cache and UI
- **Probability**: Medium (complex interaction)
- **Mitigation**:
  - Timestamp checks before cache updates
  - Strict isolation tests
  - Comprehensive E2E tests

### Medium Risk: Type Mismatch
- **Impact**: Runtime errors, type confusion
- **Probability**: Low (TypeScript helps)
- **Mitigation**:
  - Strict TypeScript config
  - API type generation from backend
  - Runtime validation in interceptors

### Medium Risk: Performance Regression
- **Impact**: Dashboard latency issues
- **Probability**: Low (patterns are optimized)
- **Mitigation**:
  - Monitor query times
  - React Query DevTools
  - Profile with realistic data

### Low Risk: WebSocket Disconnection
- **Impact**: Stale data until reconnect
- **Probability**: Low (auto-reconnect enabled)
- **Mitigation**:
  - Exponential backoff
  - Fallback to HTTP polling
  - Visual connection indicator

---

## Success Metrics

### Implementation Metrics
- All 4 agents complete on schedule
- Zero blocking dependencies
- < 2 iterations before merge
- 80%+ test coverage achieved

### Quality Metrics
- Zero TypeScript errors
- All TanStack Query v5 patterns followed
- No console errors in browser
- All tests pass

### Performance Metrics
- Dashboard initial load: < 100ms
- Query response time: < 50ms
- WebSocket event latency: < 100ms
- Memory usage: < 50MB for 1000 businesses

### User Experience Metrics
- Real-time updates visible
- Optimistic updates feel instant
- Error messages clear
- No UI flickers

---

## Next Steps

### Immediate Actions
1. **Share Documentation**: Send patterns and plan to all agents
2. **Kickoff Meeting**: Brief agents on their roles
3. **Establish Communication**: Daily standup schedule

### Agent 1 Starts
```
Goal: Complete API client layer
Timeline: Today (3-4 hours)
Output:
  - lib/api.ts
  - lib/queryKeys.ts
  - types/api.ts
  - Tested with real backend
```

### Dependencies Unblock
```
Agent 2: Needs lib/api.ts and types/api.ts from Agent 1
Agent 3: Needs hooks from Agent 2
Agent 4: Needs hooks and WebSocket from Agents 2 & 3
```

---

## Communication Channels

### Daily Standup (9:00 AM)
Quick status update on:
- Completed tasks
- Current blockers
- Help needed

### Async Communication
- Questions in context of this document
- Escalate to Orchestrator for conflicts
- Code review before merge

### Blocking Issues
- Escalate immediately
- Orchestrator mediates
- Document resolution

---

## Appendices

### A. Backend API Reference
**Available at**: `AGENT_COORDINATION_PLAN.md` (Backend Context section)

### B. TanStack Query v5 Patterns
**Location**: `/dashboard/docs/TANSTACK_QUERY_PATTERNS.md`

**Sections**:
1. Query Key Conventions
2. Query Hook Patterns
3. Mutation Hook Patterns
4. Optimistic Update Patterns
5. Cache Invalidation Strategy
6. WebSocket-Query Bridge
7. Provider Setup
8. Error Handling
9. API Client Integration
10. Testing Patterns

### C. File Structure
**Detailed layout in**: `AGENT_COORDINATION_PLAN.md` (File Structure section)

### D. Implementation Checklist
**Per-layer checklist**: Review `AGENT_COORDINATION_PLAN.md` for:
- Agent 1 (API Client) checklist
- Agent 2 (Hooks) checklist
- Agent 3 (WebSocket) checklist
- Agent 4 (Providers) checklist

---

## Document History

| Version | Date | Status | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-11-22 | DRAFT | Initial coordination report |
| 1.0 | 2025-11-22 | FINAL | Context gathering complete, ready for execution |

---

## Sign-Off

**Prepared By**: Context Manager Agent
**Orchestration Status**: COMPLETE
**Agent Readiness**: READY
**Execution Status**: APPROVED

**Key Documents**:
1. `/dashboard/docs/TANSTACK_QUERY_PATTERNS.md` - Shared reference
2. `/dashboard/docs/AGENT_COORDINATION_PLAN.md` - Execution plan
3. `/COORDINATION_REPORT.md` - This report

**All agents should review both coordination documents before starting implementation.**

---

**Last Updated**: 2025-11-22
**Next Review**: Upon agent completion of each layer
**Maintainer**: Context Manager Agent
