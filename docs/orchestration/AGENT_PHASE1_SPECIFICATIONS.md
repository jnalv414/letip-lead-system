# Phase 1: Specialist Agent Specifications

## Project Root
`/Volumes/HOME-EX/Users/justinnalven/.claude/projects/letip-lead-systen/letip-lead-system`

## Execution Model
**Execute ALL 5 agents in parallel** - they work independently on separate concerns

---

## AGENT 1: solutions-architect

### Primary Responsibility
Design data flow architecture, state management strategy, and TypeScript type system

### Deliverables

1. **TypeScript Type Definitions** (`App/FrontEnd/types/models.ts`)
   - Export all Business, Contact, EnrichmentLog, OutreachMessage types
   - API request/response interfaces
   - Component prop types
   - Event types for WebSocket

2. **Type Definitions** (`App/FrontEnd/types/api.ts`)
   - API endpoint response types
   - Pagination metadata
   - Error response types
   - Query parameter types

3. **Zustand Store Architecture** (`App/FrontEnd/stores/README.md`)
   - Describe 4 stores: businessStore, statsStore, scraperStore, enrichmentStore
   - Define state shape for each
   - List selector functions
   - Describe inter-store dependencies

4. **Data Flow Diagram** (ASCII art in `App/FrontEnd/ARCHITECTURE.md`)
   - Component → Hook → Store → API → WebSocket → Store → UI
   - Show Zustand stores as central state layer
   - Show Socket.io event flow

5. **TypeScript Configuration** (`App/FrontEnd/tsconfig.json`)
   - Strict mode enabled
   - Path aliases configured (@/components, @/lib, etc.)
   - React JSX runtime: react-jsx
   - Next.js 15 compatibility

### Key Decisions
- Use Zustand for global state (lighter than Redux/Recoil)
- Business data cached in store with manual invalidation on WebSocket updates
- Separate store for UI state (scraper progress, enrichment status)
- WebSocket events trigger store actions, not direct mutations

### MCP Requirements
- **context7**: Research Zustand patterns, state management best practices, Next.js data fetching strategies
- **chrome-devtools**: Not needed for this phase

---

## AGENT 2: fullstack-developer

### Primary Responsibility
Initialize Next.js 15 project, install dependencies, configure build system

### Deliverables

1. **Next.js 16 Project Initialization** (`App/FrontEnd/`)
   - Initialize with `create-next-app` or manual setup
   - TypeScript enabled
   - Tailwind CSS configured
   - App Router structure
   - Proper .gitignore

2. **Package.json** (`App/FrontEnd/package.json`)
   ```
   Dependencies:
   - next@16.0.0
   - react@19.0.0
   - react-dom@19.0.0
   - typescript@latest
   - @shadcn/ui components (base installation, don't install individual components yet)
   - tailwindcss@3.4.0
   - postcss
   - autoprefixer
   - framer-motion@latest
   - zustand@latest
   - socket.io-client@latest
   - axios@latest
   - react-hook-form@latest
   - zod@latest
   - lucide-react

   Dev Dependencies:
   - @types/node
   - @types/react
   - @types/react-dom
   - eslint
   - eslint-config-next
   - prettier
   - typescript-eslint
   ```

3. **Environment Configuration**
   - `App/FrontEnd/.env.example`:
     ```
     NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
     NEXT_PUBLIC_SOCKET_URL=http://localhost:3000
     DASHBOARD_PASSWORD=letip2025
     ```
   - `App/FrontEnd/.env.local` (development only, git-ignored)

4. **Folder Structure**
   ```
   app/
   ├── layout.tsx
   ├── page.tsx
   ├── (auth)/
   │   └── login/
   │       └── page.tsx
   └── App/FrontEnd/
       ├── layout.tsx
       ├── page.tsx
       ├── businesses/
       ├── scraper/
       └── enrichment/
   components/
   ├── ui/
   ├── App/FrontEnd/
   └── common/
   lib/
   ├── api/
   ├── hooks/
   └── utils.ts
   stores/
   types/
   styles/
   public/
   ```

5. **Next.js Configuration** (`App/FrontEnd/next.config.ts`)
   - Image optimization enabled
   - Turbopack configuration
   - API redirects to backend (optional)
   - Environment variable handling

6. **Tailwind Configuration** (`App/FrontEnd/tailwind.config.ts`)
   - Dark mode: class strategy
   - Extend theme with custom colors and spacing
   - Configure shadcn/ui preset
   - Custom animation definitions

7. **TypeScript Configuration** (`App/FrontEnd/tsconfig.json`)
   - Strict mode enabled
   - Path aliases: @/components, @/lib, @/types, @/stores, @/styles

8. **Post CSS Configuration** (`App/FrontEnd/postcss.config.js`)
   - Tailwind CSS
   - Autoprefixer

9. **ESLint & Prettier Configuration**
   - `.eslintrc.json` with Next.js recommended config
   - `.prettierrc` with consistent formatting

10. **Root Layout with Providers** (`App/FrontEnd/app/layout.tsx`)
    - Global Tailwind styles
    - Providers component (Zustand, Socket.io context)
    - HTML structure
    - Font imports (Space Grotesk, Inter)

### Key Decisions
- Use create-next-app with TypeScript for faster setup
- Tailwind dark mode with class strategy (explicit dark class)
- ShadCN/UI for component library
- All dependencies pinned to specific versions for consistency

### MCP Requirements
- **context7**: Get latest Next.js 16 setup, ShadCN installation guide, Tailwind configuration
- **chrome-devtools**: Test that project builds without errors and loads at localhost:3000

---

## AGENT 3: ux-designer

### Primary Responsibility
Design system, component library architecture, animations, dark theme

### Deliverables

1. **Tailwind Dark Theme Configuration** (extend in `App/FrontEnd/tailwind.config.ts`)
   ```javascript
   colors: {
     // Semantic colors
     background: 'hsl(240 10% 6%)',      // #0f0f0f
     surface: 'hsl(240 10% 10%)',         // #1a1a1a
     surface_hover: 'hsl(240 10% 15%)',   // #262626
     primary: 'hsl(217 91% 60%)',         // #3b82f6
     accent: 'hsl(217 91% 60%)',
     text: {
       primary: 'hsl(210 40% 98%)',      // #f1f5f9
       secondary: 'hsl(215 14% 58%)',    // #94a3b8
       tertiary: 'hsl(215 16% 47%)',     // #64748b
     },
     success: 'hsl(160 84% 39%)',         // #10b981
     warning: 'hsl(45 96% 56%)',          // #f59e0b
     error: 'hsl(0 84% 60%)',             // #ef4444
   }
   ```

2. **Component Library Structure** (`App/FrontEnd/components/ui/README.md`)
   - List all ShadCN components to be installed
   - Document custom component patterns
   - Define component prop naming conventions
   - Show composition examples

3. **Framer Motion Animation Library** (`App/FrontEnd/styles/animations.ts`)
   ```typescript
   Export animation variants for:
   - fadeIn, fadeOut
   - slideInUp, slideInDown, slideInLeft, slideInRight
   - scaleIn, scaleOut
   - bounceIn
   - stagger (for lists)
   - rotateIn, rotateOut
   - shimmer (for loading)
   ```

4. **Custom CSS** (`App/FrontEnd/styles/globals.css`)
   - Tailwind directives (@tailwind)
   - Custom animations
   - Scrollbar styling (dark)
   - Focus states for accessibility
   - Smooth transitions

5. **Design Tokens Documentation** (`App/FrontEnd/DESIGN_TOKENS.md`)
   - Typography scale (sizes: 12px, 14px, 16px, 18px, 24px, 32px)
   - Spacing scale (4px, 8px, 16px, 24px, 32px, 48px)
   - 8px baseline grid explanation
   - Border radius scale (4px, 8px, 12px, 16px)
   - Shadow depths (sm, md, lg, xl)
   - Color palette with hex/hsl values
   - Animation timing (fast: 150ms, normal: 300ms, slow: 500ms)

6. **Component Spacing Guide** (`App/FrontEnd/components/ui/README.md`)
   - Margin/padding conventions
   - Gap sizes for flexbox/grid
   - Container padding (px-4, px-6, px-8)
   - Section spacing (gap-8, gap-12)

7. **Font Configuration** (import in `App/FrontEnd/app/layout.tsx`)
   - Space Grotesk from Google Fonts (700 weight for headings)
   - Inter from Google Fonts (400, 500 weights for body)

8. **Storybook or Component Showcase Setup** (optional)
   - Basic structure for displaying components
   - Dark theme demonstration

### Key Decisions
- Use semantic color naming (background, surface, primary, text, success/warning/error)
- 8px baseline grid for all spacing
- Framer Motion for all animations (ease, duration consistent)
- Dark-first design (no light theme variant)
- 3D depth through drop shadows, not gradients

### MCP Requirements
- **context7**: Research Tailwind dark mode, Framer Motion animation patterns, color psychology for dark themes
- **chrome-devtools**: Validate dark theme colors rendering correctly, test contrast ratios

---

## AGENT 4: frontend-developer

### Primary Responsibility
API integration, WebSocket setup, custom hooks, HTTP client configuration

### Deliverables

1. **Axios Instance Configuration** (`App/FrontEnd/lib/axios.ts`)
   ```typescript
   Create axios instance with:
   - baseURL from env (NEXT_PUBLIC_API_BASE_URL)
   - Default headers
   - Error handling interceptor
   - Request/response types
   - Timeout configuration
   ```

2. **API Service Layer** (`App/FrontEnd/lib/api/`)
   ```
   Create files:
   - businesses.ts (getBusinesses, getBusinessById, getStats, deleteBusinesses)
   - scraper.ts (startScrape, getScrapeStatus)
   - enrichment.ts (enrichBusiness, enrichBatch)
   - outreach.ts (generateOutreach, getOutreach)

   Each file exports typed functions that:
   - Use axios instance
   - Have proper TypeScript signatures
   - Handle errors gracefully
   - Transform API responses to typed data
   ```

3. **Socket.io Client Setup** (`App/FrontEnd/lib/socket.ts`)
   ```typescript
   Create socket instance with:
   - NEXT_PUBLIC_SOCKET_URL from env
   - Auto-reconnect configuration
   - Event type definitions
   - Connection/disconnection handlers
   - Proper cleanup on unmount
   ```

4. **Custom Hooks** (`App/FrontEnd/lib/hooks/`)
   ```
   Create hooks:
   - useBusinesses() - fetch businesses with pagination/filtering
   - useStats() - fetch stats with real-time updates
   - useWebSocket() - manage socket connection, emit/listen
   - useScraper() - manage scraper state and events
   - useEnrichment() - manage enrichment state and events

   Each hook:
   - Uses Zustand store for state
   - Returns loading, error, data states
   - Handles WebSocket updates
   - Manages side effects with useEffect
   ```

5. **React Context for WebSocket** (optional, if socket needs global access)
   - `App/FrontEnd/components/common/SocketProvider.tsx`
   - Provides socket instance to all components
   - Handles connection state

6. **Error Handling Utilities** (`App/FrontEnd/lib/utils.ts`)
   - Error type guards
   - User-friendly error messages
   - Retry logic helpers

7. **Password Middleware** (`App/FrontEnd/middleware.ts`)
   ```typescript
   - Check for password cookie
   - Redirect to /login if missing
   - Allow /login route without password
   - Set cookie on successful login
   - 30-day expiry
   ```

8. **Login Page** (`App/FrontEnd/app/(auth)/login/page.tsx`)
   - Simple password form
   - Error handling
   - Redirect to dashboard on success
   - Minimal styling (just dark background + input)

### Key Decisions
- Use axios over fetch for interceptors and error handling
- Socket.io in global singleton pattern (not context)
- Hooks manage store updates on WebSocket events
- Password stored in httpOnly cookie for security
- API errors logged and shown to user

### MCP Requirements
- **context7**: Get Socket.io client setup patterns, React Hook Form best practices, axios interceptor examples
- **chrome-devtools**: Test API calls to localhost:3000, verify WebSocket connection, validate login flow

---

## AGENT 5: code-reviewer

### Primary Responsibility
Review architecture, security, performance, establish testing strategy

### Deliverables

1. **TypeScript Strictness Verification** (`App/FrontEnd/TYPESCRIPT_REPORT.md`)
   - Verify strict mode enabled in tsconfig.json
   - Check no `any` types in type definitions
   - Validate component prop types
   - Document type coverage percentage

2. **Security Assessment** (`App/FrontEnd/SECURITY.md`)
   - Password protection via middleware (not client-side)
   - Environment variables not exposed to client (except NEXT_PUBLIC_*)
   - API calls use baseURL, not hardcoded URLs
   - Socket.io has no sensitive data in client-side emits
   - CORS considerations for API calls
   - No secrets in code or comments

3. **Performance Optimization Strategy** (`App/FrontEnd/PERFORMANCE.md`)
   ```markdown
   - Code splitting (automatic with Next.js App Router)
   - Image optimization
   - Font optimization (self-hosted or Google Fonts)
   - Component lazy loading for routes
   - Zustand store selector optimization
   - Avoid unnecessary re-renders with useMemo/useCallback
   - WebSocket event debouncing
   - API request caching strategy
   ```

4. **Error Handling Best Practices** (`App/FrontEnd/ERROR_HANDLING.md`)
   - API error types and handling
   - Network error recovery
   - WebSocket disconnection handling
   - User-friendly error messages
   - Error logging/reporting

5. **Testing Strategy** (`App/FrontEnd/TESTING.md`)
   ```markdown
   Phases:
   1. Manual testing with chrome-devtools MCP
   2. Unit tests for utilities and hooks (Jest)
   3. Integration tests for API calls
   4. E2E tests for critical flows

   Key test areas:
   - API service functions
   - Custom hooks
   - Store state management
   - Component rendering
   - WebSocket event handling
   - Password protection
   ```

6. **Code Quality Checklist** (`App/FrontEnd/CODE_QUALITY.md`)
   - ESLint configuration without warnings
   - Prettier formatting applied
   - TypeScript compilation without errors
   - No console warnings in development
   - Consistent naming conventions
   - Modular component design
   - Reusable utility functions

7. **Performance Metrics Baseline** (`App/FrontEnd/METRICS.md`)
   - Establish baseline for:
     - Time to Interactive (TTI)
     - First Contentful Paint (FCP)
     - Largest Contentful Paint (LCP)
     - Core Web Vitals thresholds
     - Bundle size targets

8. **Accessibility Review** (`App/FrontEnd/ACCESSIBILITY.md`)
   - WCAG 2.1 AA compliance checklist
   - Keyboard navigation support
   - Screen reader testing
   - Color contrast verification
   - Focus management
   - ARIA labels where needed

### Key Decisions
- Strict TypeScript for type safety
- Environment variables properly isolated
- Error handling at API layer with user-friendly messages
- Performance measured with chrome-devtools MCP
- Security-first approach for password/API calls

### MCP Requirements
- **context7**: Research Next.js 15 security best practices, TypeScript strict mode guidelines
- **chrome-devtools**: Run performance traces, validate security headers, test responsive design

---

## Coordination Points

### After Phase 1 Completion

1. **Integration Checklist**
   - [ ] All TypeScript files compile without errors
   - [ ] All imports resolve correctly
   - [ ] Environment variables defined in .env.example
   - [ ] Next.js dev server starts on localhost:3000
   - [ ] Dark theme renders correctly
   - [ ] Password protection redirects to login
   - [ ] Socket.io connects to backend
   - [ ] API calls return typed data

2. **File Handoff Order**
   - Agent 1 (architect) → Types and store architecture
   - Agent 2 (fullstack) → Project initialization and package.json
   - Agent 3 (designer) → Tailwind config and design tokens
   - Agent 4 (frontend) → API client, hooks, middleware
   - Agent 5 (reviewer) → Validation and quality documentation

3. **Integration Process**
   - Merge all files into /dashboard directory
   - Run `npm install` to install all dependencies
   - Run `next build` to verify TypeScript compilation
   - Run `npm run dev` to start dev server
   - Verify no errors in console

### Interdependencies
- Agent 4 (hooks) depend on Agent 1 (types)
- Agent 2 (tailwind config) need input from Agent 3 (design tokens)
- Agent 4 (middleware) needs Agent 2 (next.config)
- Agent 5 (review) validates all other agents' work

---

## Success Criteria for Phase 1

✅ Next.js 15 project initialized and builds successfully
✅ All dependencies installed (npm install works)
✅ TypeScript strict mode with no errors
✅ Tailwind dark theme configured and working
✅ Environment variables properly defined
✅ API client configured to connect to backend
✅ Socket.io client ready for connection
✅ Custom hooks follow Zustand store patterns
✅ Password protection middleware in place
✅ No console errors on startup
✅ Dev server runs on localhost:3000 without issues
✅ All TypeScript types exported and importable
✅ ESLint passes without critical errors
✅ Security review completed with no vulnerabilities
✅ Performance baseline established

---

## Next Steps After Phase 1

Once all agents complete Phase 1:
1. Integrate all deliverables
2. Run full build and dev server test
3. Verify chrome-devtools MCP connections
4. Move to Phase 2: Core Components & Zustand Stores
5. Begin Phase 3: Feature pages (Dashboard, Businesses, Scraper, Enrichment)
