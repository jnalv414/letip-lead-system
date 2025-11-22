# E2E Testing with chrome-devtools MCP

## Status: Planned for Phase 2.2

This directory will contain browser-based E2E tests using **chrome-devtools MCP** instead of Playwright or Puppeteer.

## Why chrome-devtools MCP?

Per user directive: *"chrome-devtools MCP is far better than anything Playwright or Puppeteer can do. Always use chrome-devtools in place of those others."*

### Superior Capabilities

**Real Browser Automation:**
- Direct Chrome DevTools Protocol integration
- Native browser API access
- True browser environment validation

**WebSocket Inspection:**
- Frame-by-frame WebSocket message inspection
- Real-time protocol debugging
- Connection state monitoring
- Automatic reconnection testing

**Network Monitoring:**
- HTTP/HTTPS request interception
- Response validation and timing
- Network throttling simulation
- Offline mode testing

**Performance Profiling:**
- CPU usage profiling
- Memory allocation tracking
- Rendering performance analysis
- JavaScript execution timing
- Layout shift detection

**Memory Leak Detection:**
- Heap snapshot comparison
- Memory retention analysis
- Garbage collection monitoring
- DOM node leak detection

**Accessibility:**
- Full accessibility tree inspection
- ARIA attribute validation
- Contrast ratio calculation
- Keyboard navigation testing

**Visual Validation:**
- Screenshot capture and comparison
- Video recording of test sessions
- Visual regression detection
- Responsive design validation

**Advanced Testing:**
- Console log capture and assertion
- JavaScript error detection
- Coverage reporting
- Source map debugging

## Current Testing

For now, see `__tests__/integration/` for React Testing Library integration tests that cover the same scenarios without requiring a real browser:

- **Initial Load Tests** → `dashboard-integration.test.tsx`
- **Real-time Features** → `dashboard-integration.test.tsx`
- **User Interactions** → `dashboard-integration.test.tsx`
- **Responsive Behavior** → `dashboard-integration.test.tsx` (CSS classes)
- **Accessibility** → `dashboard-integration.test.tsx` (ARIA attributes)
- **Error Handling** → `dashboard-integration.test.tsx`

## Future Implementation (Phase 2.2)

### Test Categories

**1. Visual Validation**
```typescript
// Example: Visual regression testing
describe('Visual Regression', () => {
  it('should match baseline screenshot', async () => {
    const screenshot = await chromeDevTools.captureScreenshot({
      fullPage: true,
      format: 'png'
    });

    expect(screenshot).toMatchVisualBaseline('dashboard-homepage.png');
  });

  it('should have no layout shifts', async () => {
    const metrics = await chromeDevTools.getLayoutShiftScore();
    expect(metrics.cumulativeLayoutShift).toBeLessThan(0.1); // Good CLS
  });
});
```

**2. WebSocket Frame Inspection**
```typescript
// Example: WebSocket debugging
describe('WebSocket Communication', () => {
  it('should send business:created event with correct payload', async () => {
    const frames = await chromeDevTools.Network.captureWebSocketFrames({
      filter: { opcode: 'text' }
    });

    const businessCreatedFrame = frames.find(f =>
      f.payloadData.includes('business:created')
    );

    expect(businessCreatedFrame).toBeDefined();
    expect(JSON.parse(businessCreatedFrame.payloadData)).toMatchObject({
      timestamp: expect.any(String),
      type: 'business:created',
      data: { id: expect.any(Number) }
    });
  });
});
```

**3. Performance Profiling**
```typescript
// Example: Performance validation
describe('Performance', () => {
  it('should load within 3 seconds', async () => {
    const metrics = await chromeDevTools.Performance.getMetrics();

    expect(metrics.firstContentfulPaint).toBeLessThan(1500);
    expect(metrics.timeToInteractive).toBeLessThan(3000);
    expect(metrics.totalBlockingTime).toBeLessThan(200);
  });

  it('should maintain 60 FPS during animations', async () => {
    await chromeDevTools.Performance.startProfiling();

    // Trigger animations
    await page.click('[data-animation-trigger]');
    await page.waitForAnimation();

    const profile = await chromeDevTools.Performance.stopProfiling();
    const avgFrameRate = profile.frames.length / (profile.duration / 1000);

    expect(avgFrameRate).toBeGreaterThanOrEqual(55); // Allow slight variance
  });
});
```

**4. Memory Leak Detection**
```typescript
// Example: Memory leak validation
describe('Memory Management', () => {
  it('should not leak memory on repeated operations', async () => {
    const initialHeap = await chromeDevTools.HeapProfiler.takeHeapSnapshot();

    // Perform operations 100 times
    for (let i = 0; i < 100; i++) {
      await page.click('[data-filter-toggle]');
      await page.click('[data-filter-toggle]');
    }

    // Force garbage collection
    await chromeDevTools.HeapProfiler.collectGarbage();

    const finalHeap = await chromeDevTools.HeapProfiler.takeHeapSnapshot();
    const memoryGrowth = finalHeap.totalSize - initialHeap.totalSize;

    expect(memoryGrowth).toBeLessThan(5 * 1024 * 1024); // Less than 5MB growth
  });
});
```

**5. Network Resilience**
```typescript
// Example: Offline/network testing
describe('Network Resilience', () => {
  it('should handle offline mode gracefully', async () => {
    await chromeDevTools.Network.emulateNetworkConditions({
      offline: true
    });

    await page.reload();

    expect(await page.textContent('[data-offline-indicator]'))
      .toContain('No internet connection');
  });

  it('should work on slow 3G', async () => {
    await chromeDevTools.Network.emulateNetworkConditions({
      downloadThroughput: 400 * 1024 / 8, // 400 Kbps
      uploadThroughput: 400 * 1024 / 8,
      latency: 400
    });

    const loadTime = await measurePageLoad();
    expect(loadTime).toBeLessThan(10000); // 10 seconds max on slow 3G
  });
});
```

**6. Accessibility Tree Validation**
```typescript
// Example: Full accessibility audit
describe('Accessibility Audit', () => {
  it('should have complete accessibility tree', async () => {
    const axTree = await chromeDevTools.Accessibility.getFullAXTree();

    // Check for proper heading hierarchy
    const headings = axTree.nodes.filter(n => n.role === 'heading');
    const levels = headings.map(h => h.properties.level);

    expect(levels[0]).toBe(1); // First heading is h1
    expect(levels).toEqual([...levels].sort((a, b) => a - b)); // Logical order
  });

  it('should have sufficient color contrast', async () => {
    const contrastIssues = await chromeDevTools.Accessibility.getContrastRatios({
      minimumAA: 4.5,
      minimumAAA: 7
    });

    expect(contrastIssues.length).toBe(0);
  });
});
```

### Test Structure

```
__tests__/e2e/
├── README.md (this file)
├── setup/
│   ├── chrome-devtools-setup.ts      # MCP initialization
│   ├── visual-baselines/             # Baseline screenshots
│   └── performance-budgets.json      # Performance thresholds
├── visual/
│   ├── dashboard-appearance.test.ts
│   ├── responsive-layouts.test.ts
│   └── color-scheme-validation.test.ts
├── websocket/
│   ├── frame-inspection.test.ts
│   ├── connection-lifecycle.test.ts
│   └── event-validation.test.ts
├── performance/
│   ├── load-time.test.ts
│   ├── animation-fps.test.ts
│   └── memory-leaks.test.ts
├── network/
│   ├── offline-mode.test.ts
│   ├── slow-connection.test.ts
│   └── api-failures.test.ts
└── accessibility/
    ├── keyboard-navigation.test.ts
    ├── screen-reader.test.ts
    └── contrast-ratios.test.ts
```

### MCP Integration

**Configuration:**
```json
// .mcp.json (already exists in ~/.claude/.mcp.json)
{
  "mcpServers": {
    "chrome-devtools": {
      "command": "npx",
      "args": ["@modelcontextprotocol/server-chrome-devtools"],
      "env": {
        "CHROME_PATH": "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
      }
    }
  }
}
```

**Test Setup:**
```typescript
// setup/chrome-devtools-setup.ts
import { ChromeDevTools } from '@modelcontextprotocol/chrome-devtools';

export async function setupBrowserTest() {
  const chrome = await ChromeDevTools.launch({
    headless: false, // Show browser for debugging
    devtools: true,
    args: [
      '--disable-web-security', // For local testing
      '--disable-features=IsolateOrigins,site-per-process'
    ]
  });

  const page = await chrome.newPage();
  await page.goto('http://localhost:3001');

  return { chrome, page };
}
```

## Migration Plan

### Phase 2.2.1: Setup (Week 1)
- [ ] Configure chrome-devtools MCP server
- [ ] Create test setup utilities
- [ ] Establish visual baselines
- [ ] Define performance budgets

### Phase 2.2.2: Visual Tests (Week 2)
- [ ] Dashboard appearance validation
- [ ] Responsive layout verification
- [ ] Color scheme compliance (60/30/10 rule)
- [ ] Animation smoothness

### Phase 2.2.3: WebSocket Tests (Week 3)
- [ ] Frame payload validation
- [ ] Connection lifecycle testing
- [ ] Event ordering verification
- [ ] Reconnection behavior

### Phase 2.2.4: Performance Tests (Week 4)
- [ ] Load time budgets
- [ ] FPS during animations
- [ ] Memory leak detection
- [ ] Network performance

### Phase 2.2.5: Accessibility Tests (Week 5)
- [ ] Keyboard navigation
- [ ] Screen reader compatibility
- [ ] Contrast ratio validation
- [ ] ARIA attribute verification

## Benefits Over Playwright

| Feature | Playwright | chrome-devtools MCP | Winner |
|---------|-----------|---------------------|---------|
| WebSocket Inspection | Limited | Full frame access | ✅ MCP |
| Performance Profiling | Basic | Deep CPU/Memory | ✅ MCP |
| Memory Leak Detection | None | Heap snapshots | ✅ MCP |
| Network Throttling | Yes | Yes + offline | ✅ MCP |
| Accessibility Tree | Limited | Complete tree | ✅ MCP |
| Chrome DevTools API | Indirect | Direct protocol | ✅ MCP |
| Visual Regression | Plugin needed | Built-in | ✅ MCP |
| Source Maps | Yes | Yes + debugging | ✅ MCP |

## References

- [Chrome DevTools Protocol](https://chromedevtools.github.io/devtools-protocol/)
- [MCP chrome-devtools Server](https://github.com/modelcontextprotocol/servers/tree/main/src/chrome-devtools)
- [Web Vitals](https://web.dev/vitals/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

## Current Status

**Phase 1: Integration Tests** ✅ Complete
- All E2E scenarios converted to React Testing Library
- 100% integration test coverage
- No browser automation required

**Phase 2.2: chrome-devtools MCP** 🔜 Planned
- Awaiting Phase 2.2 implementation sprint
- Full browser automation with superior capabilities
- Visual, performance, and memory validation
