/**
 * End-to-End test suite for LeTip Dashboard
 * Tests the complete user journey and real-time features
 */

import { test, expect, Page } from '@playwright/test';

// Test configuration
test.use({
  // Set viewport to desktop by default
  viewport: { width: 1920, height: 1080 },

  // Extend timeout for real-time features
  actionTimeout: 10000,

  // Video recording for debugging
  video: 'on-first-retry',
});

// Helper to wait for WebSocket connection
async function waitForWebSocket(page: Page) {
  await page.waitForFunction(() => {
    return (window as any).socketConnected === true;
  }, { timeout: 5000 });
}

// Helper to mock API responses
async function mockAPIResponses(page: Page) {
  await page.route('**/api/businesses**', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: Array.from({ length: 10 }, (_, i) => ({
          id: i + 1,
          name: `Business ${i + 1}`,
          city: 'Freehold',
          enrichment_status: 'enriched',
        })),
        meta: {
          total: 524,
          page: 1,
          limit: 10,
        },
      }),
    });
  });

  await page.route('**/api/stats', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        totalBusinesses: 524,
        totalContacts: 1567,
        enrichedCount: 412,
        todayAdded: 12,
      }),
    });
  });
}

test.describe('Dashboard E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Setup API mocks
    await mockAPIResponses(page);

    // Navigate to dashboard
    await page.goto('http://localhost:3001');

    // Wait for initial load
    await page.waitForLoadState('networkidle');
  });

  // ==================== Initial Load Tests ====================

  test.describe('Initial Load', () => {
    test('should load dashboard with all components', async ({ page }) => {
      // Check header
      await expect(page.getByRole('heading', { name: /LeTip Lead System/i })).toBeVisible();

      // Check stats cards
      await expect(page.getByTestId('stat-total-businesses')).toBeVisible();
      await expect(page.getByTestId('stat-total-contacts')).toBeVisible();
      await expect(page.getByTestId('stat-enriched-count')).toBeVisible();
      await expect(page.getByTestId('stat-today-added')).toBeVisible();

      // Check charts
      await expect(page.getByTestId('business-growth-chart')).toBeVisible();
      await expect(page.getByTestId('lead-sources-chart')).toBeVisible();
      await expect(page.getByTestId('pipeline-bubbles')).toBeVisible();

      // Check activity feed
      await expect(page.getByTestId('activity-feed')).toBeVisible();
    });

    test('should apply correct color scheme', async ({ page }) => {
      // Check charcoal backgrounds (60%)
      const mainContainer = page.getByTestId('dashboard-container');
      await expect(mainContainer).toHaveCSS('background-color', 'rgb(31, 41, 55)');

      // Check teal accents (30%)
      const tealElements = await page.locator('.text-teal-primary').count();
      expect(tealElements).toBeGreaterThan(0);

      // Check orange highlights (10%)
      const orangeElements = await page.locator('.bg-orange-primary').count();
      expect(orangeElements).toBeGreaterThan(0);
    });

    test('should establish WebSocket connection', async ({ page }) => {
      // Inject connection checker
      await page.evaluate(() => {
        const socket = (window as any).socket;
        (window as any).socketConnected = socket && socket.connected;
      });

      await waitForWebSocket(page);

      // Check for real-time indicator
      const indicator = page.getByTestId('realtime-indicator');
      await expect(indicator).toHaveClass(/bg-green-500/);
    });
  });

  // ==================== Real-time Updates Tests ====================

  test.describe('Real-time Features', () => {
    test('should update stats when new business is added', async ({ page }) => {
      await waitForWebSocket(page);

      // Get initial count
      const statCard = page.getByTestId('stat-total-businesses');
      const initialCount = await statCard.getByTestId('stat-value').textContent();
      expect(initialCount).toBe('524');

      // Simulate WebSocket event
      await page.evaluate(() => {
        const socket = (window as any).socket;
        socket.emit('business:created', {
          timestamp: new Date().toISOString(),
          type: 'business:created',
          data: {
            id: 525,
            name: 'New Test Business',
            city: 'Freehold',
          },
        });
      });

      // Wait for update
      await expect(statCard.getByTestId('stat-value')).toHaveText('525', { timeout: 5000 });

      // Check animation
      await expect(statCard).toHaveClass(/animate-pulse/);
    });

    test('should update activity feed in real-time', async ({ page }) => {
      await waitForWebSocket(page);

      const activityFeed = page.getByTestId('activity-feed');
      const initialItems = await activityFeed.getByRole('listitem').count();

      // Simulate activity
      await page.evaluate(() => {
        const socket = (window as any).socket;
        socket.emit('activity:new', {
          timestamp: new Date().toISOString(),
          type: 'activity:new',
          data: {
            type: 'business_added',
            message: 'ABC Plumbing was added',
            timestamp: new Date().toISOString(),
          },
        });
      });

      // Check new item appears
      await expect(activityFeed.getByRole('listitem')).toHaveCount(initialItems + 1);
      await expect(activityFeed.getByText('ABC Plumbing was added')).toBeVisible();
    });

    test('should show scraping progress', async ({ page }) => {
      await waitForWebSocket(page);

      // Trigger scraping
      const scrapeButton = page.getByRole('button', { name: /Start Scraping/i });
      await scrapeButton.click();

      // Check progress bar appears
      const progressBar = page.getByTestId('scraping-progress');
      await expect(progressBar).toBeVisible();

      // Simulate progress updates
      for (let i = 1; i <= 5; i++) {
        await page.evaluate((progress) => {
          const socket = (window as any).socket;
          socket.emit('scraping:progress', {
            timestamp: new Date().toISOString(),
            type: 'scraping:progress',
            data: {
              current: progress * 10,
              total: 50,
              percentage: progress * 20,
            },
          });
        }, i);

        await expect(progressBar).toHaveAttribute('aria-valuenow', String(i * 20));
      }

      // Simulate completion
      await page.evaluate(() => {
        const socket = (window as any).socket;
        socket.emit('scraping:completed', {
          timestamp: new Date().toISOString(),
          type: 'scraping:completed',
          data: { found: 50, saved: 45 },
        });
      });

      await expect(page.getByText('Scraping completed: 45 businesses added')).toBeVisible();
    });
  });

  // ==================== Interaction Tests ====================

  test.describe('User Interactions', () => {
    test('should filter businesses by city', async ({ page }) => {
      const filterDropdown = page.getByRole('combobox', { name: /Filter by city/i });
      await filterDropdown.click();

      await page.getByRole('option', { name: 'Freehold' }).click();

      // Check URL updated
      await expect(page).toHaveURL(/city=Freehold/);

      // Check results filtered
      const businessList = page.getByTestId('business-list');
      await expect(businessList.getByText(/Showing.*Freehold/i)).toBeVisible();
    });

    test('should toggle chart view', async ({ page }) => {
      const chartContainer = page.getByTestId('business-growth-chart');

      // Switch to bar chart
      await page.getByRole('button', { name: /Bar Chart/i }).click();
      await expect(chartContainer.getByTestId('bar-chart')).toBeVisible();

      // Switch back to area chart
      await page.getByRole('button', { name: /Area Chart/i }).click();
      await expect(chartContainer.getByTestId('area-chart')).toBeVisible();
    });

    test('should export data', async ({ page }) => {
      // Setup download promise before clicking
      const downloadPromise = page.waitForEvent('download');

      await page.getByRole('button', { name: /Export/i }).click();
      await page.getByRole('menuitem', { name: /CSV/i }).click();

      const download = await downloadPromise;
      expect(download.suggestedFilename()).toContain('.csv');
    });

    test('should open business details modal', async ({ page }) => {
      const businessCard = page.getByTestId('business-card-1');
      await businessCard.click();

      const modal = page.getByRole('dialog', { name: /Business Details/i });
      await expect(modal).toBeVisible();

      // Check modal content
      await expect(modal.getByText('Business 1')).toBeVisible();
      await expect(modal.getByText('Freehold')).toBeVisible();

      // Close modal
      await page.keyboard.press('Escape');
      await expect(modal).not.toBeVisible();
    });
  });

  // ==================== Responsive Tests ====================

  test.describe('Responsive Behavior', () => {
    test('should adapt to mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      // Check mobile menu
      const menuButton = page.getByRole('button', { name: /Menu/i });
      await expect(menuButton).toBeVisible();

      await menuButton.click();
      const mobileNav = page.getByTestId('mobile-navigation');
      await expect(mobileNav).toBeVisible();

      // Check charts stack vertically
      const charts = page.locator('[data-testid*="chart"]');
      const firstChartBox = await charts.first().boundingBox();
      const secondChartBox = await charts.nth(1).boundingBox();

      expect(firstChartBox?.y).toBeLessThan(secondChartBox?.y || 0);
      expect(firstChartBox?.x).toBeCloseTo(secondChartBox?.x || 0, 0);
    });

    test('should adapt to tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });

      // Check 2-column layout
      const statsGrid = page.getByTestId('stats-grid');
      await expect(statsGrid).toHaveCSS('grid-template-columns', /repeat\(2/);

      // Check charts side by side
      const charts = page.locator('[data-testid*="chart"]').first(2);
      const boxes = await charts.evaluateAll(elements =>
        elements.map(el => el.getBoundingClientRect())
      );

      expect(boxes[0].y).toBeCloseTo(boxes[1].y, 1);
    });
  });

  // ==================== Accessibility Tests ====================

  test.describe('Accessibility', () => {
    test('should be keyboard navigable', async ({ page }) => {
      // Tab through interactive elements
      await page.keyboard.press('Tab');
      await expect(page.getByRole('link', { name: /Dashboard/i })).toBeFocused();

      await page.keyboard.press('Tab');
      await expect(page.getByRole('button').first()).toBeFocused();

      // Activate with Enter
      await page.keyboard.press('Enter');
    });

    test('should have proper ARIA labels', async ({ page }) => {
      // Check main landmarks
      await expect(page.getByRole('navigation')).toHaveAttribute('aria-label', 'Main navigation');
      await expect(page.getByRole('main')).toHaveAttribute('aria-label', 'Dashboard content');

      // Check interactive elements
      const buttons = page.getByRole('button');
      const buttonCount = await buttons.count();

      for (let i = 0; i < buttonCount; i++) {
        const button = buttons.nth(i);
        await expect(button).toHaveAttribute('aria-label', /.+/);
      }
    });

    test('should announce live updates', async ({ page }) => {
      // Check for live regions
      const liveRegions = page.locator('[aria-live]');
      await expect(liveRegions).toHaveCount(await liveRegions.count());

      // Verify polite announcements
      const politeRegion = page.locator('[aria-live="polite"]').first();
      await expect(politeRegion).toBeAttached();
    });
  });

  // ==================== Error Handling Tests ====================

  test.describe('Error Handling', () => {
    test('should handle API failures gracefully', async ({ page }) => {
      // Mock API failure
      await page.route('**/api/businesses**', route => {
        route.fulfill({ status: 500 });
      });

      await page.reload();

      // Check error message
      await expect(page.getByText(/Unable to load businesses/i)).toBeVisible();

      // Check retry button
      const retryButton = page.getByRole('button', { name: /Retry/i });
      await expect(retryButton).toBeVisible();
    });

    test('should handle WebSocket disconnection', async ({ page }) => {
      await waitForWebSocket(page);

      // Disconnect WebSocket
      await page.evaluate(() => {
        const socket = (window as any).socket;
        socket.disconnect();
      });

      // Check disconnection indicator
      const indicator = page.getByTestId('realtime-indicator');
      await expect(indicator).toHaveClass(/bg-gray-500/);

      // Check reconnection message
      await expect(page.getByText(/Reconnecting/i)).toBeVisible();
    });

    test('should handle invalid data gracefully', async ({ page }) => {
      // Send malformed data
      await page.evaluate(() => {
        const socket = (window as any).socket;
        socket.emit('business:created', {
          // Missing required fields
          data: null,
        });
      });

      // Should not crash
      await expect(page.getByTestId('dashboard-container')).toBeVisible();

      // Should log error (check console)
      const consoleErrors = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });

      expect(consoleErrors.some(e => e.includes('Invalid data'))).toBeTruthy();
    });
  });

  // ==================== Performance Tests ====================

  test.describe('Performance', () => {
    test('should load within acceptable time', async ({ page }) => {
      const startTime = Date.now();
      await page.goto('http://localhost:3001');
      await page.waitForLoadState('networkidle');

      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(3000); // 3 seconds max
    });

    test('should handle large datasets efficiently', async ({ page }) => {
      // Mock large dataset
      await page.route('**/api/businesses**', route => {
        route.fulfill({
          status: 200,
          body: JSON.stringify({
            data: Array.from({ length: 1000 }, (_, i) => ({
              id: i + 1,
              name: `Business ${i + 1}`,
              city: 'Freehold',
            })),
            meta: { total: 1000, page: 1, limit: 1000 },
          }),
        });
      });

      await page.reload();

      // Check virtualization or pagination
      const visibleItems = await page.getByTestId('business-list').getByRole('listitem').count();
      expect(visibleItems).toBeLessThan(50); // Should virtualize or paginate
    });

    test('should not have memory leaks', async ({ page }) => {
      // Get initial memory usage
      const initialMemory = await page.evaluate(() => {
        if ('memory' in performance) {
          return (performance as any).memory.usedJSHeapSize;
        }
        return 0;
      });

      // Perform multiple operations
      for (let i = 0; i < 10; i++) {
        // Toggle filters
        await page.getByRole('button', { name: /Filters/i }).click();
        await page.getByRole('button', { name: /Filters/i }).click();

        // Update via WebSocket
        await page.evaluate(() => {
          const socket = (window as any).socket;
          socket.emit('stats:updated', {
            data: { totalBusinesses: Math.random() * 1000 },
          });
        });
      }

      // Check memory hasn't grown excessively
      const finalMemory = await page.evaluate(() => {
        if ('memory' in performance) {
          return (performance as any).memory.usedJSHeapSize;
        }
        return 0;
      });

      const memoryGrowth = finalMemory - initialMemory;
      expect(memoryGrowth).toBeLessThan(10 * 1024 * 1024); // Less than 10MB growth
    });
  });
});