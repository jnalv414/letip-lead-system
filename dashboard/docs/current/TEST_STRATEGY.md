# LeTip Lead System Dashboard - Test Strategy & TDD Implementation

## Test Suite Architecture

### 1. Test Framework Stack

- **Unit/Integration Tests**: Jest + React Testing Library
- **Visual Regression**: Playwright with screenshots
- **E2E Tests**: Playwright
- **WebSocket Testing**: Mock Socket.io client
- **API Mocking**: MSW (Mock Service Worker)
- **Coverage Tool**: Jest Coverage Reports
- **CI/CD**: GitHub Actions with parallel test execution

### 2. Directory Structure

```
dashboard/
├── __tests__/                      # Global test utilities
│   ├── setup/
│   │   ├── test-utils.tsx         # Custom render with providers
│   │   ├── mock-data.ts           # Centralized mock data
│   │   ├── websocket-mock.ts      # WebSocket test utilities
│   │   └── msw-handlers.ts        # API mock handlers
│   └── e2e/
│       ├── dashboard.spec.ts      # Full dashboard E2E
│       └── real-time.spec.ts      # WebSocket integration E2E
├── components/
│   ├── ui/
│   │   └── __tests__/
│   │       ├── card.test.tsx
│   │       ├── badge.test.tsx
│   │       └── skeleton.test.tsx
│   ├── charts/
│   │   └── __tests__/
│   │       ├── area-chart.test.tsx
│   │       ├── bar-chart.test.tsx
│   │       └── sparkline.test.tsx
│   └── features/
│       └── __tests__/
│           ├── business-growth-chart.test.tsx
│           ├── lead-sources-chart.test.tsx
│           ├── calendar-widget.test.tsx
│           ├── top-businesses-list.test.tsx
│           ├── pipeline-bubbles.test.tsx
│           ├── geographic-stats.test.tsx
│           └── activity-feed.test.tsx
└── hooks/
    └── __tests__/
        ├── use-business-data.test.ts
        ├── use-websocket.test.ts
        └── use-chart-data.test.ts
```

## 3. Test Categories & Coverage Targets

### Component Test Coverage Requirements

| Component Type | Unit Tests | Integration | Visual | Accessibility | Target Coverage |
|---------------|------------|-------------|---------|--------------|-----------------|
| Foundation UI | ✅ | ✅ | ✅ | ✅ | 95% |
| Charts | ✅ | ✅ | ✅ | ✅ | 90% |
| Features | ✅ | ✅ | ✅ | ✅ | 85% |
| Hooks | ✅ | ✅ | - | - | 95% |
| Utils | ✅ | - | - | - | 100% |

### 4. Color Scheme Validation Strategy

Every component test MUST validate the 60-30-10 color distribution:

```typescript
// Test utilities for color validation
export const ColorScheme = {
  charcoal: {
    primary: '#1F2937',    // 60% - backgrounds
    secondary: '#111827',  // darker variant
    text: '#9CA3AF'       // text on charcoal
  },
  teal: {
    primary: '#14B8A6',    // 30% - interactive elements
    secondary: '#0F766E',  // darker variant
    accent: '#5EEAD4'     // lighter variant
  },
  orange: {
    primary: '#FB923C',    // 10% - highlights/CTAs
    secondary: '#EA580C',  // darker variant
    accent: '#FED7AA'     // lighter variant
  }
} as const;

// Helper to validate color usage
export function validateColorDistribution(container: HTMLElement) {
  const styles = window.getComputedStyle(container);
  const backgroundColor = styles.backgroundColor;
  const borderColor = styles.borderColor;

  // Returns validation object
  return {
    hasCharcoalBackground: backgroundColor.includes(ColorScheme.charcoal.primary),
    hasTealAccent: /* check for teal elements */,
    hasOrangeHighlight: /* check for orange elements */,
    meetsWCAG: /* contrast ratio check */
  };
}
```

## 5. Mock Data Strategy

### Centralized Mock Factory

```typescript
// __tests__/setup/mock-data.ts
export const MockDataFactory = {
  // Business entity mocks
  business: (overrides = {}) => ({
    id: 1,
    name: 'ABC Plumbing',
    city: 'Freehold',
    industry: 'plumbing',
    website: 'https://abcplumbing.com',
    phone: '732-555-0100',
    address: '123 Main St, Freehold, NJ',
    enrichment_status: 'enriched',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides
  }),

  // Chart data mocks
  chartData: {
    growth: [
      { date: '2024-01', businesses: 120, contacts: 340 },
      { date: '2024-02', businesses: 145, contacts: 412 },
      { date: '2024-03', businesses: 178, contacts: 523 },
    ],
    sources: [
      { source: 'Google Maps', count: 234, percentage: 45 },
      { source: 'Direct Entry', count: 156, percentage: 30 },
      { source: 'Referrals', count: 130, percentage: 25 },
    ],
    pipeline: [
      { stage: 'New', count: 45, value: 125000 },
      { stage: 'Qualified', count: 23, value: 89000 },
      { stage: 'Proposal', count: 12, value: 67000 },
      { stage: 'Closed', count: 8, value: 45000 },
    ]
  },

  // WebSocket event mocks
  wsEvent: (type: string, data: any) => ({
    timestamp: new Date().toISOString(),
    type,
    data
  })
};
```

## 6. WebSocket Testing Approach

### Mock Socket Implementation

```typescript
// __tests__/setup/websocket-mock.ts
export class MockSocket {
  private listeners: Map<string, Set<Function>> = new Map();
  public connected = true;

  on(event: string, handler: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);
  }

  emit(event: string, data: any) {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.forEach(handler => handler(data));
    }
  }

  // Simulate server emission for testing
  simulateServerEvent(event: string, data: any) {
    this.emit(event, data);
  }

  disconnect() {
    this.connected = false;
    this.listeners.clear();
  }
}

// Test helper
export function createMockSocketContext() {
  const socket = new MockSocket();
  return {
    socket,
    simulateBusinessUpdate: (business: any) => {
      socket.simulateServerEvent('business:updated', {
        timestamp: new Date().toISOString(),
        type: 'business:updated',
        data: business
      });
    },
    simulateStatsUpdate: (stats: any) => {
      socket.simulateServerEvent('stats:updated', {
        timestamp: new Date().toISOString(),
        type: 'stats:updated',
        data: stats
      });
    }
  };
}
```

## 7. Test Implementation Patterns

### Pattern 1: Component with Real-time Updates

```typescript
describe('Component with WebSocket', () => {
  let mockSocket: MockSocket;

  beforeEach(() => {
    mockSocket = new MockSocket();
    jest.spyOn(io, 'connect').mockReturnValue(mockSocket);
  });

  it('should update when receiving WebSocket event', async () => {
    const { rerender } = render(<ActivityFeed />);

    // Simulate WebSocket event
    act(() => {
      mockSocket.simulateServerEvent('business:created', {
        data: MockDataFactory.business()
      });
    });

    // Verify update
    await waitFor(() => {
      expect(screen.getByText('ABC Plumbing')).toBeInTheDocument();
    });
  });
});
```

### Pattern 2: Chart Component Testing

```typescript
describe('Chart Component', () => {
  it('should apply correct color scheme', () => {
    render(<BusinessGrowthChart data={MockDataFactory.chartData.growth} />);

    const chart = screen.getByTestId('business-growth-chart');
    const validation = validateColorDistribution(chart);

    expect(validation.hasCharcoalBackground).toBe(true);
    expect(validation.hasTealAccent).toBe(true);
    expect(validation.meetsWCAG).toBe(true);
  });

  it('should handle empty data gracefully', () => {
    render(<BusinessGrowthChart data={[]} />);

    expect(screen.getByText('No data available')).toBeInTheDocument();
    expect(screen.getByTestId('empty-chart-placeholder')).toHaveClass('bg-charcoal-primary');
  });
});
```

### Pattern 3: Accessibility Testing

```typescript
describe('Accessibility', () => {
  it('should support keyboard navigation', async () => {
    const user = userEvent.setup();
    render(<TopBusinessesList businesses={mockBusinesses} />);

    // Tab through items
    await user.tab();
    expect(screen.getByRole('button', { name: /first business/i })).toHaveFocus();

    // Activate with Enter
    await user.keyboard('{Enter}');
    expect(mockOnSelect).toHaveBeenCalledWith(mockBusinesses[0]);
  });

  it('should have proper ARIA labels', () => {
    render(<PipelineBubbles stages={mockStages} />);

    expect(screen.getByRole('region', { name: /sales pipeline/i })).toBeInTheDocument();
    expect(screen.getAllByRole('progressbar')).toHaveLength(mockStages.length);
  });
});
```

## 8. CI/CD Integration

### GitHub Actions Configuration

```yaml
name: Dashboard Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [20.x]

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node-version }}

      - name: Install dependencies
        run: |
          cd dashboard
          npm ci

      - name: Run Unit Tests
        run: |
          cd dashboard
          npm run test:coverage

      - name: Run E2E Tests
        run: |
          cd dashboard
          npx playwright install
          npm run test:e2e

      - name: Upload Coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./dashboard/coverage/lcov.info
          fail_ci_if_error: true

      - name: Check Coverage Thresholds
        run: |
          cd dashboard
          npx jest --coverage --coverageThreshold='{"global":{"branches":80,"functions":80,"lines":85,"statements":85}}'
```

## 9. Test Execution Commands

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific component tests
npm test -- card.test.tsx

# Run in watch mode during development
npm run test:watch

# Run E2E tests
npm run test:e2e

# Run visual regression tests
npm run test:visual

# Update snapshots
npm test -- -u

# Debug specific test
npm test -- --detectOpenHandles card.test.tsx
```

## 10. Performance Testing Metrics

Each component should meet these performance benchmarks:

- **Initial Render**: < 16ms (60fps)
- **Re-render on Props Change**: < 8ms
- **Animation Frame Rate**: Consistent 60fps
- **Memory Usage**: No leaks after 100 re-renders
- **Bundle Size Impact**: < 10KB per component

## 11. Test Review Checklist

Before implementing any component, ensure tests cover:

- [ ] Component renders without errors
- [ ] Props validation and type checking
- [ ] Color scheme adherence (60-30-10 rule)
- [ ] Loading states
- [ ] Error states
- [ ] Empty data handling
- [ ] Accessibility (ARIA, keyboard nav)
- [ ] Responsive behavior (mobile, tablet, desktop)
- [ ] WebSocket integration (if applicable)
- [ ] Animation performance
- [ ] Memory leak prevention
- [ ] Cross-browser compatibility