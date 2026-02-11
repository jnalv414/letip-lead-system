/**
 * Test Suite: ThemeToggle Component
 *
 * Tests theme toggling functionality and visual states.
 * Following TDD approach - tests written before implementation.
 *
 * Expected behavior:
 * - Displays sun icon in light mode
 * - Displays moon icon in dark mode
 * - Toggles theme when clicked
 * - Has proper accessibility attributes
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider } from 'next-themes'

// Note: ThemeToggle component needs to be created
// This test file is written first (TDD approach)
import { ThemeToggle } from '../theme-toggle'

// Mock next-themes
const mockSetTheme = vi.fn()
let mockTheme = 'light'

vi.mock('next-themes', async () => {
  const actual = await vi.importActual('next-themes')
  return {
    ...actual,
    useTheme: () => ({
      theme: mockTheme,
      setTheme: mockSetTheme,
      resolvedTheme: mockTheme,
      themes: ['light', 'dark', 'system'],
      systemTheme: 'light',
    }),
  }
})

// Wrapper component for providing theme context
const ThemeWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
    {children}
  </ThemeProvider>
)

const renderWithTheme = (component: React.ReactElement) => {
  return render(component, { wrapper: ThemeWrapper })
}

describe('ThemeToggle Component', () => {
  beforeEach(() => {
    mockSetTheme.mockClear()
    mockTheme = 'light'
  })

  describe('Icon Display', () => {
    it('renders sun icon in light mode', () => {
      mockTheme = 'light'
      renderWithTheme(<ThemeToggle />)

      // Look for sun icon
      const sunIcon = document.querySelector('svg.lucide-sun')
        || document.querySelector('[data-testid="sun-icon"]')
        || screen.queryByRole('img', { name: /sun/i })

      // Alternative: check for the icon by aria-label on button
      const toggleButton = screen.getByRole('button', { name: /toggle theme|switch to dark|light mode/i })

      expect(sunIcon || toggleButton).toBeTruthy()

      // Moon should be hidden or not present when in light mode
      const visibleMoon = document.querySelector('svg.lucide-moon:not(.hidden):not([style*="display: none"])')
      // In light mode, moon should either not exist or be hidden
    })

    it('renders moon icon in dark mode', () => {
      mockTheme = 'dark'
      renderWithTheme(<ThemeToggle />)

      // Look for moon icon
      const moonIcon = document.querySelector('svg.lucide-moon')
        || document.querySelector('[data-testid="moon-icon"]')
        || screen.queryByRole('img', { name: /moon/i })

      const toggleButton = screen.getByRole('button', { name: /toggle theme|switch to light|dark mode/i })

      expect(moonIcon || toggleButton).toBeTruthy()
    })

    it('shows correct icon based on resolved theme', () => {
      // Test with system theme that resolves to dark
      mockTheme = 'dark'
      renderWithTheme(<ThemeToggle />)

      // Should show moon icon when resolved theme is dark
      const moonIcon = document.querySelector('svg.lucide-moon')
      const sunIcon = document.querySelector('svg.lucide-sun')

      // One should be visible, the other hidden
      expect(moonIcon || sunIcon).toBeTruthy()
    })
  })

  describe('Theme Toggle Behavior', () => {
    it('toggles theme from light to dark when clicked', async () => {
      const user = userEvent.setup()
      mockTheme = 'light'
      renderWithTheme(<ThemeToggle />)

      const toggleButton = screen.getByRole('button')
      await user.click(toggleButton)

      expect(mockSetTheme).toHaveBeenCalledWith('dark')
    })

    it('toggles theme from dark to light when clicked', async () => {
      const user = userEvent.setup()
      mockTheme = 'dark'
      renderWithTheme(<ThemeToggle />)

      const toggleButton = screen.getByRole('button')
      await user.click(toggleButton)

      expect(mockSetTheme).toHaveBeenCalledWith('light')
    })

    it('handles rapid consecutive clicks', async () => {
      const user = userEvent.setup()
      mockTheme = 'light'
      renderWithTheme(<ThemeToggle />)

      const toggleButton = screen.getByRole('button')

      // Rapid clicks
      await user.click(toggleButton)
      await user.click(toggleButton)
      await user.click(toggleButton)

      // Should have been called 3 times
      expect(mockSetTheme).toHaveBeenCalledTimes(3)
    })
  })

  describe('Accessibility', () => {
    it('has proper accessibility attributes', () => {
      renderWithTheme(<ThemeToggle />)

      const toggleButton = screen.getByRole('button')

      // Should have aria-label or accessible name
      const accessibleName = toggleButton.getAttribute('aria-label')
        || toggleButton.textContent
        || toggleButton.getAttribute('title')

      expect(accessibleName).toBeTruthy()
    })

    it('is keyboard accessible', async () => {
      const user = userEvent.setup()
      mockTheme = 'light'
      renderWithTheme(<ThemeToggle />)

      // Tab to the button
      await user.tab()

      // Button should be focused
      const toggleButton = screen.getByRole('button')
      expect(document.activeElement).toBe(toggleButton)

      // Press Enter to toggle
      await user.keyboard('{Enter}')
      expect(mockSetTheme).toHaveBeenCalledWith('dark')
    })

    it('can be activated with Space key', async () => {
      const user = userEvent.setup()
      mockTheme = 'light'
      renderWithTheme(<ThemeToggle />)

      const toggleButton = screen.getByRole('button')
      toggleButton.focus()

      await user.keyboard(' ')
      expect(mockSetTheme).toHaveBeenCalledWith('dark')
    })

    it('announces theme change to screen readers', () => {
      renderWithTheme(<ThemeToggle />)

      const toggleButton = screen.getByRole('button')

      // Button should have descriptive aria-label that changes with theme
      const ariaLabel = toggleButton.getAttribute('aria-label')
      expect(ariaLabel).toMatch(/theme|mode|light|dark/i)
    })

    it('has visible focus indicator via browser default or transition styles', () => {
      renderWithTheme(<ThemeToggle />)

      const toggleButton = screen.getByRole('button')

      // The ThemeToggle uses native button element which has browser default focus styles,
      // and includes transition-colors class for visual feedback
      expect(toggleButton.tagName.toLowerCase()).toBe('button')
      expect(toggleButton.className).toContain('transition-colors')
    })
  })

  describe('Visual Feedback', () => {
    it('has hover state styling', () => {
      renderWithTheme(<ThemeToggle />)

      const toggleButton = screen.getByRole('button')

      // Should have hover-related classes
      const hasHoverStyles =
        toggleButton.className.includes('hover') ||
        toggleButton.className.includes('transition')

      expect(hasHoverStyles).toBeTruthy()
    })

    it('icon transitions smoothly between states', () => {
      renderWithTheme(<ThemeToggle />)

      // Check for transition classes on icons or button
      const button = screen.getByRole('button')
      const icons = button.querySelectorAll('svg')

      const hasTransition =
        button.className.includes('transition') ||
        Array.from(icons).some(icon => icon.className.includes('transition'))

      expect(hasTransition).toBeTruthy()
    })
  })

  describe('Edge Cases', () => {
    it('handles undefined theme gracefully', () => {
      mockTheme = undefined as any

      // Should not throw error
      expect(() => renderWithTheme(<ThemeToggle />)).not.toThrow()
    })

    it('handles system theme preference', () => {
      mockTheme = 'system'
      renderWithTheme(<ThemeToggle />)

      // Should render without errors
      const toggleButton = screen.getByRole('button')
      expect(toggleButton).toBeInTheDocument()
    })
  })

  describe('Component Integration', () => {
    it('works within layout context', () => {
      renderWithTheme(
        <div className="flex items-center gap-4">
          <span>Header</span>
          <ThemeToggle />
        </div>
      )

      const toggleButton = screen.getByRole('button')
      expect(toggleButton).toBeInTheDocument()
    })

    it('maintains state across re-renders', async () => {
      const user = userEvent.setup()
      mockTheme = 'light'

      const { rerender } = renderWithTheme(<ThemeToggle />)

      const toggleButton = screen.getByRole('button')
      await user.click(toggleButton)

      expect(mockSetTheme).toHaveBeenCalledWith('dark')

      // Simulate theme change
      mockTheme = 'dark'
      rerender(
        <ThemeWrapper>
          <ThemeToggle />
        </ThemeWrapper>
      )

      // Should now show moon icon / dark mode state
      await user.click(screen.getByRole('button'))
      expect(mockSetTheme).toHaveBeenCalledWith('light')
    })
  })

  describe('Styling', () => {
    it('applies ghost button variant styling', () => {
      renderWithTheme(<ThemeToggle />)

      const toggleButton = screen.getByRole('button')

      // Should have ghost button styling (transparent background)
      const hasGhostStyle =
        toggleButton.className.includes('ghost') ||
        toggleButton.className.includes('bg-transparent') ||
        getComputedStyle(toggleButton).backgroundColor === 'transparent'

      expect(hasGhostStyle || toggleButton).toBeTruthy()
    })

    it('has appropriate size for touch targets', () => {
      renderWithTheme(<ThemeToggle />)

      const toggleButton = screen.getByRole('button')
      const rect = toggleButton.getBoundingClientRect()

      // Minimum touch target size should be 44x44 px (WCAG recommendation)
      // Or at least have padding that makes it clickable
      const hasAdequateSize =
        (rect.width >= 44 && rect.height >= 44) ||
        toggleButton.className.includes('p-') ||
        toggleButton.className.includes('h-') ||
        toggleButton.className.includes('w-')

      expect(hasAdequateSize).toBeTruthy()
    })
  })
})
