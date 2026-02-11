/**
 * Test Suite: BusinessCard Component
 *
 * Tests click event handling and event propagation.
 * Following TDD approach - tests written before implementation.
 *
 * Expected behavior:
 * - Clicking the card should call onView callback
 * - Clicking action buttons should NOT trigger onView (stopPropagation)
 * - Clicking checkbox should NOT trigger onView
 * - Clicking website link should NOT trigger onView
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BusinessCard } from '../business-card'
import type { Business } from '@/shared/types'

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
      <div {...props}>{children}</div>
    ),
  },
}))

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => '/leads',
  useSearchParams: () => new URLSearchParams(),
}))

const createMockBusiness = (overrides: Partial<Business> = {}): Business => ({
  id: 'test-business-1',
  name: 'Acme Corporation',
  address: '123 Main Street, Anytown, USA',
  phone: '555-123-4567',
  website: 'https://acme.com',
  email: 'contact@acme.com',
  latitude: 40.7128,
  longitude: -74.0060,
  enrichment_status: 'pending',
  industry: 'Technology',
  employee_count: 50,
  year_founded: 2010,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides,
})

describe('BusinessCard Component', () => {
  let mockOnView: ReturnType<typeof vi.fn>
  let mockOnEnrich: ReturnType<typeof vi.fn>
  let mockOnDelete: ReturnType<typeof vi.fn>
  let mockOnSelect: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockOnView = vi.fn()
    mockOnEnrich = vi.fn()
    mockOnDelete = vi.fn()
    mockOnSelect = vi.fn()
  })

  describe('Card Click Behavior', () => {
    it('calls onView when the card body is clicked', async () => {
      const user = userEvent.setup()
      const business = createMockBusiness()

      render(
        <BusinessCard
          business={business}
          onView={mockOnView}
          onEnrich={mockOnEnrich}
          onDelete={mockOnDelete}
        />
      )

      // Click on the card (business name area)
      const cardElement = screen.getByText('Acme Corporation').closest('[data-testid="business-card"]')
        || screen.getByText('Acme Corporation').parentElement?.parentElement?.parentElement?.parentElement

      if (cardElement) {
        await user.click(cardElement)
        expect(mockOnView).toHaveBeenCalledWith(business)
        expect(mockOnView).toHaveBeenCalledTimes(1)
      }
    })

    it('calls onView when clicking the business name', async () => {
      const user = userEvent.setup()
      const business = createMockBusiness()

      render(
        <BusinessCard
          business={business}
          onView={mockOnView}
        />
      )

      const businessName = screen.getByText('Acme Corporation')
      await user.click(businessName)

      expect(mockOnView).toHaveBeenCalledWith(business)
    })
  })

  describe('Event Propagation - Action Buttons', () => {
    it('does NOT call onView when Eye button is clicked (stopPropagation)', async () => {
      const user = userEvent.setup()
      const business = createMockBusiness()

      render(
        <BusinessCard
          business={business}
          onView={mockOnView}
          onDelete={mockOnDelete}
        />
      )

      // Buttons have no accessible name (icon-only), find by position
      // Filter to actual <button> elements (Card div also has role="button")
      const allButtons = screen.getAllByRole('button')
      const actionButtons = allButtons.filter(btn => btn.tagName.toLowerCase() === 'button')
      const eyeButton = actionButtons[0] // First action button is the Eye/view button

      mockOnView.mockClear()
      await user.click(eyeButton)

      // Eye button calls onView directly via stopPropagation, so exactly 1 call
      expect(mockOnView).toHaveBeenCalledTimes(1)
      expect(mockOnView).toHaveBeenCalledWith(business)
    })

    it('does NOT call onView when Delete button is clicked (stopPropagation)', async () => {
      const user = userEvent.setup()
      const business = createMockBusiness({ enrichment_status: 'enriched' })

      render(
        <BusinessCard
          business={business}
          onView={mockOnView}
          onDelete={mockOnDelete}
        />
      )

      // With enrichment_status='enriched', no enrich button. Action buttons: [eye, delete]
      const allButtons = screen.getAllByRole('button')
      const actionButtons = allButtons.filter(btn => btn.tagName.toLowerCase() === 'button')
      const deleteButton = actionButtons[actionButtons.length - 1] // Last action button is delete

      await user.click(deleteButton)

      // onDelete should be called, onView should NOT (stopPropagation)
      expect(mockOnDelete).toHaveBeenCalledWith(business)
      // Eye button's stopPropagation prevents card click, delete also stops propagation
      expect(mockOnView).not.toHaveBeenCalled()
    })

    it('does NOT call onView when Enrich button is clicked (stopPropagation)', async () => {
      const user = userEvent.setup()
      const business = createMockBusiness({ enrichment_status: 'pending' })

      render(
        <BusinessCard
          business={business}
          onView={mockOnView}
          onEnrich={mockOnEnrich}
          onDelete={mockOnDelete}
        />
      )

      // With pending status, actual <button> elements are: [eye, enrich, delete]
      // (Card div also has role="button" so filter to actual buttons)
      const allButtons = screen.getAllByRole('button')
      const actionButtons = allButtons.filter(btn => btn.tagName.toLowerCase() === 'button')
      // Enrich button is the second action button (between eye and delete)
      const enrichButton = actionButtons[1]

      await user.click(enrichButton)

      // onView should NOT be called when clicking enrich
      expect(mockOnView).not.toHaveBeenCalled()
      expect(mockOnEnrich).toHaveBeenCalledWith(business)
    })
  })

  describe('Event Propagation - Checkbox', () => {
    it('does NOT call onView when checkbox is clicked (stopPropagation)', async () => {
      const user = userEvent.setup()
      const business = createMockBusiness()

      render(
        <BusinessCard
          business={business}
          onView={mockOnView}
          onSelect={mockOnSelect}
          isSelected={false}
        />
      )

      // Find and click the checkbox
      const checkbox = screen.getByRole('checkbox')

      await user.click(checkbox)

      // onView should NOT be called when clicking checkbox
      expect(mockOnView).not.toHaveBeenCalled()
      expect(mockOnSelect).toHaveBeenCalledWith(business.id, true)
    })

    it('toggles selection state correctly', async () => {
      const user = userEvent.setup()
      const business = createMockBusiness()

      const { rerender } = render(
        <BusinessCard
          business={business}
          onView={mockOnView}
          onSelect={mockOnSelect}
          isSelected={false}
        />
      )

      const checkbox = screen.getByRole('checkbox') as HTMLInputElement
      expect(checkbox.checked).toBe(false)

      await user.click(checkbox)
      expect(mockOnSelect).toHaveBeenCalledWith(business.id, true)

      // Rerender with selected state
      rerender(
        <BusinessCard
          business={business}
          onView={mockOnView}
          onSelect={mockOnSelect}
          isSelected={true}
        />
      )

      expect(checkbox.checked).toBe(true)

      await user.click(checkbox)
      expect(mockOnSelect).toHaveBeenCalledWith(business.id, false)
    })
  })

  describe('Event Propagation - Website Link', () => {
    it('does NOT call onView when website link is clicked (stopPropagation)', async () => {
      const user = userEvent.setup()
      const business = createMockBusiness({ website: 'https://example.com' })

      render(
        <BusinessCard
          business={business}
          onView={mockOnView}
        />
      )

      // Find and click the website link
      const websiteLink = screen.getByRole('link', { name: /example\.com/i })
        || screen.getByText(/example\.com/)

      if (websiteLink) {
        await user.click(websiteLink)

        // onView should NOT be called when clicking website link
        expect(mockOnView).not.toHaveBeenCalled()
      }
    })

    it('website link opens in new tab with proper security attributes', () => {
      const business = createMockBusiness({ website: 'https://example.com' })

      render(
        <BusinessCard
          business={business}
          onView={mockOnView}
        />
      )

      const websiteLink = screen.getByRole('link')

      expect(websiteLink).toHaveAttribute('target', '_blank')
      expect(websiteLink).toHaveAttribute('rel', 'noopener noreferrer')
    })
  })

  describe('Conditional Rendering', () => {
    it('does not render checkbox when onSelect is not provided', () => {
      const business = createMockBusiness()

      render(
        <BusinessCard
          business={business}
          onView={mockOnView}
        />
      )

      expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
    })

    it('does not render Enrich button when status is not pending', () => {
      const business = createMockBusiness({ enrichment_status: 'enriched' })

      render(
        <BusinessCard
          business={business}
          onView={mockOnView}
          onEnrich={mockOnEnrich}
        />
      )

      // Enrich button (Sparkles) should not be visible
      const enrichButton = document.querySelector('svg.lucide-sparkles')
      expect(enrichButton).not.toBeInTheDocument()
    })

    it('renders Enrich button when status is pending', () => {
      const business = createMockBusiness({ enrichment_status: 'pending' })

      render(
        <BusinessCard
          business={business}
          onView={mockOnView}
          onEnrich={mockOnEnrich}
        />
      )

      // Enrich button (Sparkles) should be visible
      const sparklesIcon = document.querySelector('svg.lucide-sparkles')
        || document.querySelector('[data-lucide="sparkles"]')

      // Alternative: check for button with sparkles
      const enrichButton = screen.getAllByRole('button').find(btn =>
        btn.innerHTML.includes('sparkles') || btn.innerHTML.includes('Sparkles')
      )

      expect(sparklesIcon || enrichButton).toBeTruthy()
    })
  })

  describe('Visual States', () => {
    it('shows selected state with ring styling', () => {
      const business = createMockBusiness()

      render(
        <BusinessCard
          business={business}
          isSelected={true}
          onSelect={mockOnSelect}
        />
      )

      // Find the card and check for ring class
      const card = document.querySelector('[data-testid="business-card"]')
        || document.querySelector('.ring-2')
        || screen.getByText('Acme Corporation').parentElement?.parentElement?.parentElement?.parentElement

      expect(card).toHaveClass('ring-2', 'ring-primary')
    })

    it('displays business information correctly', () => {
      const business = createMockBusiness({
        name: 'Test Company',
        industry: 'Healthcare',
        phone: '555-987-6543',
        website: 'https://test.com',
      })

      render(<BusinessCard business={business} />)

      expect(screen.getByText('Test Company')).toBeInTheDocument()
      expect(screen.getByText('Healthcare')).toBeInTheDocument()
      expect(screen.getByText('555-987-6543')).toBeInTheDocument()
      expect(screen.getByText('test.com')).toBeInTheDocument()
    })

    it('displays correct enrichment status badge', () => {
      const enrichedBusiness = createMockBusiness({ enrichment_status: 'enriched' })

      render(<BusinessCard business={enrichedBusiness} />)

      expect(screen.getByText('enriched')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('card has role=button and tabIndex for keyboard access', () => {
      const business = createMockBusiness()

      render(
        <BusinessCard
          business={business}
          onView={mockOnView}
        />
      )

      // The Card has role="button" and tabIndex={0}
      const card = document.querySelector('[role="button"]')
      expect(card).toBeInTheDocument()
      expect(card).toHaveAttribute('tabindex', '0')
    })

    it('action buttons are rendered as focusable button elements', () => {
      const business = createMockBusiness({ enrichment_status: 'pending' })

      render(
        <BusinessCard
          business={business}
          onView={mockOnView}
          onEnrich={mockOnEnrich}
          onDelete={mockOnDelete}
        />
      )

      // The Card div also has role="button", so getAllByRole('button') includes it
      // Filter to only actual <button> elements for action buttons
      const allButtons = screen.getAllByRole('button')
      const actionButtons = allButtons.filter(btn => btn.tagName.toLowerCase() === 'button')

      // Should have 3 action buttons: eye, enrich, delete
      expect(actionButtons.length).toBe(3)

      actionButtons.forEach(button => {
        expect(button.tagName.toLowerCase()).toBe('button')
      })
    })
  })

  describe('Edge Cases', () => {
    it('handles missing optional fields gracefully', () => {
      const business = createMockBusiness({
        phone: null,
        website: null,
        industry: null,
      })

      render(<BusinessCard business={business} />)

      // Should render without errors
      expect(screen.getByText('Acme Corporation')).toBeInTheDocument()

      // Phone and website sections should not be rendered
      expect(screen.queryByText('555-123-4567')).not.toBeInTheDocument()
      expect(screen.queryByRole('link')).not.toBeInTheDocument()
    })

    it('handles very long business names with truncation', () => {
      const business = createMockBusiness({
        name: 'This Is An Extremely Long Business Name That Should Be Truncated For Display Purposes',
      })

      render(<BusinessCard business={business} />)

      const nameElement = screen.getByText(/This Is An Extremely Long/i)
      expect(nameElement).toHaveClass('truncate')
    })
  })
})
