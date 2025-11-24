# Coding Prompt: Dashboard Scraper Interface (Frontend)

## Feature Description and Problem Solving

### Problem
The Le Tip Lead System backend has a fully functional Google Maps scraper API (`POST /api/scrape`) that uses Apify to discover businesses, but there is **no user interface** for:

1. **Initiating Scrapes**: Users cannot configure and start scraping sessions (location, radius, business type, result limits)
2. **Monitoring Progress**: No real-time visibility into scraping status (running, processing, completed)
3. **Viewing Results**: No way to see how many businesses were found, saved, or skipped
4. **Error Handling**: No user-friendly error messages when scraping fails
5. **History Tracking**: No record of previous scraping sessions

This forces users to interact with the API via curl/Postman, which is not scalable for business users.

### Solution
Build a **production-ready Scraper Interface** in the Next.js 16 dashboard that provides:

- **Intuitive Form**: Location input, radius slider, business type selector, max results input with validation
- **Real-Time Progress**: Live updates via WebSocket showing scraping status, found count, saved count
- **Results Display**: Beautiful results card showing success metrics, skipped duplicates, errors
- **Error Handling**: User-friendly error messages with retry capability
- **Responsive Design**: Mobile-first responsive layout with dark theme
- **Modern UX**: Framer Motion animations, loading states, success celebrations

**Tech Stack**:
- Next.js 16 (App Router, React 19.2)
- TypeScript (strict mode)
- ShadCN/UI components
- Tailwind CSS (dark theme)
- Zustand (state management)
- React Hook Form + Zod (form validation)
- Socket.io client (real-time updates)
- Framer Motion (animations)

---

## User Story

**As a** Le Tip network administrator
**I want** a beautiful, intuitive dashboard interface to scrape Google Maps for local businesses
**So that** I can easily discover new leads without using command-line tools or technical knowledge

**Acceptance:**
- I can enter a location (e.g., "Route 9, Freehold, NJ") and see autocomplete suggestions
- I can configure search radius (0.5-5 miles) with a visual slider
- I can optionally filter by business type (e.g., "restaurant", "plumber")
- I can set maximum results (1-500) with smart defaults (50)
- I see real-time progress as scraping happens (status, % complete, found count)
- I see results summary (total found, saved to database, skipped duplicates)
- I can retry failed scrapes with one click
- The interface is beautiful, fast, and works on mobile devices
- All interactions have smooth animations and loading states

---

## Solution and Approach Rationale

### Why This Architecture

**1. Vertical Slice Pattern**
- All scraper-related code lives in `features/scraper/` directory
- Self-contained: components, hooks, store, API calls
- Easy to maintain and test in isolation

**2. Zustand for State Management**
```typescript
// Why Zustand over Redux/Context API?
- Simpler API (no boilerplate)
- Better TypeScript support
- Automatic re-render optimization
- Works seamlessly with React 19.2
- Small bundle size (1kb)
```

**3. Socket.io for Real-Time Updates**
```typescript
// Why Socket.io over Server-Sent Events?
- Backend already uses Socket.io
- Bidirectional communication
- Automatic reconnection
- Battle-tested reliability
```

**4. React Hook Form + Zod**
```typescript
// Why React Hook Form + Zod over Formik?
- Better performance (fewer re-renders)
- Zod provides runtime type safety
- Matches backend validation (class-validator → Zod)
- Smaller bundle size
```

**5. ShadCN/UI Components**
```typescript
// Why ShadCN over Material-UI/Chakra?
- Copy-paste components (no dependency bloat)
- Full Tailwind customization
- Dark mode native
- Accessible by default (Radix UI primitives)
```

### Data Flow Architecture

```
User Action (Form Submit)
    ↓
ScraperForm validates with Zod schema
    ↓
scraperStore.startScrape() called
    ↓
API client: POST /api/scrape
    ↓
Backend starts Apify actor
    ↓
Socket.io emits scraping:progress events
    ↓
useWebSocket hook receives events
    ↓
scraperStore updates state
    ↓
Components re-render (progress bar, status text)
    ↓
Scraping completes
    ↓
Results displayed with celebration animation
    ↓
Stats updated via stats:updated WebSocket event
```

---

## Relevant Files to Read

### Core Backend Files (for API integration)

1. **`App/BackEnd/src/scraper/scraper.controller.ts:1-20`**
   - HTTP endpoint: `POST /api/scrape`
   - Request body: `ScrapeRequestDto`
   - Response shape: `{ success, found, saved, skipped, errors }`
   - **Key insight**: Synchronous response after scraping completes

2. **`App/BackEnd/src/scraper/dto/scrape-request.dto.ts:1-45`**
   - Request validation schema
   - **Required field**: `location` (string)
   - **Optional fields**: `radius` (0.5-5), `business_type` (string), `max_results` (1-500)
   - **Defaults**: radius=1, max_results=50

3. **`App/BackEnd/src/websocket/websocket.gateway.ts:49-52`**
   - WebSocket event: `scraping:progress`
   - **Payload shape**: `{ status, location, progress?, found?, saved?, skipped? }`
   - **Status values**: 'running', 'processing', 'completed', 'failed'

### Frontend Architecture Files

4. **`docs/planning/GlobalRuleSections.md:126-213`**
   - **Frontend vertical slice structure** (lines 128-198)
   - Feature directory pattern: `features/scraper/`
   - State management pattern: Zustand store per feature
   - WebSocket integration pattern

5. **`docs/App/FrontEnd/DASHBOARD_BUILD_PLAN.md:1-99`**
   - **Design system** (lines 70-99):
     - Colors: background=#0f0f0f, surface=#1a1a1a, accent=#3b82f6
     - Typography: Space Grotesk (headings), Inter (body)
     - Spacing: 8px baseline grid
     - Animations: Framer Motion variants
   - **Scraper Interface requirements** (lines 57-62)

6. **`CLAUDE.md:1-1150`** (critical sections)
   - **WebSocket Event Standards** (search for "WebSocket Event Standards")
   - **Error Handling Standards** (frontend section)
   - **Real-Time First principle** (Core Principles section)

### Similar Implementations (for reference)

7. **Look for existing dashboard features** (if any):
   - `App/FrontEnd/app/App/FrontEnd/page.tsx` - Stats dashboard pattern
   - `App/FrontEnd/features/stats/` - Stats feature slice example
   - `App/FrontEnd/lib/hooks/useWebSocket.ts` - WebSocket hook pattern
   - `App/FrontEnd/stores/statsStore.ts` - Zustand store pattern

---

## Researched Documentation Links

### Next.js 16 Documentation

**[Next.js 16 App Router](https://nextjs.org/docs/app)**

**Summary**: File-system based routing with server and client components. Use `'use client'` directive for interactive components.

**Key Patterns for Scraper UI**:
```typescript
// app/App/FrontEnd/scraper/page.tsx (Server Component by default)
export default function ScraperPage() {
  return <ScraperInterface />; // Client Component
}

// features/scraper/ScraperInterface.tsx (Client Component)
'use client';
export function ScraperInterface() {
  // Interactive form, WebSocket, state management
}
```

---

### ShadCN/UI Components Documentation

**[ShadCN/UI Form Components](https://ui.shadcn.com/docs/components/form)**

**Summary**: Accessible form components built with Radix UI primitives, styled with Tailwind CSS.

**Components We'll Use**:
- `<Form>` - React Hook Form wrapper
- `<Input>` - Text input with validation
- `<Slider>` - Radius selector (0.5-5 miles)
- `<Select>` - Business type dropdown
- `<Button>` - Submit button with loading state
- `<Progress>` - Progress bar for scraping status
- `<Card>` - Results display card
- `<Alert>` - Error messages

**Installation**:
```bash
npx shadcn-ui@latest add form input slider select button progress card alert
```

---

### React Hook Form + Zod Documentation

**[React Hook Form with Zod](https://react-hook-form.com/get-started#SchemaValidation)**

**Summary**: Performant form library with Zod schema validation.

**Form Schema Pattern**:
```typescript
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const scrapeFormSchema = z.object({
  location: z.string().min(3, 'Location must be at least 3 characters'),
  radius: z.number().min(0.5).max(5).default(1),
  business_type: z.string().optional(),
  max_results: z.number().min(1).max(500).default(50)
});

type ScrapeFormValues = z.infer<typeof scrapeFormSchema>;

const form = useForm<ScrapeFormValues>({
  resolver: zodResolver(scrapeFormSchema),
  defaultValues: {
    location: '',
    radius: 1,
    max_results: 50
  }
});
```

---

### Zustand State Management

**[Zustand Documentation](https://docs.pmnd.rs/zustand/getting-started/introduction)**

**Summary**: Lightweight state management with hooks-based API.

**Store Pattern for Scraper**:
```typescript
import { create } from 'zustand';

interface ScraperState {
  status: 'idle' | 'loading' | 'running' | 'success' | 'error';
  progress: number;
  result: ScraperResult | null;
  error: string | null;
  startScrape: (data: ScrapeFormValues) => Promise<void>;
  updateProgress: (progress: ScraperProgress) => void;
  reset: () => void;
}

export const useScraperStore = create<ScraperState>((set, get) => ({
  status: 'idle',
  progress: 0,
  result: null,
  error: null,
  startScrape: async (data) => {
    set({ status: 'loading' });
    // API call
  },
  updateProgress: (progress) => set({ progress: progress.percent }),
  reset: () => set({ status: 'idle', progress: 0, result: null, error: null })
}));
```

---

### Framer Motion Animations

**[Framer Motion](https://www.framer.com/motion/)**

**Summary**: Production-ready animation library for React.

**Animation Variants We'll Use**:
```typescript
const formVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3 }
  }
};

const resultsVariants = {
  hidden: { scale: 0.8, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: { type: 'spring', bounce: 0.4 }
  }
};

const celebrationVariants = {
  initial: { scale: 0 },
  animate: {
    scale: [0, 1.2, 1],
    rotate: [0, 10, -10, 0],
    transition: { duration: 0.6 }
  }
};
```

---

## Implementation Plan

### Foundational Work

1. **Install Required Dependencies**
   ```bash
   cd dashboard
   npm install zustand socket.io-client axios react-hook-form @hookform/resolvers/zod zod framer-motion
   ```

2. **Install ShadCN Components**
   ```bash
   npx shadcn-ui@latest add form input slider select button progress card alert badge
   ```

3. **Create Feature Directory Structure**
   ```bash
   mkdir -p features/scraper
   mkdir -p lib/api
   mkdir -p stores
   mkdir -p types
   ```

4. **Create Type Definitions**
   - File: `types/scraper.ts`
   - Define: `ScrapeRequest`, `ScrapeResponse`, `ScraperProgress`, `ScraperStatus`

5. **Set Up Zustand Store**
   - File: `stores/scraperStore.ts`
   - Initial state: idle status, empty progress
   - Actions: startScrape, updateProgress, reset, setError

---

### Core Implementation

6. **Create API Service Layer**
   - File: `lib/api/scraper.ts`
   - Function: `startScrape(data: ScrapeRequest): Promise<ScrapeResponse>`
   - Use axios instance with baseURL from env
   - Handle errors and return typed response

7. **Create WebSocket Hook**
   - File: `lib/hooks/useWebSocket.ts` (if doesn't exist)
   - Or extend existing useWebSocket to listen for `scraping:progress`
   - Update scraperStore on progress events

8. **Create Zod Validation Schema**
   - File: `features/scraper/schemas.ts`
   - Define scrapeFormSchema matching backend DTO
   - Export type: `ScrapeFormValues`

9. **Build ScraperForm Component**
   - File: `features/scraper/ScraperForm.tsx`
   - Use ShadCN Form + React Hook Form
   - Fields:
     - Location (Input with placeholder "Route 9, Freehold, NJ")
     - Radius (Slider 0.5-5 miles, default 1)
     - Business Type (Input, optional, placeholder "restaurant, plumber, etc.")
     - Max Results (Input number, min 1, max 500, default 50)
   - Submit button with loading state
   - Form validation with Zod
   - Call scraperStore.startScrape() on submit

10. **Build ProgressDisplay Component**
    - File: `features/scraper/ProgressDisplay.tsx`
    - Show current status (running, processing, completed)
    - Progress bar (ShadCN Progress component)
    - Live counts (found, saved, skipped)
    - Framer Motion animations for status changes

11. **Build ResultsCard Component**
    - File: `features/scraper/ResultsCard.tsx`
    - Display final results:
      - Total found
      - Saved to database
      - Skipped (duplicates)
      - Errors (if any)
    - Celebration animation when successful
    - Retry button on error

12. **Build Main ScraperInterface Component**
    - File: `features/scraper/ScraperInterface.tsx`
    - Compose: ScraperForm + ProgressDisplay + ResultsCard
    - Conditional rendering based on scraperStore.status
    - WebSocket integration via useWebSocket hook
    - Framer Motion layout animations

13. **Create Scraper Page Route**
    - File: `app/App/FrontEnd/scraper/page.tsx`
    - Import and render ScraperInterface
    - Add page metadata (title, description)

---

### Integration Work

14. **Connect WebSocket to Store**
    - In useWebSocket hook or ScraperInterface
    - Listen for `scraping:progress` events
    - Call scraperStore.updateProgress(event.data)

15. **Add Error Handling**
    - Catch API errors in scraperStore.startScrape()
    - Set error state with user-friendly messages
    - Display errors in ResultsCard with retry button

16. **Add Loading States**
    - Button loading spinner while submitting
    - Disable form fields during scraping
    - Show skeleton loaders for results

17. **Add Success Feedback**
    - Toast notification on successful scrape
    - Confetti animation (optional)
    - Update stats (trigger stats:updated event)

18. **Add Mobile Responsiveness**
    - Test on mobile viewport
    - Stack form fields vertically on small screens
    - Adjust card layouts for mobile

19. **Add Keyboard Shortcuts**
    - Enter to submit form
    - Escape to reset

---

### Step-by-Step Task List

**Phase 1: Setup & Configuration (5 tasks)**

1. [ ] Install dependencies: `zustand socket.io-client axios react-hook-form @hookform/resolvers/zod zod framer-motion`
2. [ ] Install ShadCN components: `form input slider select button progress card alert badge`
3. [ ] Create feature directory: `features/scraper/` with subdirectories
4. [ ] Create type definitions in `types/scraper.ts`
5. [ ] Set up Zustand store in `stores/scraperStore.ts` with initial state

**Phase 2: API Integration (3 tasks)**

6. [ ] Create API service: `lib/api/scraper.ts` with `startScrape()` function
7. [ ] Add axios instance configuration (baseURL, error interceptors)
8. [ ] Create or extend `lib/hooks/useWebSocket.ts` for scraping events

**Phase 3: Form Implementation (6 tasks)**

9. [ ] Create Zod schema: `features/scraper/schemas.ts` (location, radius, business_type, max_results)
10. [ ] Build ScraperForm component with React Hook Form + ShadCN Form
11. [ ] Add location input field with validation
12. [ ] Add radius slider (0.5-5 miles) with live value display
13. [ ] Add business type input (optional)
14. [ ] Add max results input with validation (1-500)

**Phase 4: Progress & Results UI (5 tasks)**

15. [ ] Build ProgressDisplay component with status badges
16. [ ] Add progress bar with percentage
17. [ ] Add live count displays (found, saved, skipped)
18. [ ] Build ResultsCard component with metrics
19. [ ] Add celebration animation for successful scrapes

**Phase 5: Integration & Polish (5 tasks)**

20. [ ] Connect WebSocket to scraperStore in ScraperInterface
21. [ ] Add error handling and retry functionality
22. [ ] Add loading states (button spinner, disabled fields)
23. [ ] Add toast notifications (success, error)
24. [ ] Test mobile responsiveness

**Phase 6: Testing (3 tasks)**

25. [ ] Write unit tests for scraperStore (Vitest/Jest)
26. [ ] Write component tests for ScraperForm (React Testing Library)
27. [ ] Manual E2E test: submit form → watch progress → verify results

**Phase 7: Documentation (2 tasks)**

28. [ ] Add JSDoc comments to all components
29. [ ] Update README with scraper feature usage

---

## Testing Strategy

### Unit Tests

**File**: `features/scraper/scraperStore.test.ts`

**Test Cases**:

1. **Test: Initial state is correct**
   ```typescript
   it('should have idle status on init', () => {
     const { status, progress, result, error } = useScraperStore.getState();
     expect(status).toBe('idle');
     expect(progress).toBe(0);
     expect(result).toBeNull();
     expect(error).toBeNull();
   });
   ```

2. **Test: startScrape sets loading state**
   ```typescript
   it('should set loading state when scrape starts', async () => {
     const mockApi = jest.spyOn(api, 'startScrape').mockResolvedValue({...});
     await useScraperStore.getState().startScrape({ location: 'Test' });
     expect(useScraperStore.getState().status).toBe('loading');
   });
   ```

3. **Test: updateProgress updates progress value**
   ```typescript
   it('should update progress when event received', () => {
     useScraperStore.getState().updateProgress({ status: 'running', progress: 50 });
     expect(useScraperStore.getState().progress).toBe(50);
   });
   ```

4. **Test: API success sets success state**
   ```typescript
   it('should set success state on successful scrape', async () => {
     const mockResult = { success: true, found: 10, saved: 8, skipped: 2 };
     jest.spyOn(api, 'startScrape').mockResolvedValue(mockResult);

     await useScraperStore.getState().startScrape({ location: 'Test' });

     expect(useScraperStore.getState().status).toBe('success');
     expect(useScraperStore.getState().result).toEqual(mockResult);
   });
   ```

5. **Test: API error sets error state**
   ```typescript
   it('should set error state on API failure', async () => {
     jest.spyOn(api, 'startScrape').mockRejectedValue(new Error('Network error'));

     await useScraperStore.getState().startScrape({ location: 'Test' });

     expect(useScraperStore.getState().status).toBe('error');
     expect(useScraperStore.getState().error).toBe('Network error');
   });
   ```

6. **Test: reset clears state**
   ```typescript
   it('should reset state to initial', () => {
     useScraperStore.setState({ status: 'success', progress: 100, result: {...} });
     useScraperStore.getState().reset();

     expect(useScraperStore.getState().status).toBe('idle');
     expect(useScraperStore.getState().progress).toBe(0);
   });
   ```

---

### Component Tests

**File**: `features/scraper/ScraperForm.test.tsx`

**Test Cases**:

1. **Test: Form renders with all fields**
   ```typescript
   it('should render all form fields', () => {
     render(<ScraperForm />);
     expect(screen.getByLabelText(/location/i)).toBeInTheDocument();
     expect(screen.getByLabelText(/radius/i)).toBeInTheDocument();
     expect(screen.getByLabelText(/business type/i)).toBeInTheDocument();
     expect(screen.getByLabelText(/max results/i)).toBeInTheDocument();
   });
   ```

2. **Test: Validates required location field**
   ```typescript
   it('should show error when location is empty', async () => {
     render(<ScraperForm />);
     fireEvent.click(screen.getByText(/start scraping/i));

     await waitFor(() => {
       expect(screen.getByText(/location must be at least 3 characters/i)).toBeInTheDocument();
     });
   });
   ```

3. **Test: Validates radius range**
   ```typescript
   it('should not allow radius outside 0.5-5 range', async () => {
     render(<ScraperForm />);
     const radiusInput = screen.getByLabelText(/radius/i);

     fireEvent.change(radiusInput, { target: { value: '10' } });
     fireEvent.blur(radiusInput);

     await waitFor(() => {
       expect(screen.getByText(/radius must be between 0.5 and 5/i)).toBeInTheDocument();
     });
   });
   ```

4. **Test: Calls startScrape on submit**
   ```typescript
   it('should call startScrape with form values', async () => {
     const startScrapeMock = jest.fn();
     jest.spyOn(useScraperStore, 'getState').mockReturnValue({ startScrape: startScrapeMock, ... });

     render(<ScraperForm />);
     fireEvent.change(screen.getByLabelText(/location/i), { target: { value: 'Freehold, NJ' } });
     fireEvent.click(screen.getByText(/start scraping/i));

     await waitFor(() => {
       expect(startScrapeMock).toHaveBeenCalledWith({
         location: 'Freehold, NJ',
         radius: 1,
         max_results: 50
       });
     });
   });
   ```

5. **Test: Disables form during scraping**
   ```typescript
   it('should disable form fields when status is loading', () => {
     jest.spyOn(useScraperStore, 'getState').mockReturnValue({ status: 'loading', ... });

     render(<ScraperForm />);
     expect(screen.getByLabelText(/location/i)).toBeDisabled();
     expect(screen.getByText(/start scraping/i)).toBeDisabled();
   });
   ```

---

### Integration Tests

**File**: `features/scraper/ScraperInterface.test.tsx`

**Test Cases**:

1. **Test: Full scraping flow**
   ```typescript
   it('should complete full scraping flow', async () => {
     // Mock API
     jest.spyOn(api, 'startScrape').mockResolvedValue({
       success: true, found: 10, saved: 8, skipped: 2
     });

     render(<ScraperInterface />);

     // Fill form
     fireEvent.change(screen.getByLabelText(/location/i), { target: { value: 'Test' } });
     fireEvent.click(screen.getByText(/start scraping/i));

     // Wait for loading
     await waitFor(() => {
       expect(screen.getByText(/scraping in progress/i)).toBeInTheDocument();
     });

     // Wait for results
     await waitFor(() => {
       expect(screen.getByText(/8 businesses saved/i)).toBeInTheDocument();
     });
   });
   ```

2. **Test: WebSocket progress updates**
   ```typescript
   it('should update progress bar when WebSocket event received', async () => {
     const mockSocket = createMockSocket();
     render(<ScraperInterface socket={mockSocket} />);

     // Emit progress event
     act(() => {
       mockSocket.emit('scraping:progress', {
         status: 'running',
         progress: 50,
         found: 5
       });
     });

     expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '50');
     expect(screen.getByText(/5 businesses found/i)).toBeInTheDocument();
   });
   ```

---

### E2E Tests

**Manual Test Checklist**:

1. [ ] Navigate to /App/FrontEnd/scraper
2. [ ] Form renders with all fields and proper styling
3. [ ] Enter location "Route 9, Freehold, NJ"
4. [ ] Adjust radius slider to 2 miles
5. [ ] Enter business type "restaurant"
6. [ ] Set max results to 20
7. [ ] Click "Start Scraping" button
8. [ ] Button shows loading spinner
9. [ ] Form fields become disabled
10. [ ] Progress bar appears and animates
11. [ ] Status text updates (running → processing → completed)
12. [ ] Results card appears with metrics
13. [ ] Celebration animation plays
14. [ ] Toast notification shows success message
15. [ ] Stats dashboard updates with new business count
16. [ ] Click "Scrape Again" button
17. [ ] Form resets to default values
18. [ ] Test mobile viewport - all elements responsive

---

### Edge Cases for Testing

1. **Empty Apify results**
   - **Scenario**: API returns `{ found: 0, saved: 0, skipped: 0 }`
   - **Expected**: Show "No businesses found" message with helpful text
   - **Test**: Mock API response, verify UI message

2. **All businesses are duplicates**
   - **Scenario**: API returns `{ found: 10, saved: 0, skipped: 10 }`
   - **Expected**: Show "All businesses already in database" with option to expand radius
   - **Test**: Mock API response, verify message and radius suggestion

3. **Network error during scraping**
   - **Scenario**: API call fails with network error
   - **Expected**: Error card with "Check internet connection" + retry button
   - **Test**: Mock axios to reject, verify error UI

4. **WebSocket disconnection during scraping**
   - **Scenario**: Socket disconnects mid-scrape
   - **Expected**: Show reconnection message, maintain progress state
   - **Test**: Disconnect socket, verify UI handles gracefully

5. **Backend validation error**
   - **Scenario**: API returns 400 with validation error (e.g., invalid location)
   - **Expected**: Show field-specific error message
   - **Test**: Mock 400 response, verify error display

6. **Very long location string**
   - **Scenario**: User enters 200+ character location
   - **Expected**: Truncate display, validate max length
   - **Test**: Enter long string, verify validation

7. **Rapid form submissions**
   - **Scenario**: User clicks submit multiple times quickly
   - **Expected**: Only one scrape initiated, subsequent clicks ignored
   - **Test**: Click submit 5 times in 1 second, verify single API call

8. **Browser refresh during scraping**
   - **Scenario**: User refreshes page while scraping in progress
   - **Expected**: Scraping state lost, form resets (acceptable)
   - **Test**: Refresh page, verify no errors

9. **Mobile keyboard obscures form**
   - **Scenario**: Mobile keyboard opens when typing location
   - **Expected**: Form scrolls to keep active field visible
   - **Test**: Test on mobile device, verify scroll behavior

10. **Slow API response (>30s)**
    - **Scenario**: Apify actor takes long time (30-60s)
    - **Expected**: Progress bar shows "still running", no timeout error
    - **Test**: Mock delayed response, verify UI patience

---

## Acceptance Criteria

### Functional Requirements

- ✅ **AC1**: User can enter location and submit form to start scraping
- ✅ **AC2**: Form validates all fields according to Zod schema (location required, radius 0.5-5, max_results 1-500)
- ✅ **AC3**: API call is made to `POST /api/scrape` with correct request body
- ✅ **AC4**: Real-time progress updates received via WebSocket `scraping:progress` events
- ✅ **AC5**: Progress bar shows accurate percentage (0-100%)
- ✅ **AC6**: Live counts displayed (found, saved, skipped)
- ✅ **AC7**: Results card shows final metrics after completion
- ✅ **AC8**: Error handling displays user-friendly messages
- ✅ **AC9**: Retry button appears on error and resets form
- ✅ **AC10**: Form resets after successful scrape (via "Scrape Again" button)

### UI/UX Requirements

- ✅ **AC11**: Dark theme matches dashboard design system (background=#0f0f0f, accent=#3b82f6)
- ✅ **AC12**: All animations smooth (Framer Motion with 300ms duration)
- ✅ **AC13**: Form fields have proper labels, placeholders, and help text
- ✅ **AC14**: Submit button shows loading spinner during scraping
- ✅ **AC15**: Form fields disabled during scraping
- ✅ **AC16**: Mobile responsive (stacks vertically on <768px)
- ✅ **AC17**: Keyboard accessible (Tab navigation, Enter to submit)
- ✅ **AC18**: Success celebration animation plays on completion
- ✅ **AC19**: Toast notification shows on success/error

### Performance Requirements

- ✅ **AC20**: Form renders in <100ms
- ✅ **AC21**: WebSocket events update UI in <50ms
- ✅ **AC22**: No layout shift during progress updates
- ✅ **AC23**: Animations run at 60fps

### Code Quality Requirements

- ✅ **AC24**: TypeScript strict mode with no `any` types
- ✅ **AC25**: All components have proper TypeScript interfaces
- ✅ **AC26**: Zustand store has type-safe actions and state
- ✅ **AC27**: ESLint passes with zero warnings
- ✅ **AC28**: Prettier formatting applied
- ✅ **AC29**: Unit test coverage >80% for scraperStore
- ✅ **AC30**: Component tests for ScraperForm with >70% coverage

---

## Validation Commands

### 1. Install Dependencies

```bash
cd dashboard
npm install
```

**Expected**: No errors, all dependencies installed

---

### 2. TypeScript Compilation

```bash
npx tsc --noEmit
```

**Expected**: `✓ Compiled successfully with 0 errors`

---

### 3. Linting

```bash
npm run lint
```

**Expected**: No errors or warnings

---

### 4. Code Formatting

```bash
npm run format
git diff
```

**Expected**: No uncommitted formatting changes

---

### 5. Unit Tests

```bash
npm test features/scraper/scraperStore.test.ts
```

**Expected**: All tests pass

```bash
npm run test:coverage -- features/scraper
```

**Expected**: Coverage >80% for scraperStore.ts

---

### 6. Component Tests

```bash
npm test features/scraper/ScraperForm.test.tsx
```

**Expected**: All tests pass

---

### 7. Build Production Bundle

```bash
npm run build
```

**Expected**: Successful compilation with no errors

---

### 8. Manual UI Test

**Start dev server**:
```bash
npm run dev
```

**Navigate to**: `http://localhost:3000/App/FrontEnd/scraper`

**Checklist**:
- [ ] Page loads without errors
- [ ] Form renders with dark theme
- [ ] All fields have proper labels and placeholders
- [ ] Radius slider works (0.5-5 miles)
- [ ] Submit button is styled correctly

---

### 9. API Integration Test

**Prerequisites**: Backend running at `http://localhost:3000`

**Steps**:
1. Open browser DevTools → Network tab
2. Fill in form:
   - Location: "Route 9, Freehold, NJ"
   - Radius: 1
   - Business Type: (leave empty)
   - Max Results: 5
3. Click "Start Scraping"
4. Observe Network tab

**Expected**:
- POST request to `http://localhost:3000/api/scrape`
- Request body:
  ```json
  {
    "location": "Route 9, Freehold, NJ",
    "radius": 1,
    "max_results": 5
  }
  ```
- Response 200 with:
  ```json
  {
    "success": true,
    "found": 5,
    "saved": 3,
    "skipped": 2,
    "errors": []
  }
  ```

---

### 10. WebSocket Event Test

**Prerequisites**: Backend running with WebSocket support

**Steps**:
1. Open browser DevTools → Console
2. Start scraping
3. Watch console for WebSocket messages

**Expected Console Logs**:
```
WebSocket connected
Received scraping:progress { status: 'running', progress: 0 }
Received scraping:progress { status: 'running', progress: 25, found: 1 }
Received scraping:progress { status: 'running', progress: 50, found: 3 }
Received scraping:progress { status: 'processing', found: 5 }
Received scraping:progress { status: 'completed', saved: 3, skipped: 2 }
Received stats:updated { totalBusinesses: 108, ... }
```

---

### 11. Responsive Design Test

**Chrome DevTools → Device Toolbar**

**Test Viewports**:
- [ ] Mobile (375px): Form stacks vertically
- [ ] Tablet (768px): Form maintains 2-column layout
- [ ] Desktop (1440px): Optimal spacing

**Expected**: No horizontal scrolling, all elements visible and usable

---

### 12. Accessibility Test

**Chrome DevTools → Lighthouse → Accessibility**

**Run audit**:
```bash
npm run build
npm run start
# Open http://localhost:3000/App/FrontEnd/scraper
# Run Lighthouse
```

**Expected**: Accessibility score >90

**Manual checks**:
- [ ] Tab navigation works (focus visible)
- [ ] All form fields have labels
- [ ] Error messages have proper ARIA attributes
- [ ] Color contrast meets WCAG AA standards

---

### 13. Error Handling Test

**Simulate API error**:
1. Stop backend server
2. Fill form and submit
3. Observe error UI

**Expected**:
- Error card appears
- Message: "Unable to connect to server. Please try again."
- Retry button visible
- No console errors (error caught gracefully)

**Simulate validation error**:
1. Leave location empty
2. Click submit

**Expected**:
- Red border on location field
- Error message: "Location must be at least 3 characters"
- Form not submitted

---

### 14. Performance Test

**Chrome DevTools → Performance**

1. Record performance while submitting form
2. Stop recording
3. Analyze

**Expected**:
- First paint <100ms
- Layout shifts: 0
- Animation frame rate: 60fps
- No long tasks (>50ms)

---

### 15. Integration Test with Stats Dashboard

**Prerequisites**: Stats dashboard implemented

**Steps**:
1. Open stats dashboard in one tab
2. Open scraper in another tab
3. Complete scraping session
4. Switch back to stats dashboard

**Expected**:
- Stats dashboard automatically updates (via stats:updated WebSocket event)
- Total businesses count increases by number of saved businesses
- No page refresh required

---

## Summary

This implementation creates a **production-ready scraper interface** in the Next.js 16 dashboard with:

**Frontend Stack**:
- ✅ Next.js 16 (App Router, React 19.2, Turbopack)
- ✅ TypeScript strict mode
- ✅ ShadCN/UI components (Form, Input, Slider, Progress, Card, Alert)
- ✅ Tailwind CSS dark theme
- ✅ Zustand state management
- ✅ React Hook Form + Zod validation
- ✅ Socket.io client for real-time updates
- ✅ Framer Motion animations

**User Experience**:
- ✅ Intuitive form with validation
- ✅ Real-time progress tracking
- ✅ Beautiful results display
- ✅ Error handling with retry
- ✅ Mobile responsive
- ✅ Accessibility compliant
- ✅ Smooth animations

**Code Quality**:
- ✅ Vertical slice architecture
- ✅ Type-safe throughout
- ✅ Unit + component + integration tests
- ✅ ESLint + Prettier compliant
- ✅ Well-documented with JSDoc

**Impact**: Enables non-technical users to discover new leads through an elegant, real-time interface without touching the API directly.
