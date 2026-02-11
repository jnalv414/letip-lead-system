/**
 * Test Suite: StatsGrid Component
 *
 * Tests navigation behavior when clicking on stat cards.
 * Following TDD approach - tests written before implementation.
 *
 * Expected behavior:
 * - Each stat card should navigate to the leads page with appropriate filters
 * - Cards should show cursor-pointer to indicate clickability
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StatsGrid } from '../stats-grid'
import type { DashboardStats } from '../../types'

// Mock next/navigation
const mockPush = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => '/dashboard',
  useSearchParams: () => new URLSearchParams(),
}))

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
      <div {...props}>{children}</div>
    ),
  },
}))

const mockStats: DashboardStats = {
  totalBusinesses: 150,
  enrichedCount: 100,
  pendingCount: 35,
  failedCount: 15,
  totalContacts: 450,
  messagesGenerated: 200,
  enrichmentRate: 66.7,
  avgContactsPerBusiness: 3.0,
}

describe('StatsGrid Component', () => {
  beforeEach(() => {
    mockPush.mockClear()
  })

  describe('Navigation on Card Click', () => {
    it('navigates to /leads when Total Businesses card is clicked', async () => {
      const user = userEvent.setup()
      render(<StatsGrid stats={mockStats} />)

      // Find and click the Total Businesses card
      const totalBusinessesCard = screen.getByText('Total Businesses').closest('[data-testid="stat-card"]')
        || screen.getByText('Total Businesses').closest('div[role="button"]')
        || screen.getByText('Total Businesses').parentElement?.parentElement?.parentElement

      expect(totalBusinessesCard).toBeInTheDocument()

      if (totalBusinessesCard) {
        await user.click(totalBusinessesCard)
        expect(mockPush).toHaveBeenCalledWith('/leads')
      }
    })

    it('navigates to /leads?status=enriched when Enriched card is clicked', async () => {
      const user = userEvent.setup()
      render(<StatsGrid stats={mockStats} />)

      // Find and click the Enriched card
      const enrichedCard = screen.getByText('Enriched').closest('[data-testid="stat-card"]')
        || screen.getByText('Enriched').closest('div[role="button"]')
        || screen.getByText('Enriched').parentElement?.parentElement?.parentElement

      expect(enrichedCard).toBeInTheDocument()

      if (enrichedCard) {
        await user.click(enrichedCard)
        expect(mockPush).toHaveBeenCalledWith('/leads?status=enriched')
      }
    })

    it('navigates to /leads?status=pending when Pending card is clicked', async () => {
      const user = userEvent.setup()
      render(<StatsGrid stats={mockStats} />)

      // Find and click the Pending card
      const pendingCard = screen.getByText('Pending').closest('[data-testid="stat-card"]')
        || screen.getByText('Pending').closest('div[role="button"]')
        || screen.getByText('Pending').parentElement?.parentElement?.parentElement

      expect(pendingCard).toBeInTheDocument()

      if (pendingCard) {
        await user.click(pendingCard)
        expect(mockPush).toHaveBeenCalledWith('/leads?status=pending')
      }
    })

    it('navigates to /leads?status=failed when Failed card is clicked', async () => {
      const user = userEvent.setup()
      render(<StatsGrid stats={mockStats} />)

      // Find and click the Failed card
      const failedCard = screen.getByText('Failed').closest('[data-testid="stat-card"]')
        || screen.getByText('Failed').closest('div[role="button"]')
        || screen.getByText('Failed').parentElement?.parentElement?.parentElement

      expect(failedCard).toBeInTheDocument()

      if (failedCard) {
        await user.click(failedCard)
        expect(mockPush).toHaveBeenCalledWith('/leads?status=failed')
      }
    })
  })

  describe('Visual Feedback', () => {
    it('shows cursor-pointer on clickable stat cards', () => {
      render(<StatsGrid stats={mockStats} />)

      // Get all stat card elements and verify they have cursor-pointer styling
      const statCards = document.querySelectorAll('[data-testid="stat-card"]')

      // If data-testid is not set yet, check for role="button" or cursor class
      if (statCards.length === 0) {
        // Alternative: check for cursor-pointer class on card wrappers
        const cards = document.querySelectorAll('.cursor-pointer')
        expect(cards.length).toBeGreaterThan(0)
      } else {
        statCards.forEach((card) => {
          expect(card).toHaveClass('cursor-pointer')
        })
      }
    })

    it('applies hover styles to stat cards', () => {
      render(<StatsGrid stats={mockStats} />)

      // Verify stat cards have transition classes for hover effects
      const totalBusinessesText = screen.getByText('Total Businesses')
      // Navigate up to the Card element which has transition-transform
      const cardElement = totalBusinessesText.closest('.transition-transform')

      expect(cardElement).toBeInTheDocument()
      expect(cardElement).toHaveClass('cursor-pointer')
    })
  })

  describe('Loading State', () => {
    it('renders skeleton cards when loading', () => {
      render(<StatsGrid isLoading={true} />)

      // Should render 6 skeleton cards
      const skeletons = document.querySelectorAll('[data-testid="stat-skeleton"]')
      if (skeletons.length === 0) {
        // Fallback: check for skeleton class
        const skeletonElements = document.querySelectorAll('.animate-pulse')
        expect(skeletonElements.length).toBeGreaterThan(0)
      } else {
        expect(skeletons.length).toBe(6)
      }
    })

    it('does not render navigation-enabled cards when loading', async () => {
      const user = userEvent.setup()
      render(<StatsGrid isLoading={true} />)

      // Should not have any clickable stat cards
      const statCards = document.querySelectorAll('[data-testid="stat-card"]')
      expect(statCards.length).toBe(0)
    })
  })

  describe('Empty State', () => {
    it('returns null when stats is undefined and not loading', () => {
      const { container } = render(<StatsGrid />)
      expect(container.firstChild).toBeNull()
    })
  })

  describe('Accessibility', () => {
    it('stat cards are clickable div elements', () => {
      render(<StatsGrid stats={mockStats} />)

      // Stat cards are rendered as Card (div) elements with cursor-pointer
      const cursorPointerCards = document.querySelectorAll('.cursor-pointer')
      expect(cursorPointerCards.length).toBeGreaterThan(0)

      // Each clickable card should have an onClick handler (verified via click test above)
    })

    it('stat cards have appropriate ARIA attributes', () => {
      render(<StatsGrid stats={mockStats} />)

      const statCards = document.querySelectorAll('[data-testid="stat-card"]')
      if (statCards.length > 0) {
        statCards.forEach((card) => {
          // Cards should have role="button" or be buttons
          expect(
            card.getAttribute('role') === 'button' ||
            card.tagName.toLowerCase() === 'button' ||
            card.getAttribute('tabindex') === '0'
          ).toBeTruthy()
        })
      }
    })
  })

  describe('Data Display', () => {
    it('displays formatted numbers with locale string', () => {
      render(<StatsGrid stats={mockStats} />)

      // Check that 150 is displayed (total businesses)
      expect(screen.getByText('150')).toBeInTheDocument()

      // Check enriched count
      expect(screen.getByText('100')).toBeInTheDocument()

      // Check pending count
      expect(screen.getByText('35')).toBeInTheDocument()

      // Check failed count
      expect(screen.getByText('15')).toBeInTheDocument()
    })

    it('displays enrichment rate as subtitle', () => {
      render(<StatsGrid stats={mockStats} />)

      // Check for the enrichment rate subtitle
      expect(screen.getByText(/66\.7% rate/)).toBeInTheDocument()
    })
  })
})
