# Le Tip Lead System - Planning Prompts

These are example prompts for the "vibe planning" stage for the Le Tip Lead System. They are meant to be fairly free-form and unstructured to enable exploratory research before implementation.

---

## Phase 1: Foundation - Dashboard Setup

### Prompt 1: Exploration
```
Please explore the App/BackEnd/src directory structure and deeply understand how:
1. The WebsocketGateway emits real-time events
2. The enrichment module integrates with Hunter.io and AbstractAPI
3. The scraper module uses Puppeteer for Google Maps scraping

Also read the existing DASHBOARD_BUILD_PLAN.md to understand the frontend requirements.
```

### Prompt 2: Research Options
```
I want to build a Next.js 16 dashboard that shows real-time business enrichment progress.

Explore our options for:
1. State management (Zustand vs Redux vs React Context)
2. Real-time updates (Socket.io client vs WebSocket API vs Server-Sent Events)
3. Animation libraries (Framer Motion vs React Spring vs GSAP)
4. Component libraries (ShadCN/UI vs Material-UI vs Chakra)

Report back in this format:

Option:
Description:
Tradeoffs:
Effort:
Integration with existing NestJS backend:
```

### Prompt 3: Technology Deep Dive
```
What libraries and technologies would we need for:
- WebSocket client connection to http://localhost:3000
- Zustand stores that update on Socket.io events
- AnimatedNumber component from Magic-UI
- Dark theme with Tailwind CSS and ShadCN

Would this solution support proper TypeScript strict mode?
What performance considerations do we need for real-time dashboard updates?

I'm leaning heavily on:
- Zustand for state management
- Socket.io client for WebSocket
- ShadCN/UI + Magic-UI for components
- Framer Motion for animations
```

### Prompt 4: Security & Authentication
```
We want to ensure the dashboard has password protection via Next.js middleware.

The backend has no authentication currently, so the frontend needs to:
1. Protect all /dashboard routes
2. Allow only /login route publicly
3. Store auth state in httpOnly cookies
4. Redirect to login when unauthorized

Also consider:
- How should we handle API calls to localhost:3000?
- Should WebSocket connections require authentication?
- What environment variables are safe to expose (NEXT_PUBLIC_*)?
```

### Prompt 5: Create Implementation Plan
```
Based on all the research we just did, please create an implementation plan in a file called PHASE1_IMPLEMENTATION_PLAN.md

This will be the prompt we send to the coding agents. It should include all relevant information from our research so agents can reliably build Phase 1 end-to-end.

We want to implement:
- Complete Next.js 16 project setup with Turbopack
- TypeScript strict mode with path aliases
- Tailwind dark theme configuration
- ShadCN/UI base installation
- API client (axios) with proper typing
- Socket.io client with event listeners
- Custom React hooks (useBusinesses, useStats, useWebSocket)
- Password middleware for route protection
- Login page with form validation

File format:

## Feature Description
[What Phase 1 accomplishes and why]

## User Stories
- As a user, I want to...
- As a developer, I need to...

## Solution & Approach
[Why we chose Next.js 16, Zustand, Socket.io, ShadCN]

## Relevant Files to Read
- App/BackEnd/src/websocket/websocket.gateway.ts
- App/BackEnd/src/businesses/businesses.service.ts
- App/BackEnd/src/enrichment/enrichment.service.ts
- DASHBOARD_BUILD_PLAN.md
- CLAUDE.md (Core Principles section)

## Implementation Plan

### Foundational Work
- Initialize Next.js 16 project
- Configure TypeScript strict mode
- Set up Tailwind CSS with dark theme
- Install dependencies (exact versions)

### Core Implementation
- Create type definitions (models.ts, api.ts, events.ts)
- Build API service layer (lib/api/*.ts)
- Implement Socket.io client (lib/socket.ts)
- Create custom hooks (lib/hooks/*.ts)
- Configure Zustand stores architecture

### Integration Work
- Connect API client to backend
- Wire WebSocket events to stores
- Implement password middleware
- Build login page

## Step-by-Step Task List

1. Setup & Configuration
   - Run `create-next-app` with TypeScript
   - Configure tsconfig.json with path aliases
   - Set up Tailwind dark mode
   - Create .env.example with NEXT_PUBLIC_* vars

2. Type System
   - Define Business, Contact types
   - Define API request/response types
   - Define WebSocket event types

3. API Layer
   - Create axios instance with baseURL
   - Build service functions for businesses, scraper, enrichment
   - Add error handling and logging

4. Real-time Layer
   - Initialize Socket.io client
   - Create event listeners for business:*, stats:*
   - Handle connection/disconnection

5. State Management
   - Design Zustand store shapes
   - Implement selectors
   - Connect stores to WebSocket events

6. Authentication
   - Build password middleware
   - Create login page with React Hook Form + Zod
   - Set httpOnly cookies

## Testing Strategy

### Unit Tests
- API service functions (mock axios)
- Custom hooks (with React Testing Library)
- Utility functions

### Integration Tests
- WebSocket connection flow
- API client with real backend
- Store updates on events

### E2E Tests (Phase 4)
- Login flow
- Password protection
- WebSocket real-time updates

## Edge Cases

- Backend offline (show connection error)
- WebSocket disconnection (auto-reconnect)
- Invalid API responses (show error toast)
- Missing environment variables (fail fast with clear error)
- Concurrent enrichment updates (debounce UI updates)

## Acceptance Criteria

- ✅ npm install succeeds without warnings
- ✅ npm run build compiles with 0 TypeScript errors
- ✅ npm run dev starts on localhost:3000
- ✅ Dark theme renders correctly
- ✅ Login redirects to /dashboard on success
- ✅ API calls return typed data
- ✅ WebSocket connects and receives events
- ✅ No console errors

## Validation Commands

```bash
# TypeScript compilation
npm run build

# Linting
npm run lint

# Type checking
npx tsc --noEmit

# Start dev server
npm run dev

# Test API connection
curl http://localhost:3000/api/businesses/stats

# Test WebSocket (in browser console)
# Should see connection logs
```

When complete, output:
- ✅ Created PHASE1_IMPLEMENTATION_PLAN.md
- ✅ Includes 5 specialist agent specifications
- ✅ Ready for parallel agent execution
```

---

## Phase 2: Business Features - Stats Dashboard

### Prompt 1: Exploration
```
Explore the existing Next.js 16 foundation we built in Phase 1.

Deeply understand:
1. How Zustand stores are structured
2. How custom hooks consume stores
3. How WebSocket events trigger store updates
4. How the Magic-UI AnimatedNumber component works

Also review the backend /api/businesses/stats endpoint to understand the data shape.
```

### Prompt 2: Component Architecture
```
I want to build a real-time stats dashboard with 6 cards:
- Total Businesses (animated counter)
- Enriched Count (animated counter)
- Pending Count (animated counter)
- Failed Count (animated counter)
- Top City (text with icon)
- Top Industry (text with icon)

Explore component architecture options:
1. Single StatsGrid component vs separate StatsCard components
2. Server Components vs Client Components (Next.js 16)
3. Data fetching: useEffect vs SWR vs React Query
4. Real-time updates: polling vs WebSocket events

Report back with recommendations based on our stack.
```

### Prompt 3: Animation Strategy
```
For the animated counters using Magic-UI AnimatedNumber:
- How should we handle rapid updates (multiple WebSocket events)?
- Should we debounce or throttle?
- What easing function works best for numbers?
- How do we prevent animation overlap?

For the layout:
- Grid system (CSS Grid vs Flexbox vs Tailwind grid classes)
- Responsive breakpoints (mobile, tablet, desktop)
- Card spacing (8px baseline grid from design system)

Research Magic-UI AnimatedNumber documentation and provide examples.
```

### Prompt 4: Data Flow
```
Map out the complete data flow:

1. Backend emits `stats:updated` WebSocket event
2. Frontend socket listener receives event
3. Zustand statsStore updates
4. StatsGrid component re-renders
5. AnimatedNumber components animate to new values

Ensure:
- No unnecessary re-renders
- Proper TypeScript typing throughout
- Error handling for missing data
- Loading states while fetching initial data
```

### Prompt 5: Implementation Plan
```
Create PHASE2_STATS_IMPLEMENTATION_PLAN.md with:

## Feature: Real-Time Stats Dashboard

### User Story
As a user, I want to see live statistics about my business leads so I can monitor enrichment progress in real-time.

### Technical Approach
- Zustand statsStore with initial fetch + WebSocket updates
- StatsCard component with Magic-UI AnimatedNumber
- Grid layout with Tailwind CSS
- Framer Motion for card entrance animations

### Files to Create
1. app/App/FrontEnd/page.tsx
2. components/App/FrontEnd/StatsGrid.tsx
3. components/App/FrontEnd/StatsCard.tsx
4. stores/statsStore.ts
5. lib/hooks/useStats.ts

### Implementation Steps
[Detailed step-by-step]

### Testing
[Unit + integration tests]

### Validation
```bash
npm run build && npm run dev
# Visit /dashboard
# Should see 6 stat cards with animated numbers
# Backend enrichment should trigger real-time updates
```
```

---

## Phase 3: Complex Features - Business Management

### Prompt 1: Table Architecture
```
I want to build a sortable, filterable, paginated business table.

Explore:
1. TanStack Table vs ShadCN Table vs custom implementation
2. Server-side pagination vs client-side
3. Sorting: controlled vs uncontrolled
4. Filtering: debounced search vs instant

Consider:
- We have 1000+ businesses in database
- Backend supports ?page=1&limit=20&city=Freehold&status=pending
- WebSocket events add new businesses in real-time
- Need to show contact count without loading all contacts

Review App/BackEnd/src/businesses/businesses.controller.ts for API capabilities.
```

### Prompt 2: Detail Page Design
```
For the business detail page (/App/FrontEnd/businesses/[id]):

What's the best approach for:
1. Tabs (Overview, Contacts, Enrichment Logs, Outreach)
2. Data fetching (parallel vs sequential)
3. CRUD operations (inline edit vs modal)
4. Real-time updates (partial vs full refetch)

The page needs to:
- Load business with related data (contacts, logs, messages)
- Allow editing business fields
- Show enrichment history
- Display generated outreach messages
- Delete business (with confirmation)

Research ShadCN Tabs component and Next.js 16 parallel routes.
```

### Prompt 3: Form Validation
```
For editing businesses:

Fields to edit:
- name (required, string)
- address (optional, string)
- city (optional, string, dropdown with existing cities)
- phone (optional, phone format)
- website (optional, URL format)
- category (optional, string)

Should we use:
- React Hook Form + Zod (our standard)
- Inline validation vs submit validation
- Optimistic updates vs pessimistic
- Auto-save vs manual save button

Consider:
- WebSocket events might update while user is editing
- Need to prevent overwriting user's unsaved changes
- Validation errors from backend need to show in form
```

### Prompt 4: Real-time Considerations
```
Challenge: User is viewing business ID 123

Scenarios:
1. Another user enriches business 123 → show toast with refresh option
2. Business 123 is deleted → redirect to list with notification
3. New contact added to business 123 → update contacts tab count
4. Enrichment completes → update status badge

How should we handle each scenario?
- Full page reload?
- Partial data refetch?
- Optimistic UI updates?
- Show notification only?

Design a robust pattern that works for all scenarios.
```

### Prompt 5: Implementation Plan
```
Create PHASE3_BUSINESS_MGMT_PLAN.md with:

## Features
1. Business List Table (sortable, filterable, paginated)
2. Business Detail Page (tabs: overview, contacts, logs, outreach)
3. Edit Business Form (inline with validation)
4. Delete Business (with confirmation)
5. Real-time Updates (WebSocket integration)

## Architecture
[Component tree]
[Data flow diagrams]
[State management strategy]

## Implementation Steps
1. Build BusinessTable component
2. Add sorting/filtering/pagination
3. Create [id]/page.tsx detail route
4. Build tabbed interface
5. Implement edit form
6. Add delete confirmation
7. Wire WebSocket updates
8. Add loading states
9. Handle edge cases

## Testing
- Table sorting works
- Filters apply correctly
- Pagination loads next page
- Edit form validates
- Delete confirmation prevents accidents
- Real-time updates appear correctly

## Validation
```bash
# Create business via API
curl -X POST http://localhost:3000/api/businesses -d '{"name": "Test"}'

# Should appear in table immediately (WebSocket)
# Click to view details
# Edit and save
# Delete with confirmation
```
```

---

## General Planning Template

### For Any New Feature

**Prompt 1: Understand Existing Code**
```
Explore [relevant files] and understand [existing patterns].
Focus on [specific integration points].
```

**Prompt 2: Research Options**
```
I want to build [feature description].

Explore options for:
1. [Technical decision 1]
2. [Technical decision 2]
3. [Technical decision 3]

Report back: Option, Description, Tradeoffs, Effort, Integration
```

**Prompt 3: Deep Dive**
```
For the chosen approach:
- What libraries/technologies do we need?
- What are the performance implications?
- How does it integrate with our existing [backend/frontend/database]?
- What edge cases must we handle?

I'm leaning toward [preferred solution] because [reasons].
```

**Prompt 4: Data Flow & Architecture**
```
Map out the complete data flow from [user action] to [UI update].

Consider:
- Error handling
- Loading states
- Real-time updates
- Type safety
- Performance

Ensure alignment with CLAUDE.md core principles.
```

**Prompt 5: Create Implementation Plan**
```
Based on all research, create [FEATURE_NAME]_PLAN.md

Include:
- Feature description & user stories
- Technical approach & rationale
- Relevant files to read
- Step-by-step implementation
- Testing strategy
- Edge cases
- Acceptance criteria
- Validation commands

Format according to PlanningPrompts.md template.
```

---

## Notes on Using These Prompts

1. **Free-form Exploration:** These prompts are intentionally open-ended to allow creative problem-solving.

2. **Iterative Refinement:** Each prompt builds on the previous, narrowing down options and deepening understanding.

3. **Research-Driven:** Encourage agents to research documentation, explore code, and test hypotheses.

4. **Decision Making:** By Prompt 3-4, you should have clear direction. Use Prompt 5 to formalize the plan.

5. **Documentation:** Always end with a written plan file that serves as the spec for implementation agents.

6. **Reference CLAUDE.md:** All plans should align with core principles and architecture patterns defined in CLAUDE.md.

---

## When to Use Planning Prompts

**Use vibe planning for:**
- ✅ New features with architectural decisions
- ✅ Technology choices (library selection)
- ✅ Complex data flows
- ✅ Integration with new external services
- ✅ Performance-critical implementations

**Don't need extensive planning for:**
- ❌ Simple bug fixes
- ❌ Minor UI tweaks
- ❌ Straightforward CRUD operations
- ❌ Copy/paste from existing patterns
- ❌ Configuration changes

**Rule of thumb:** If implementation requires >2 hours or introduces new patterns, do vibe planning first.
