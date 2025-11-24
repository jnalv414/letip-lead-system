# Agent Coordination Plan: TanStack Query v5 Implementation

**Orchestrator**: Context Manager Agent
**Start Date**: 2025-11-22
**Target Completion**: 2025-11-24
**Status**: INITIALIZATION

---

## Mission Overview

Coordinate 4 specialized agents implementing a three-layer TanStack Query v5 architecture for the Le Tip Lead System dashboard:

```
Layer 1: API Client (typed, intercepted)
    ↓
Layer 2: Query/Mutation Hooks (cached, optimistic)
    ↓
Layer 3: WebSocket-Query Bridge (real-time sync)
    ↓
Provider Setup & Integration
```

---

## Agent Assignments

### Agent 1: API Client Layer
**Role**: `fullstack-developer`
**Responsibility**: Build typed HTTP client with interceptors
**Deliverables**:
- `lib/api.ts` - Axios client with auth/error handling
- `types/api.ts` - Complete TypeScript interfaces for all 15+ endpoints
- `lib/queryKeys.ts` - Strongly typed query key factory
- Request/response interceptors
- Error mapping and retry logic

**Dependency**: None (Layer 1 foundation)
**Blocks**: Agent 2 (requires types)
**Definition of Done**:
- [ ] All endpoints typed and tested
- [ ] Interceptors working correctly
- [ ] Error handling comprehensive
- [ ] Query keys validated with tests

---

### Agent 2: Query/Mutation Hooks
**Role**: `fullstack-developer` (different instance)
**Responsibility**: Implement all React hooks for data fetching
**Deliverables**:
- `hooks/useBusinesses.ts` - List query with filters/pagination
- `hooks/useBusiness.ts` - Single business detail
- `hooks/useBusinessContacts.ts` - Dependent query pattern
- `hooks/useJobStatus.ts` - Polling pattern for long-running jobs
- `hooks/useScrapeBusinesses.ts` - Mutation with invalidation
- `hooks/useEnrichBusiness.ts` - Mutation with optimistic updates
- `hooks/useBatchEnrichment.ts` - Batch mutation pattern
- `hooks/useStatsQuery.ts` - Dashboard statistics
- Test coverage for all hooks

**Dependency**: Agent 1 (needs API client & types)
**Blocks**: Agent 3 (needs hooks for WebSocket bridge)
**Definition of Done**:
- [ ] All hooks follow TanStack Query v5 patterns
- [ ] Optimistic updates implemented correctly
- [ ] Polling logic working for job status
- [ ] 80% test coverage minimum
- [ ] Documented with JSDoc comments

---

### Agent 3: WebSocket-Query Bridge
**Role**: `fullstack-developer` (different instance)
**Responsibility**: Real-time sync between WebSocket events and query cache
**Deliverables**:
- `hooks/useWebSocketSync.ts` - Socket.io hook setup
- `lib/cache/webSocketInvalidation.ts` - Event handlers
- Event mapping for all server events:
  - `business:created` → add to list cache
  - `business:updated` → update detail & list cache
  - `business:deleted` → remove from cache
  - `scraping:progress` → update job progress
  - `scraping:complete` → complete job, invalidate list
  - `enrichment:complete` → refresh business detail
  - `stats:updated` → invalidate stats query
- Socket.io client with reconnection logic
- Type-safe event definitions

**Dependency**: Agent 2 (needs hooks, Agent 1 types)
**Blocks**: Agent 4 (provides hook for provider)
**Definition of Done**:
- [ ] All server events handled correctly
- [ ] Cache updates are immutable
- [ ] Reconnection logic tested
- [ ] No race conditions with HTTP requests
- [ ] Real-time tests with mock socket server

---

### Agent 4: Provider Setup & Integration
**Role**: `fullstack-developer` (different instance)
**Responsibility**: Configure providers and integrate all layers
**Deliverables**:
- `providers/ReactQueryProvider.tsx` - QueryClient setup
- `providers/WebSocketProvider.tsx` - Socket.io initialization
- `app/layout.tsx` - Provider composition
- Error boundaries for query errors
- Loading state indicators
- Global error handling
- Environment configuration (API URL, WebSocket URL)

**Dependency**: Agent 2 & 3 (needs hooks & WebSocket)
**Blocks**: None (final integration)
**Definition of Done**:
- [ ] All providers working together
- [ ] Error boundaries catching errors
- [ ] Environment variables configured
- [ ] Hot reload working properly
- [ ] Manual testing on dashboard

---

## Shared Resources

### Patterns Documentation
**Location**: `/dashboard/docs/TANSTACK_QUERY_PATTERNS.md`

This master document contains:
- Query key conventions (all agents must follow)
- Query hook patterns (Agent 2 reference)
- Mutation hook patterns (Agent 2 reference)
- Optimistic update patterns (Agent 2 reference)
- Cache invalidation strategy (Agent 2 & 3 reference)
- WebSocket-Query bridge architecture (Agent 3 reference)
- Provider setup guide (Agent 4 reference)
- Error handling patterns (all agents)
- API client integration (Agent 1 reference)
- Testing patterns (all agents)

**Access**: Read by all agents during implementation
**Update**: Orchestrator updates if patterns need refinement

### Backend API Reference
**Known Endpoints** (from backend context):
```
GET    /api/businesses                    → paginated list
GET    /api/businesses/:id                → single with contacts
GET    /api/businesses/stats              → dashboard stats
POST   /api/scraper/scrape                → start scrape
GET    /api/scraper/status/:jobId         → poll progress
POST   /api/enrichment/:id                → enrich single
POST   /api/enrichment/batch              → batch enrichment
GET    /api/jobs/:id                      → generic job status
GET    /api/jobs/failed                   → failed jobs
```

**WebSocket Events** (Server → Client):
```
business:created       { data: Business }
business:updated       { data: Business }
business:deleted       { data: { id } }
scraping:progress      { data: { jobId, progress } }
scraping:complete      { data: { jobId, found, saved } }
enrichment:complete    { data: { businessId } }
stats:updated          (trigger refetch)
```

---

## Dependency Graph

```
Agent 1 (API Client)
    ↓ provides types & queryKeys
Agent 2 (Hooks)
    ↓ provides hooks
    ↓
Agent 3 (WebSocket)  ← uses hooks for cache access
    ↓ provides useWebSocketSync
    ↓
Agent 4 (Providers)  ← composes all three layers
```

**Critical Path**: Agent 1 → Agent 2 → Agent 3 → Agent 4
**Can Parallelize**: None (strict dependencies)
**Parallel Testing**: Each agent can write tests independently

---

## Success Criteria

### Global Criteria
- [ ] All TypeScript types are exhaustive and correct
- [ ] Zero TypeScript errors in final build
- [ ] All queries follow `['resource', params]` convention
- [ ] All mutations use TanStack Query v5 (not v4)
- [ ] Error handling is comprehensive and graceful
- [ ] WebSocket real-time sync is seamless
- [ ] No race conditions between HTTP and WebSocket updates
- [ ] All hooks are testable and documented
- [ ] Performance meets dashboard requirements (< 100ms query time)

### Per-Agent Criteria

**Agent 1**:
- API client wraps all 15+ endpoints
- Request/response interceptors handle auth and errors
- Query keys match factory exactly
- Types are generated/exported correctly
- Axios cancel tokens work with TanStack Query signals

**Agent 2**:
- All hooks use TanStack Query v5 API
- Optimistic updates have proper rollback
- Polling queries have correct refetch intervals
- Dependent queries use `enabled` field
- Stale time and gc time are appropriate per endpoint

**Agent 3**:
- WebSocket events trigger appropriate cache operations
- Cache updates are immutable (use spread/map/filter)
- No orphaned socket listeners
- Reconnection doesn't duplicate listeners
- Real-time updates merge correctly with HTTP requests

**Agent 4**:
- Providers render without errors
- QueryClient persists correctly on navigation
- WebSocket connects automatically on mount
- Error boundaries catch all error types
- Dashboard is fully functional with all features

---

## Communication Protocol

### Check-ins
- **Daily**: 9:00 AM - Status update on current blockers
- **As-needed**: Blocking dependency resolved

### Questions
- Query key naming: Escalate to Orchestrator
- API endpoint behavior: Check backend docs in this plan
- TanStack Query patterns: Reference `/TANSTACK_QUERY_PATTERNS.md`
- Cache invalidation logic: Review decision tree in patterns doc

### Handoffs
- Agent 1 → Agent 2: "API client ready, types exported"
- Agent 2 → Agent 3: "Hooks implemented, tested, stable"
- Agent 3 → Agent 4: "WebSocket integration working, no race conditions"

---

## File Structure

```
dashboard/
├── docs/
│   ├── TANSTACK_QUERY_PATTERNS.md         ← Shared patterns
│   └── AGENT_COORDINATION_PLAN.md         ← This file
├── lib/
│   ├── api.ts                             ← Agent 1
│   ├── queryKeys.ts                       ← Agent 1
│   └── cache/
│       └── webSocketInvalidation.ts       ← Agent 3
├── types/
│   └── api.ts                             ← Agent 1
├── hooks/
│   ├── useBusinesses.ts                   ← Agent 2
│   ├── useBusiness.ts                     ← Agent 2
│   ├── useBusinessContacts.ts             ← Agent 2
│   ├── useJobStatus.ts                    ← Agent 2
│   ├── useScrapeBusinesses.ts             ← Agent 2
│   ├── useEnrichBusiness.ts               ← Agent 2
│   ├── useBatchEnrichment.ts              ← Agent 2
│   ├── useStatsQuery.ts                   ← Agent 2
│   ├── useWebSocketSync.ts                ← Agent 3
│   └── __tests__/
│       ├── useBusinesses.test.ts
│       ├── useScrapeBusinesses.test.ts
│       └── ... (all hooks tested)
├── providers/
│   ├── ReactQueryProvider.tsx             ← Agent 4
│   └── WebSocketProvider.tsx              ← Agent 4
└── app/
    └── layout.tsx                         ← Agent 4
```

---

## Risk Mitigation

### Risk 1: Query Key Inconsistency
**Severity**: High (breaks cache invalidation)
**Mitigation**:
- Central query key factory (Agent 1)
- Orchestrator validates all queries match factory
- Peer review before merging

### Risk 2: Race Conditions (HTTP + WebSocket)
**Severity**: High (data inconsistency)
**Mitigation**:
- All WebSocket handlers check cache first
- Use `cancelQueries` in optimistic updates
- E2E tests with both event sources
- Document expected merge behavior

### Risk 3: WebSocket Disconnection
**Severity**: Medium (stale data)
**Mitigation**:
- Automatic reconnection with backoff
- Fallback to HTTP polling on disconnect
- Visual indicator of connection status
- Refetch all active queries on reconnect

### Risk 4: Type Mismatch Between Client & Server
**Severity**: Medium (runtime errors)
**Mitigation**:
- Keep types in sync with backend API docs
- Strict TypeScript mode enabled
- Runtime validation in interceptors
- Error boundaries catch type errors

### Risk 5: Performance Degradation
**Severity**: Low (non-critical feature impact)
**Mitigation**:
- Monitor query times during implementation
- Use React Query DevTools
- Implement caching appropriately
- Profile with dashboard 100+ businesses

---

## Timeline

**Phase 1: Layer 1** (Day 1)
- Agent 1 builds API client
- Estimated: 2-4 hours

**Phase 2: Layer 2** (Day 1-2)
- Agent 2 implements hooks (start after Agent 1)
- Estimated: 4-6 hours

**Phase 3: Layer 3** (Day 2)
- Agent 3 implements WebSocket bridge (start after Agent 2)
- Estimated: 2-3 hours

**Phase 4: Integration** (Day 2-3)
- Agent 4 assembles providers
- All agents test together
- Estimated: 2-3 hours

**Testing & Refinement** (Day 3)
- Integration tests
- Performance testing
- Bug fixes

---

## Escalation Path

| Issue | Owner | Escalate To |
|-------|-------|------------|
| TypeScript type mismatch | Agent encountering | Orchestrator (Agent 1) |
| Query key naming conflict | Agent using | Orchestrator |
| Cache invalidation logic | Agent 2/3 | Orchestrator (review patterns) |
| WebSocket event mapping | Agent 3 | Orchestrator (check backend context) |
| Provider setup errors | Agent 4 | Orchestrator |
| Cross-layer integration | Any agent | Orchestrator |

---

## Definition of Done (Full System)

- [ ] All TypeScript compiles without errors
- [ ] API client covers all 15+ endpoints
- [ ] All query/mutation hooks are implemented
- [ ] Optimistic updates work end-to-end
- [ ] WebSocket events sync correctly to cache
- [ ] Providers compose without conflicts
- [ ] 80%+ test coverage across all layers
- [ ] Dashboard loads and displays data correctly
- [ ] Real-time updates visible on screen
- [ ] Performance acceptable (< 100ms initial load)
- [ ] Error handling catches all failure modes
- [ ] Documentation complete and clear

---

**Created By**: Context Manager Agent
**Last Updated**: 2025-11-22
**Status**: READY FOR EXECUTION
