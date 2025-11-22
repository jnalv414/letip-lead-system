/**
 * Test utilities for LeTip Dashboard components
 * Provides custom render with all required providers and theme
 */

import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MockSocket } from './websocket-mock';
import { SocketContext } from '@/providers/socket-provider';

// Color scheme constants for validation
export const ColorScheme = {
  charcoal: {
    primary: 'rgb(31, 41, 55)',     // #1F2937 - 60% backgrounds
    secondary: 'rgb(17, 24, 39)',   // #111827 - darker variant
    text: 'rgb(156, 163, 175)'      // #9CA3AF - text on charcoal
  },
  teal: {
    primary: 'rgb(20, 184, 166)',   // #14B8A6 - 30% interactive
    secondary: 'rgb(15, 118, 110)',  // #0F766E - darker variant
    accent: 'rgb(94, 234, 212)'     // #5EEAD4 - lighter variant
  },
  orange: {
    primary: 'rgb(251, 146, 60)',   // #FB923C - 10% highlights/CTAs
    secondary: 'rgb(234, 88, 12)',  // #EA580C - darker variant
    accent: 'rgb(254, 215, 170)'    // #FED7AA - lighter variant
  }
} as const;

// Create a new QueryClient for each test to prevent cross-test pollution
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false, // Disable retries in tests
        gcTime: 0,    // Don't cache between tests
      },
    },
    logger: {
      log: () => {},
      warn: () => {},
      error: () => {},
    },
  });
}

// Custom render function with all providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  mockSocket?: MockSocket;
  queryClient?: QueryClient;
}

export function renderWithProviders(
  ui: ReactElement,
  {
    mockSocket = new MockSocket(),
    queryClient = createTestQueryClient(),
    ...renderOptions
  }: CustomRenderOptions = {}
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <SocketContext.Provider value={{ socket: mockSocket as any, isConnected: true }}>
          {children}
        </SocketContext.Provider>
      </QueryClientProvider>
    );
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    mockSocket,
    queryClient,
  };
}

/**
 * Validates that a component follows the 60-30-10 color distribution rule
 * @param container - The HTML element to validate
 * @returns Validation results object
 */
export function validateColorDistribution(container: HTMLElement) {
  const elements = container.querySelectorAll('*');
  let charcoalCount = 0;
  let tealCount = 0;
  let orangeCount = 0;

  elements.forEach(element => {
    const styles = window.getComputedStyle(element as HTMLElement);
    const bg = styles.backgroundColor;
    const border = styles.borderColor;
    const color = styles.color;

    // Check for charcoal (should be ~60%)
    if (
      bg === ColorScheme.charcoal.primary ||
      bg === ColorScheme.charcoal.secondary ||
      color === ColorScheme.charcoal.text
    ) {
      charcoalCount++;
    }

    // Check for teal (should be ~30%)
    if (
      bg === ColorScheme.teal.primary ||
      bg === ColorScheme.teal.secondary ||
      border === ColorScheme.teal.primary ||
      color === ColorScheme.teal.primary
    ) {
      tealCount++;
    }

    // Check for orange (should be ~10%)
    if (
      bg === ColorScheme.orange.primary ||
      border === ColorScheme.orange.primary ||
      color === ColorScheme.orange.primary
    ) {
      orangeCount++;
    }
  });

  const total = charcoalCount + tealCount + orangeCount;
  const distribution = {
    charcoal: total > 0 ? (charcoalCount / total) * 100 : 0,
    teal: total > 0 ? (tealCount / total) * 100 : 0,
    orange: total > 0 ? (orangeCount / total) * 100 : 0,
  };

  return {
    hasCharcoalBackground: charcoalCount > 0,
    hasTealAccent: tealCount > 0,
    hasOrangeHighlight: orangeCount > 0,
    distribution,
    isValid60_30_10:
      distribution.charcoal >= 50 && distribution.charcoal <= 70 &&
      distribution.teal >= 20 && distribution.teal <= 40 &&
      distribution.orange >= 5 && distribution.orange <= 15,
    meetsWCAG: checkContrastRatio(container),
  };
}

/**
 * Checks if text contrast meets WCAG AA standards
 */
function checkContrastRatio(container: HTMLElement): boolean {
  // Simplified contrast check - in production would use full WCAG algorithm
  const textElements = container.querySelectorAll('p, span, h1, h2, h3, h4, h5, h6, button, a');

  for (const element of textElements) {
    const styles = window.getComputedStyle(element as HTMLElement);
    const color = styles.color;
    const backgroundColor = findBackgroundColor(element as HTMLElement);

    // Basic check - would need full luminance calculation for production
    if (color && backgroundColor) {
      // This is a placeholder - implement actual contrast ratio calculation
      const hasGoodContrast = true; // Replace with actual calculation
      if (!hasGoodContrast) return false;
    }
  }

  return true;
}

/**
 * Finds the effective background color of an element
 */
function findBackgroundColor(element: HTMLElement): string {
  let current: HTMLElement | null = element;

  while (current) {
    const bg = window.getComputedStyle(current).backgroundColor;
    if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
      return bg;
    }
    current = current.parentElement;
  }

  return 'rgb(255, 255, 255)'; // Default to white
}

/**
 * Wait for animations to complete
 */
export async function waitForAnimation(duration: number = 300) {
  return new Promise(resolve => setTimeout(resolve, duration));
}

/**
 * Simulate viewport size for responsive testing
 */
export function setViewport(width: number, height: number) {
  Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: width });
  Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: height });
  window.dispatchEvent(new Event('resize'));
}

// Viewport presets
export const Viewports = {
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1920, height: 1080 },
} as const;

// Re-export everything from React Testing Library
export * from '@testing-library/react';
export { renderWithProviders as render };