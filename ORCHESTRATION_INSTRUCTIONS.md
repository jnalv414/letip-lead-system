# Le Tip Lead System Dashboard - Orchestration Instructions

## Executive Summary

You have a fully functional NestJS backend (API + WebSocket) and need to build a modern Next.js 16 dashboard with dark mode, real-time updates, and stunning animations.

**Phase 1 involves spawning 5 specialist agents IN PARALLEL to handle different concerns:**

1. **solutions-architect** - TypeScript types and data architecture
2. **fullstack-developer** - Next.js setup and build configuration
3. **ux-designer** - Dark theme, animations, and design system
4. **frontend-developer** - API integration, hooks, and middleware
5. **code-reviewer** - Validation, security, and quality assurance

All agents work independently, then outputs are integrated into a single project.

---

## File Reference Map

All specifications are documented in these files (read in order):

1. **DASHBOARD_BUILD_PLAN.md** - High-level project overview and strategy
2. **AGENT_PHASE1_SPECIFICATIONS.md** - Detailed requirements for each agent
3. **PHASE1_AGENT_BRIEFS.md** - Task briefs with specific file deliverables
4. **ORCHESTRATION_INSTRUCTIONS.md** - This file (coordination guide)

---

## How to Execute Phase 1

### Step 1: Provide Context to Each Agent

Copy this entire project structure to your agent prompts:

```
Project Root: /Volumes/HOME-EX/Users/justinnalven/.claude/projects/letip-lead-systen/letip-lead-system

Backend Location: ./nodejs_space/
- API: http://localhost:3000
- Swagger Docs: http://localhost:3000/api-docs
- WebSocket: ws://localhost:3000

Dashboard Target: ./dashboard/ (currently empty)

Key Docs to Read:
1. DASHBOARD_BUILD_PLAN.md
2. AGENT_PHASE1_SPECIFICATIONS.md
3. PHASE1_AGENT_BRIEFS.md
```

### Step 2: Spawn Agents (You Choose Method)

**Option A: Sequential (Safe, slower)**
- Execute Agent 1 fully, then Agent 2, etc.
- Takes ~10-12 hours total

**Option B: Parallel (Fast, requires coordination)**
- Execute all 5 agents simultaneously
- Each agent works on separate files
- Integration happens at the end
- Takes ~2-3 hours total
- **RECOMMENDED** for this project

**Option C: Hybrid (Balanced)**
- Run architects in parallel (Agent 1 + partial Agent 3)
- Wait for types to be ready
- Then run other agents in parallel
- Takes ~4-5 hours total

### Step 3: Agent Execution Details

#### Agent 1: solutions-architect
```
TASK: Create TypeScript type system and data architecture

DELIVERABLES:
1. dashboard/types/models.ts - All Business, Contact, Log types
2. dashboard/types/api.ts - API request/response types
3. dashboard/types/events.ts - WebSocket event types
4. dashboard/ARCHITECTURE.md - Data flow documentation
5. dashboard/tsconfig.json - TypeScript configuration

DEPENDS ON: Nothing (can start immediately)
ENABLES: Agent 4 (frontend-developer needs types)

MCP SERVERS TO USE:
- context7: Zustand patterns, Next.js data patterns
- chrome-devtools: Not needed for this phase

ESTIMATED TIME: 1.5 hours
```

#### Agent 2: fullstack-developer
```
TASK: Initialize Next.js 16 project and install dependencies

DELIVERABLES:
1. dashboard/package.json - All dependencies
2. dashboard/next.config.ts - Build configuration
3. dashboard/tailwind.config.ts - Tailwind setup
4. dashboard/postcss.config.js - CSS processing
5. dashboard/.eslintrc.json - Linting rules
6. dashboard/.prettierrc - Code formatting
7. dashboard/.env.example - Environment template
8. dashboard/app/layout.tsx - Root layout
9. dashboard/app/page.tsx - Redirect to dashboard
10. dashboard/.gitignore - Git ignore rules
11. Run: npm install
12. Verify: npm run build succeeds

DEPENDS ON: Agent 1 (tsconfig.json) - but can be overwritten
ENABLES: Agent 3, 4 (need package.json and build setup)

MCP SERVERS TO USE:
- context7: Latest Next.js 16 patterns, Tailwind setup
- chrome-devtools: Test that next dev starts

ESTIMATED TIME: 2 hours
```

#### Agent 3: ux-designer
```
TASK: Create design system, dark theme, animations

DELIVERABLES:
1. dashboard/styles/globals.css - Global styles
2. dashboard/styles/animations.ts - Framer Motion variants
3. dashboard/DESIGN_TOKENS.md - Design documentation
4. dashboard/components/ui/README.md - Component guide
5. dashboard/THEME.md - Theme philosophy
6. Extend: dashboard/tailwind.config.ts - Dark colors
7. Add: dashboard/app/layout.tsx - Font imports

DEPENDS ON: Agent 2 (package.json for tailwind)
ENABLES: Components phase (Phase 2+)

MCP SERVERS TO USE:
- context7: Tailwind dark mode, Framer Motion patterns
- chrome-devtools: Verify dark theme rendering

ESTIMATED TIME: 2 hours
```

#### Agent 4: frontend-developer
```
TASK: Create API integration, WebSocket setup, hooks, middleware

DELIVERABLES:
1. dashboard/lib/axios.ts - HTTP client
2. dashboard/lib/socket.ts - WebSocket client
3. dashboard/middleware.ts - Authentication
4. dashboard/app/(auth)/login/page.tsx - Login page
5. dashboard/lib/api/businesses.ts - API functions
6. dashboard/lib/api/scraper.ts - Scraper API
7. dashboard/lib/api/enrichment.ts - Enrichment API
8. dashboard/lib/api/outreach.ts - Outreach API
9. dashboard/lib/hooks/useBusinesses.ts - Business hook
10. dashboard/lib/hooks/useStats.ts - Stats hook
11. dashboard/lib/hooks/useWebSocket.ts - WebSocket hook
12. dashboard/lib/hooks/useScraper.ts - Scraper hook
13. dashboard/lib/hooks/useEnrichment.ts - Enrichment hook

DEPENDS ON: Agent 1 (types), Agent 2 (package.json)
ENABLES: Phase 2 (Zustand stores, components)

MCP SERVERS TO USE:
- context7: Socket.io patterns, custom hooks, axios
- chrome-devtools: Test API calls, login flow

ESTIMATED TIME: 2.5 hours
```

#### Agent 5: code-reviewer
```
TASK: Validate all work, establish quality standards

DELIVERABLES:
1. dashboard/TYPESCRIPT_REPORT.md - Type system review
2. dashboard/SECURITY.md - Security assessment
3. dashboard/PERFORMANCE.md - Performance strategy
4. dashboard/ERROR_HANDLING.md - Error handling guide
5. dashboard/TESTING.md - Testing strategy
6. dashboard/CODE_QUALITY.md - Code quality checklist

DEPENDS ON: All other agents (reviews their work)
ENABLES: Phase 2 (quality baseline established)

MCP SERVERS TO USE:
- context7: TypeScript strict mode, security patterns
- chrome-devtools: Performance traces, security headers

ESTIMATED TIME: 1.5 hours

SPECIAL NOTE: Start this agent AFTER agents 1-4 have completed
or in parallel to review as they work
```

### Step 4: Integration Process

After all agents complete, follow this process:

```bash
cd /Volumes/HOME-EX/Users/justinnalven/.claude/projects/letip-lead-systen/letip-lead-system/dashboard

# 1. Verify all files are in place
ls -la

# 2. Install dependencies
npm install

# 3. Check TypeScript compilation
npm run build

# Expected output: "Compiled successfully"

# 4. Start development server
npm run dev

# Expected output: "▲ Next.js 16.0.0"
#                   "- Local: http://localhost:3000"

# 5. Test in browser
# - Visit http://localhost:3000
# - Should redirect to /login
# - Enter password "letip2025" (or from .env.local)
# - Should redirect to /dashboard
# - Should see page structure loading
```

### Step 5: Validation Checklist

After integration, verify these pass:

**TypeScript & Build**
- [ ] `npm run build` succeeds
- [ ] No TypeScript errors
- [ ] `npm run dev` starts without errors

**Environment**
- [ ] .env.local exists (git-ignored)
- [ ] NEXT_PUBLIC_API_BASE_URL set to http://localhost:3000
- [ ] NEXT_PUBLIC_SOCKET_URL set to http://localhost:3000
- [ ] DASHBOARD_PASSWORD set

**Frontend**
- [ ] Dark theme renders correctly
- [ ] Login page accessible at /login
- [ ] Password protection works
- [ ] Redirects to /dashboard on success

**Integration**
- [ ] API calls to http://localhost:3000/api/businesses work
- [ ] Socket.io connects to ws://localhost:3000
- [ ] No console errors
- [ ] No TypeScript errors

**Code Quality**
- [ ] ESLint passes: `npm run lint`
- [ ] Prettier formats: `npm run format`
- [ ] No security warnings

---

## Expected File Structure After Phase 1

```
dashboard/
├── app/
│   ├── (auth)/
│   │   └── login/
│   │       └── page.tsx          [AGENT 4]
│   ├── dashboard/
│   │   ├── layout.tsx             (empty, will be created Phase 2)
│   │   └── page.tsx               (empty, will be created Phase 2)
│   ├── layout.tsx                 [AGENT 2 + 3]
│   ├── middleware.ts              [AGENT 4]
│   └── page.tsx                   [AGENT 2]
├── components/
│   ├── ui/
│   │   └── README.md              [AGENT 3]
│   └── common/
│       └── (Providers created Phase 2)
├── lib/
│   ├── api/
│   │   ├── businesses.ts          [AGENT 4]
│   │   ├── scraper.ts             [AGENT 4]
│   │   ├── enrichment.ts          [AGENT 4]
│   │   └── outreach.ts            [AGENT 4]
│   ├── hooks/
│   │   ├── useBusinesses.ts       [AGENT 4]
│   │   ├── useStats.ts            [AGENT 4]
│   │   ├── useWebSocket.ts        [AGENT 4]
│   │   ├── useScraper.ts          [AGENT 4]
│   │   └── useEnrichment.ts       [AGENT 4]
│   ├── axios.ts                   [AGENT 4]
│   ├── socket.ts                  [AGENT 4]
│   └── utils.ts                   (created Phase 2)
├── stores/
│   └── (Created Phase 2)
├── styles/
│   ├── globals.css                [AGENT 3]
│   └── animations.ts              [AGENT 3]
├── types/
│   ├── models.ts                  [AGENT 1]
│   ├── api.ts                     [AGENT 1]
│   └── events.ts                  [AGENT 1]
├── .env.example                   [AGENT 2]
├── .env.local                     [AGENT 2, local only]
├── .eslintrc.json                 [AGENT 2]
├── .gitignore                     [AGENT 2]
├── .prettierrc                     [AGENT 2]
├── next.config.ts                 [AGENT 2]
├── postcss.config.js              [AGENT 2]
├── tailwind.config.ts             [AGENT 2 + 3]
├── tsconfig.json                  [AGENT 1 + 2]
├── package.json                   [AGENT 2]
├── ARCHITECTURE.md                [AGENT 1]
├── DESIGN_TOKENS.md               [AGENT 3]
├── THEME.md                       [AGENT 3]
├── TYPESCRIPT_REPORT.md           [AGENT 5]
├── SECURITY.md                    [AGENT 5]
├── PERFORMANCE.md                 [AGENT 5]
├── ERROR_HANDLING.md              [AGENT 5]
├── TESTING.md                     [AGENT 5]
└── CODE_QUALITY.md                [AGENT 5]
```

---

## Phase 2 Preparation (After Phase 1 Complete)

Once Phase 1 integration succeeds, you'll be ready for Phase 2:

**Phase 2 Tasks:**
1. Create 4 Zustand stores (business, stats, scraper, enrichment)
2. Create Providers component (Zustand init + Socket.io setup)
3. Create layout components (Header, Sidebar, PageContainer)
4. Install all ShadCN/UI components
5. Wire up custom hooks to stores

**Phase 2 Duration:** 2-3 hours

---

## Troubleshooting During Phase 1

### Agent 2: `npm install` fails
- Verify Node.js 18+ installed
- Delete package-lock.json, try again
- Check npm version: `npm --version`

### Agent 4: API client tests fail
- Verify backend is running: `cd ../nodejs_space && yarn start:dev`
- Check API responds: `curl http://localhost:3000/api/businesses/stats`
- Verify Socket.io port is open: `lsof -i :3000`

### Agent 5: TypeScript errors
- Run `npm run build` to see full errors
- Check all types are exported from types/*.ts
- Verify tsconfig.json strict mode doesn't conflict

### Integration: Dark theme looks wrong
- Clear next cache: `rm -rf .next`
- Restart dev server: `npm run dev`
- Check tailwind.config.ts has darkMode: 'class'

### Integration: Password protection not working
- Verify middleware.ts exists and is in app/ directory
- Check .env.local has DASHBOARD_PASSWORD set
- Clear cookies and try again

---

## Communication Protocol Between Agents

### Agent 1 → Agent 2
```
types/models.ts, types/api.ts → Used in package.json imports
tsconfig.json → Merge with Agent 2's tsconfig
```

### Agent 2 → Agent 3 & 4
```
package.json → All dependencies needed
next.config.ts, tailwind.config.ts → Used in Agent 3's styling
```

### Agent 1 → Agent 4
```
types/ → Used in API functions, hooks
ARCHITECTURE.md → Guides hook design
```

### Agent 3 → Agent 4
```
globals.css → Used in Agent 4's components
animations.ts → Used in component examples
```

### All Agents → Agent 5
```
All files → Reviewed for quality, security, performance
```

---

## Metrics & Success Criteria

### Phase 1 Success Metrics
- ✅ All 5 agents deliver complete files (no TODOs)
- ✅ Zero TypeScript errors with strict mode
- ✅ npm install succeeds without warnings
- ✅ npm run build succeeds
- ✅ npm run dev starts on localhost:3000
- ✅ Dark theme renders correctly
- ✅ Login page works with password protection
- ✅ No console errors on startup

### Phase 2 Readiness Metrics
- ✅ All Phase 1 success metrics met
- ✅ API client can call backend endpoints
- ✅ Socket.io connects to backend
- ✅ File structure matches expected layout
- ✅ TypeScript compilation clean
- ✅ Security review passed
- ✅ Performance baseline established

---

## Timeline Estimates

**Parallel Execution (Recommended):**
- Phase 1: 2-3 hours
- Phase 2: 2-3 hours
- Phase 3: 4-5 hours
- Phase 4: 2-3 hours
- **Total: 10-14 hours**

**Sequential Execution (Safe but slower):**
- Phase 1: 10-12 hours
- Phase 2: 2-3 hours
- Phase 3: 4-5 hours
- Phase 4: 2-3 hours
- **Total: 20-23 hours**

---

## Next Steps

1. **Read this document thoroughly** - Understand the agent structure
2. **Review AGENT_PHASE1_SPECIFICATIONS.md** - Detailed requirements
3. **Choose execution method** - Parallel (fast) or sequential (safe)
4. **Spawn agents** - Provide them the context and briefs
5. **Monitor progress** - Keep agents on track
6. **Integrate outputs** - Merge into dashboard/ directory
7. **Run validation** - Verify all success criteria
8. **Proceed to Phase 2** - Build core components

---

## Agent Communication Template

Use this to brief each agent:

```
PROJECT CONTEXT
- Backend: NestJS API at http://localhost:3000
- Database: PostgreSQL with Business, Contact, etc.
- WebSocket: Socket.io at ws://localhost:3000
- Target: Build Next.js 15 dashboard

YOUR ROLE: [Agent Name]
- Read: DASHBOARD_BUILD_PLAN.md
- Read: AGENT_PHASE1_SPECIFICATIONS.md
- Read: PHASE1_AGENT_BRIEFS.md
- Focus on: [Specific deliverables from your brief]

MCP SERVERS TO USE:
- context7: [Specific documentation to research]
- chrome-devtools: [Testing requirements]

DELIVERABLES:
- [File 1]
- [File 2]
- etc.

ESTIMATED TIME: [X hours]

DELIVERABLES COMPLETE WHEN:
✅ [Completion criteria 1]
✅ [Completion criteria 2]
```

---

## You Are Now Ready to Begin Phase 1!

All specifications, briefs, and instructions are prepared. The agents can now proceed with parallel execution of their tasks. After Phase 1 completes, you'll have a fully initialized, configured, and tested Next.js 15 dashboard ready for Phase 2 development.

**Good luck! Let's build something beautiful.** ⚡
