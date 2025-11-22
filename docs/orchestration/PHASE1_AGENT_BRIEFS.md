# Phase 1 Agent Task Briefs - Execute in Parallel

## ORCHESTRATION SUMMARY

All 5 agents work independently on separate concerns, then outputs are merged. Each agent should:
1. Read AGENT_PHASE1_SPECIFICATIONS.md for detailed requirements
2. Read DASHBOARD_BUILD_PLAN.md for project context
3. Review backend API in nodejs_space/src for integration points
4. Deliver complete, production-ready files (no placeholders)
5. Use specified MCP servers (context7, chrome-devtools)
6. Follow TypeScript 5.7 strict mode requirements

Project Root: `/Volumes/HOME-EX/Users/justinnalven/.claude/projects/letip-lead-systen/letip-lead-system`
Target Directory: `dashboard/`

---

## BRIEF 1: solutions-architect

**Task**: Design data architecture, TypeScript types, state management

**Start**: Immediately after reading specs
**Duration**: 1.5 hours
**Deliverables**: 5 files

### Files to Create

1. **dashboard/types/models.ts** (150 lines)
   - Export ALL TypeScript interfaces for Business, Contact, EnrichmentLog, OutreachMessage
   - Base types and API variations
   - Strict typing, no `any`

2. **dashboard/types/api.ts** (100 lines)
   - API request types (Query params, request bodies)
   - API response types
   - Pagination metadata
   - Error types

3. **dashboard/types/events.ts** (80 lines)
   - WebSocket event type definitions
   - Socket.io event emitters and listeners
   - Event payload types

4. **dashboard/ARCHITECTURE.md** (200 lines)
   - Data flow diagrams (ASCII art)
   - Zustand store architecture
   - Component-to-store relationships
   - WebSocket event flow
   - API call patterns

5. **dashboard/tsconfig.json** (50 lines)
   - Complete TypeScript config
   - Strict mode enabled
   - Path aliases (@/components, @/lib, @/types, @/stores)
   - React 19 compatible

**MCP Usage**:
- context7: Research Zustand patterns, Next.js type patterns
- chrome-devtools: Validate tsconfig with TypeScript checker

---

## BRIEF 2: fullstack-developer

**Task**: Initialize Next.js 16 project, install dependencies, setup build system

**Start**: Immediately after reading specs
**Duration**: 2 hours
**Deliverables**: 12 files + dependencies installed

### Files to Create

1. **dashboard/package.json** (80 lines)
   - All dependencies specified in AGENT_PHASE1_SPECIFICATIONS.md
   - Exact version constraints
   - Scripts: dev, build, start, lint, format

2. **dashboard/next.config.ts** (40 lines)
   - Configuration for images, environment variables
   - API rewrites to backend (optional)
   - Build optimization

3. **dashboard/tailwind.config.ts** (100 lines)
   - Dark mode: class strategy
   - ShadCN/UI preset
   - Custom colors and spacing
   - Animation extensions

4. **dashboard/postcss.config.js** (20 lines)
   - Tailwind CSS plugin
   - Autoprefixer

5. **dashboard/tsconfig.json** (50 lines)
   - Strict mode, path aliases, React 19

6. **dashboard/.eslintrc.json** (30 lines)
   - Next.js recommended rules
   - TypeScript support

7. **dashboard/.prettierrc** (15 lines)
   - Consistent formatting
   - 2 spaces, semicolons, etc.

8. **dashboard/.env.example** (6 lines)
   ```
   NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
   NEXT_PUBLIC_SOCKET_URL=http://localhost:3000
   DASHBOARD_PASSWORD=letip2025
   ```

9. **dashboard/.env.local** (git-ignored, local only)
   - Same as .env.example

10. **dashboard/app/layout.tsx** (100 lines)
    - Root layout with dark theme
    - Font imports (Space Grotesk, Inter)
    - Providers wrapper
    - Meta tags

11. **dashboard/app/page.tsx** (20 lines)
    - Redirect to /dashboard

12. **dashboard/.gitignore** (15 lines)
    - Standard Next.js ignores
    - Environment files
    - Build artifacts

### Commands to Run
```bash
cd dashboard

# Install dependencies
npm install

# Run TypeScript check
npx tsc --noEmit

# Try to build (will have missing files, but TypeScript should compile)
npm run build 2>&1 | head -50
```

**MCP Usage**:
- context7: Get latest Next.js 16 setup, Tailwind configuration, ShadCN integration
- chrome-devtools: Test that next dev starts on localhost:3000 (after other files ready)

---

## BRIEF 3: ux-designer

**Task**: Design system, dark theme, animations, component library

**Start**: Immediately after reading specs
**Duration**: 2 hours
**Deliverables**: 7 files

### Files to Create

1. **dashboard/styles/globals.css** (150 lines)
   - Tailwind directives (@tailwind, @layer)
   - Custom animations
   - Dark scrollbar styling
   - Focus states
   - Smooth transitions

2. **dashboard/styles/animations.ts** (120 lines)
   ```typescript
   Export Framer Motion variants:
   - fadeIn, fadeOut
   - slideInUp, slideInDown, slideInLeft, slideInRight
   - scaleIn, scaleOut
   - bounceIn
   - stagger
   - rotateIn, rotateOut
   - shimmer (for loading states)

   Each variant has:
   - initial
   - animate
   - exit
   - transition with duration/easing
   ```

3. **dashboard/DESIGN_TOKENS.md** (200 lines)
   - Typography scale with px/rem values
   - Spacing scale (4px baseline)
   - 8px grid explanation
   - Border radius scale
   - Shadow depths
   - Color palette (hex, hsl, Tailwind)
   - Animation timing values

4. **dashboard/components/ui/README.md** (150 lines)
   - List all ShadCN components to install
   - Component installation commands
   - Custom component patterns
   - Composition examples
   - Prop naming conventions

5. **dashboard/tailwind.config.ts** (extend from fullstack-developer)
   - Dark theme colors
   - Custom spacing
   - Animation definitions
   - Plugin configuration

6. **dashboard/app/layout.tsx** (includes font imports)
   - Space Grotesk: @import
   - Inter: @import
   - Global styles application

7. **dashboard/THEME.md** (100 lines)
   - Dark theme philosophy
   - Color semantics
   - 3D depth approach
   - Typography hierarchy
   - Component spacing guidelines

**MCP Usage**:
- context7: Tailwind dark mode best practices, Framer Motion animations, design system patterns
- chrome-devtools: Verify dark theme rendering, test color contrast, validate animations

---

## BRIEF 4: frontend-developer

**Task**: API integration, WebSocket setup, custom hooks, authentication middleware

**Start**: Immediately after reading specs
**Duration**: 2.5 hours
**Deliverables**: 13 files

### Files to Create

1. **dashboard/lib/axios.ts** (50 lines)
   - Axios instance with baseURL
   - Request/response interceptors
   - Error handling
   - Timeout configuration

2. **dashboard/lib/socket.ts** (80 lines)
   - Socket.io client initialization
   - Connection/disconnection handlers
   - Auto-reconnect configuration
   - Event emitter/listener types

3. **dashboard/middleware.ts** (60 lines)
   - Password protection middleware
   - Cookie validation
   - Redirect logic
   - Public routes whitelist (/login)

4. **dashboard/app/(auth)/login/page.tsx** (100 lines)
   - Password form
   - Form submission handler
   - Cookie setting
   - Redirect to dashboard
   - Error handling

5. **dashboard/lib/api/businesses.ts** (100 lines)
   ```typescript
   Export functions:
   - getBusinesses(page, limit, filters)
   - getBusinessById(id)
   - getStats()
   - deleteBusiness(id)

   All with proper TypeScript types and error handling
   ```

6. **dashboard/lib/api/scraper.ts** (60 lines)
   ```typescript
   Export functions:
   - startScrape(location, radius, maxResults)
   - getScrapeStatus(jobId)
   ```

7. **dashboard/lib/api/enrichment.ts** (60 lines)
   ```typescript
   Export functions:
   - enrichBusiness(id)
   - enrichBatch(limit)
   ```

8. **dashboard/lib/api/outreach.ts** (60 lines)
   ```typescript
   Export functions:
   - generateOutreach(id)
   - getOutreach(id)
   ```

9. **dashboard/lib/hooks/useBusinesses.ts** (80 lines)
   - Fetch businesses with pagination
   - Integrate with Zustand store
   - Handle loading/error states
   - Listen to WebSocket updates

10. **dashboard/lib/hooks/useStats.ts** (80 lines)
    - Fetch stats
    - Listen to real-time updates via WebSocket
    - Update Zustand store on events

11. **dashboard/lib/hooks/useWebSocket.ts** (100 lines)
    - Manage socket connection
    - Provide emit/on helpers
    - Handle disconnection/reconnection
    - Return socket instance

12. **dashboard/lib/hooks/useScraper.ts** (80 lines)
    - Manage scraper state
    - Listen to scraping progress events
    - Handle completion/errors

13. **dashboard/lib/hooks/useEnrichment.ts** (80 lines)
    - Manage enrichment state
    - Listen to enrichment progress
    - Track batch operations

**MCP Usage**:
- context7: Socket.io client patterns, React Hook Form, axios interceptors, custom hooks best practices
- chrome-devtools: Test API calls to http://localhost:3000/api/*, verify Socket.io connection, test login flow

---

## BRIEF 5: code-reviewer

**Task**: Validate architecture, security, performance, establish testing strategy

**Start**: After Briefs 1-4 begin
**Duration**: 1.5 hours
**Deliverables**: 6 documentation files

### Files to Create

1. **dashboard/TYPESCRIPT_REPORT.md** (100 lines)
   - Verify strict mode in tsconfig.json
   - Check no `any` types
   - Validate component prop types
   - Document type coverage
   - List all type files and exports

2. **dashboard/SECURITY.md** (150 lines)
   - Password protection via middleware (not client-side)
   - Verify NEXT_PUBLIC_* env vars only
   - API baseURL configuration
   - Socket.io security review
   - CORS considerations
   - No secrets in code

3. **dashboard/PERFORMANCE.md** (150 lines)
   - Code splitting strategy
   - Image optimization
   - Font loading strategy
   - Component lazy loading approach
   - Zustand selector optimization
   - WebSocket event debouncing
   - Caching strategy

4. **dashboard/ERROR_HANDLING.md** (120 lines)
   - API error types and handling
   - Network error recovery
   - WebSocket disconnection handling
   - User-friendly error messages
   - Error logging approach

5. **dashboard/TESTING.md** (150 lines)
   - Phase 1: Manual testing with chrome-devtools
   - Phase 2: Unit tests (Jest)
   - Phase 3: Integration tests
   - Phase 4: E2E tests
   - Key test areas for each component/hook

6. **dashboard/CODE_QUALITY.md** (100 lines)
   - ESLint configuration review
   - Prettier formatting applied
   - TypeScript compilation check
   - Console warnings audit
   - Naming conventions
   - Modular design verification

**MCP Usage**:
- context7: Next.js 15 security patterns, TypeScript best practices, performance optimization
- chrome-devtools: Run performance traces, validate security headers, test responsive design

---

## Integration Checklist (After All Agents Complete)

- [ ] All 5 agents delivered their files
- [ ] Merge all files into `/dashboard` directory
- [ ] Copy .env.example to .env.local
- [ ] Run: `npm install` in dashboard directory
- [ ] Run: `npm run build` to verify compilation
- [ ] Run: `npm run dev` to start dev server
- [ ] Verify: No TypeScript errors
- [ ] Verify: No console errors on startup
- [ ] Verify: Dark theme renders correctly
- [ ] Verify: Login page accessible at /login
- [ ] Verify: Redirects to dashboard after password
- [ ] Verify: Socket.io connects (check console)
- [ ] Verify: API calls work (check Network tab)

---

## Success Metrics for Phase 1

✅ All files delivered complete and production-ready
✅ Zero TypeScript errors with strict mode
✅ All dependencies installed successfully
✅ Next.js dev server starts on localhost:3000
✅ Dark theme renders without issues
✅ Password protection functional
✅ API client configured for backend
✅ Socket.io client ready for connection
✅ No security vulnerabilities
✅ Code quality passes linting
✅ Performance baseline established
✅ Documentation complete and clear

---

## Phase 1 → Phase 2 Transition

After all agents complete and integration succeeds:
1. Create 4 Zustand stores (business, stats, scraper, enrichment)
2. Create Providers component (Zustand + Socket.io context)
3. Create layout components (Header, Sidebar, PageContainer)
4. Install all ShadCN components
5. Begin Phase 2: Core Components

**Estimated Phase 1 Duration**: 2-3 hours with parallel execution
**Estimated Phase 2 Duration**: 2-3 hours
**Estimated Phase 3 Duration**: 4-5 hours (4 features in parallel)
**Estimated Phase 4 Duration**: 2-3 hours

**Total Estimated Time**: 10-14 hours for complete MVP
