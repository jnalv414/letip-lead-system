# TanStack Query v5 Implementation - Master Index

**Project**: Le Tip Lead System Dashboard
**Orchestrator**: Context Manager Agent
**Status**: ORCHESTRATION COMPLETE - READY FOR AGENT EXECUTION
**Date**: 2025-11-22

---

## Quick Navigation

### For Agents Starting Implementation
1. Start here: **TANSTACK_QUERY_IMPLEMENTATION.md** (11 KB)
   - Architecture overview
   - Your specific role and deliverables
   - Timeline and dependencies
   - Quick start guide

2. Reference during work: **dashboard/docs/TANSTACK_QUERY_PATTERNS.md** (27 KB)
   - All patterns needed for implementation
   - Code examples for every pattern
   - Common pitfalls and solutions

3. Understand dependencies: **dashboard/docs/AGENT_COORDINATION_PLAN.md** (13 KB)
   - Who depends on your work
   - What you need from others
   - Success criteria for your layer
   - Risk mitigation strategies

### For Project Managers/Reviewers
1. Status overview: **ORCHESTRATION_SUMMARY.txt** (6 KB)
   - What was created
   - Agent assignments
   - Timeline and dependencies
   - Success criteria

2. Detailed report: **COORDINATION_REPORT.md** (19 KB)
   - Context gathered (7,500+ snippets)
   - Integration points analysis
   - Quality assurance checklist
   - Risk assessment with mitigations

### For Architecture Review
1. Patterns documentation: **dashboard/docs/TANSTACK_QUERY_PATTERNS.md**
   - All patterns extracted from latest context7 sources
   - Specific to this project's needs
   - Validated against best practices

2. Coordination plan: **dashboard/docs/AGENT_COORDINATION_PLAN.md**
   - Architecture layers defined
   - Dependencies clearly mapped
   - Success criteria explicit

---

## Document Summary

### TANSTACK_QUERY_IMPLEMENTATION.md (11 KB)
**Type**: Quick Start Guide
**Audience**: Agents, Tech Leads
**Content**:
- Architecture overview with diagram
- Implementation layers breakdown
- Core concepts explained
- Backend API reference
- File organization
- Development workflow per agent
- Testing strategy
- Common issues & solutions
- Performance tips
- Success checklist

**Read Time**: 15 minutes
**Use When**: Starting implementation, need quick reference

---

### dashboard/docs/TANSTACK_QUERY_PATTERNS.md (27 KB)
**Type**: Comprehensive Reference Guide
**Audience**: All implementers
**Content**:
- Query key conventions with factory pattern
- Query hook patterns (5 types)
- Mutation hook patterns (3 types)
- Optimistic update patterns with rollback
- Cache invalidation decision tree
- WebSocket-Query bridge architecture
- Provider setup for Next.js 16 App Router
- Error handling patterns
- API client integration
- Testing patterns
- Implementation checklist per layer
- Performance optimization tips
- Common pitfalls to avoid

**Read Time**: 45 minutes for full review
**Use When**: During implementation, reference specific patterns

---

### dashboard/docs/AGENT_COORDINATION_PLAN.md (13 KB)
**Type**: Execution Plan
**Audience**: Agents, Project Managers
**Content**:
- Agent assignments (4 agents, 4 roles)
- Detailed deliverables per agent
- Dependency graph and critical path
- Timeline (11-16 hours over 2-3 days)
- Communication protocol
- File structure
- Risk mitigation strategies (5 risks identified)
- Success criteria per layer and globally
- Escalation paths
- Definition of done

**Read Time**: 30 minutes
**Use When**: Planning sprints, tracking dependencies, unblocking agents

---

### COORDINATION_REPORT.md (19 KB)
**Type**: Comprehensive Status Report
**Audience**: Project Managers, Architects, Reviewers
**Content**:
- Executive summary
- Context gathering summary (7,500+ snippets from 3 sources)
- Implementation architecture (Layer 1-4 detailed)
- Dependency validation and critical path
- Query key convention validation
- Cache invalidation strategy validation
- WebSocket-Query sync validation
- Integration points analysis
- Testing strategy (unit, integration, E2E)
- Performance considerations
- Quality assurance checklist
- Risk assessment matrix with mitigations
- Success metrics

**Read Time**: 60 minutes for full review
**Use When**: Design review, QA planning, risk assessment

---

### ORCHESTRATION_SUMMARY.txt (6 KB)
**Type**: Executive Summary
**Audience**: Leadership, Quick Reference
**Content**:
- Mission accomplished summary
- 4 deliverables created
- Context gathered (7,500+ snippets)
- 4 agent assignments with times
- Dependency validation
- Risk assessment (5 risks)
- Success criteria
- Next steps timeline
- Document locations
- Sign-off

**Read Time**: 10 minutes
**Use When**: Status updates, approval gates

---

## Coordination Documents Structure

```
Project Root/
├── README_TANSTACK_ORCHESTRATION.md        ← You are here
├── TANSTACK_QUERY_IMPLEMENTATION.md        ← START HERE (Agents)
├── ORCHESTRATION_SUMMARY.txt               ← START HERE (Leadership)
├── COORDINATION_REPORT.md                  ← Full status report
│
└── dashboard/
    └── docs/
        ├── TANSTACK_QUERY_PATTERNS.md      ← Reference during work
        └── AGENT_COORDINATION_PLAN.md      ← Execution plan
```

---

## Key Facts at a Glance

### Architecture
- **Type**: Three-layer TanStack Query v5 + Next.js 16 + React 19.2
- **Scope**: Complete dashboard data layer implementation
- **Endpoints**: 15+ API endpoints
- **Real-time Events**: 7 WebSocket events

### Implementation
- **Agents**: 4 specialized fullstack-developers
- **Timeline**: 11-16 hours over 2-3 days
- **Path**: Sequential (strict dependencies)
- **Blockers**: None (all dependencies known)

### Patterns
- **Query Keys**: Factory pattern, `['resource', filters/id]` convention
- **Cache**: Immutable updates, optimistic with rollback
- **Real-time**: WebSocket-driven invalidation/updates
- **Errors**: Three-layer handling (interceptor, component, global)

### Quality
- **Coverage**: 80%+ test coverage required
- **TypeScript**: Strict mode, no `any` types
- **Performance**: < 100ms initial load
- **Documentation**: Comprehensive, with examples

---

## Implementation Timeline

```
Day 1-2: Implementation
├─ Agent 1: API Client (2-4 hours)
│  ├─ lib/api.ts
│  ├─ lib/queryKeys.ts
│  └─ types/api.ts
│
├─ Agent 2: Hooks (4-6 hours, after Agent 1)
│  ├─ Query hooks (5 types)
│  ├─ Mutation hooks (3 types)
│  └─ Tests (80%+ coverage)
│
├─ Agent 3: WebSocket Bridge (2-3 hours, after Agent 2)
│  ├─ useWebSocketSync hook
│  ├─ Event handlers (7 events)
│  └─ Cache invalidation logic
│
└─ Agent 4: Providers (2-3 hours, after Agent 3)
   ├─ ReactQueryProvider
   ├─ WebSocketProvider
   ├─ app/layout.tsx
   └─ Error boundaries

Day 3: Testing & Refinement
├─ Integration tests
├─ Performance testing
├─ Bug fixes
└─ Final merge
```

---

## Success Criteria (Complete When)

### Global
- [ ] All TypeScript compiles without errors
- [ ] API client covers all 15+ endpoints
- [ ] All query/mutation hooks implemented
- [ ] Optimistic updates work with rollback
- [ ] WebSocket events sync to cache correctly
- [ ] Providers compose without conflicts
- [ ] 80%+ test coverage across all layers
- [ ] Dashboard displays data correctly
- [ ] Real-time updates visible on screen
- [ ] Performance < 100ms initial load
- [ ] Error handling comprehensive
- [ ] Documentation complete

### Per-Agent
**Agent 1**: Types exhaustive, interceptors working, tests passing
**Agent 2**: All hooks use v5, optimistic updates correct, 80% tests
**Agent 3**: WebSocket events trigger correct cache ops, no race conditions
**Agent 4**: Providers work, error boundaries active, full integration

---

## Reading Order by Role

### Agent 1 (API Client)
1. TANSTACK_QUERY_IMPLEMENTATION.md (10 min)
2. dashboard/docs/AGENT_COORDINATION_PLAN.md → Agent 1 section (5 min)
3. dashboard/docs/TANSTACK_QUERY_PATTERNS.md → Section 9 (API Client) (10 min)
4. Start implementation

### Agent 2 (Query/Mutation Hooks)
1. TANSTACK_QUERY_IMPLEMENTATION.md (10 min)
2. dashboard/docs/AGENT_COORDINATION_PLAN.md → Agent 2 section (5 min)
3. dashboard/docs/TANSTACK_QUERY_PATTERNS.md → Sections 2-5 (30 min)
4. Wait for Agent 1
5. Start implementation

### Agent 3 (WebSocket Bridge)
1. TANSTACK_QUERY_IMPLEMENTATION.md (10 min)
2. dashboard/docs/AGENT_COORDINATION_PLAN.md → Agent 3 section (5 min)
3. dashboard/docs/TANSTACK_QUERY_PATTERNS.md → Section 6 (20 min)
4. Wait for Agent 2
5. Start implementation

### Agent 4 (Providers)
1. TANSTACK_QUERY_IMPLEMENTATION.md (10 min)
2. dashboard/docs/AGENT_COORDINATION_PLAN.md → Agent 4 section (5 min)
3. dashboard/docs/TANSTACK_QUERY_PATTERNS.md → Section 7 (15 min)
4. Wait for Agent 3
5. Start implementation

### Tech Lead/Project Manager
1. ORCHESTRATION_SUMMARY.txt (10 min)
2. COORDINATION_REPORT.md (30 min)
3. dashboard/docs/AGENT_COORDINATION_PLAN.md (15 min)
4. Ready to manage

### Architect/Reviewer
1. dashboard/docs/TANSTACK_QUERY_PATTERNS.md (30 min)
2. dashboard/docs/AGENT_COORDINATION_PLAN.md (15 min)
3. COORDINATION_REPORT.md (30 min)
4. Ready to review

---

## Key Design Patterns

### Query Key Factory
```typescript
// MUST use this pattern everywhere
export const queryKeys = {
  businesses: {
    all: () => ['businesses'],
    list: (filters) => ['businesses', filters],
    detail: (id) => ['business', { id }],
  },
}
```

### Optimistic Update
```typescript
// Full pattern with rollback
useMutation({
  onMutate: snapshot && optimistic update,
  onError: rollback from snapshot,
  onSettled: refetch for correctness,
})
```

### Cache Invalidation Decision Tree
```
Does mutation return data?
├─ Yes → onSuccess with setQueryData
└─ No → onSettled with invalidateQueries
```

### WebSocket-Query Bridge
```typescript
socket.on('event', (data) => {
  queryClient.setQueryData(key, (old) => updateData(old, data))
})
```

---

## Common Blockers & Solutions

### TypeScript Type Mismatch
**Solution**: Use factory pattern, centralized types file

### Query Key Inconsistency
**Solution**: Central query key factory, code review before merge

### WebSocket Race Conditions
**Solution**: Timestamp checks, cache existence verification

### Optimistic Update Rollback Issues
**Solution**: Snapshot entire object in onMutate

### Memory Leak from Listeners
**Solution**: Cleanup in provider unmount

---

## Escalation Path

| Issue | Contact | Time |
|-------|---------|------|
| TypeScript error | Orchestrator | ASAP |
| Query key conflict | Orchestrator | ASAP |
| Pattern question | Review doc | 5 min |
| Blocking dependency | Orchestrator | ASAP |
| Performance issue | Orchestrator | Daily standup |

---

## Daily Standup Questions

**Status**: What did I complete?
**Blockers**: What's preventing progress?
**Help**: What do I need from others?
**Next**: What's my focus?

Daily standup: 9:00 AM
Participants: All 4 agents + Orchestrator

---

## Questions?

### Pattern Question?
→ Review `/dashboard/docs/TANSTACK_QUERY_PATTERNS.md`

### Role/Timeline Question?
→ Read `/dashboard/docs/AGENT_COORDINATION_PLAN.md` (your section)

### Status/Integration Question?
→ Check `COORDINATION_REPORT.md`

### Blocking Issue?
→ Contact Orchestrator (Context Manager Agent) immediately

---

## Document Metadata

| Document | Size | Focus | Read Time |
|----------|------|-------|-----------|
| TANSTACK_QUERY_IMPLEMENTATION.md | 11 KB | Quick start | 15 min |
| TANSTACK_QUERY_PATTERNS.md | 27 KB | Reference | 45 min |
| AGENT_COORDINATION_PLAN.md | 13 KB | Execution | 30 min |
| COORDINATION_REPORT.md | 19 KB | Full status | 60 min |
| ORCHESTRATION_SUMMARY.txt | 6 KB | Overview | 10 min |

**Total Documentation**: 76 KB, ~3 hours to fully understand

---

## Next Steps

1. **Agents**: Read TANSTACK_QUERY_IMPLEMENTATION.md (15 min)
2. **Agents**: Read your section in AGENT_COORDINATION_PLAN.md (5 min)
3. **Agents**: Bookmark TANSTACK_QUERY_PATTERNS.md for reference
4. **Leadership**: Read ORCHESTRATION_SUMMARY.txt (10 min)
5. **Tech Lead**: Read COORDINATION_REPORT.md (30 min)
6. **All**: Daily standup at 9:00 AM

---

## Appendix: File Locations

```
/dashboard/docs/
├── TANSTACK_QUERY_PATTERNS.md          Reference guide (27 KB)
└── AGENT_COORDINATION_PLAN.md          Execution plan (13 KB)

/
├── TANSTACK_QUERY_IMPLEMENTATION.md    Quick start (11 KB)
├── COORDINATION_REPORT.md              Full report (19 KB)
├── ORCHESTRATION_SUMMARY.txt           Executive summary (6 KB)
└── README_TANSTACK_ORCHESTRATION.md    This file (8 KB)
```

---

## Sign-Off

**Orchestration**: COMPLETE
**Documentation**: COMPLETE
**Context Gathering**: COMPLETE (7,500+ snippets)
**Agent Readiness**: READY
**Execution**: APPROVED

Created: 2025-11-22
By: Context Manager Agent
Status: READY FOR AGENT EXECUTION

---

**Welcome to the TanStack Query v5 Implementation. Let's build something great!**
