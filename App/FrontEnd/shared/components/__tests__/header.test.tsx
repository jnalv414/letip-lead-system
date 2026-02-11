/**
 * Test Suite: Header Component
 *
 * Tests for the shared Header layout component.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Mock next-themes for ThemeToggle
vi.mock('next-themes', () => ({
  useTheme: () => ({
    theme: 'dark',
    setTheme: vi.fn(),
    resolvedTheme: 'dark',
    themes: ['light', 'dark', 'system'],
    systemTheme: 'light',
  }),
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
      <div {...props}>{children}</div>
    ),
    aside: ({ children, ...props }: React.HTMLAttributes<HTMLElement>) => (
      <aside {...props}>{children}</aside>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

import { Header } from '../layout/header'

describe('Header Component', () => {
  let mockOnMenuClick: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockOnMenuClick = vi.fn()
  })

  describe('Rendering', () => {
    it('renders a header element', () => {
      render(<Header onMenuClick={mockOnMenuClick} />)
      const header = document.querySelector('header')
      expect(header).toBeInTheDocument()
    })

    it('renders sticky at top', () => {
      render(<Header onMenuClick={mockOnMenuClick} />)
      const header = document.querySelector('header')
      expect(header?.className).toContain('sticky')
      expect(header?.className).toContain('top-0')
    })
  })

  describe('Page Title', () => {
    it('renders title when provided', () => {
      render(<Header onMenuClick={mockOnMenuClick} title="Dashboard" />)
      expect(screen.getByText('Dashboard')).toBeInTheDocument()
    })

    it('renders title as h1 element', () => {
      render(<Header onMenuClick={mockOnMenuClick} title="Leads" />)
      const title = screen.getByText('Leads')
      expect(title.tagName.toLowerCase()).toBe('h1')
    })

    it('does not render title when not provided', () => {
      render(<Header onMenuClick={mockOnMenuClick} />)
      const h1 = document.querySelector('h1')
      expect(h1).toBeNull()
    })
  })

  describe('Menu Trigger', () => {
    it('renders menu button with accessible label', () => {
      render(<Header onMenuClick={mockOnMenuClick} />)
      const menuButton = screen.getByLabelText('Open menu')
      expect(menuButton).toBeInTheDocument()
    })

    it('calls onMenuClick when menu button is clicked', async () => {
      const user = userEvent.setup()
      render(<Header onMenuClick={mockOnMenuClick} />)

      const menuButton = screen.getByLabelText('Open menu')
      await user.click(menuButton)

      expect(mockOnMenuClick).toHaveBeenCalledTimes(1)
    })
  })

  describe('Search', () => {
    it('renders search input', () => {
      render(<Header onMenuClick={mockOnMenuClick} />)
      const searchInput = screen.getByPlaceholderText('Search businesses...')
      expect(searchInput).toBeInTheDocument()
    })

    it('search input has type=search', () => {
      render(<Header onMenuClick={mockOnMenuClick} />)
      const searchInput = screen.getByPlaceholderText('Search businesses...')
      expect(searchInput).toHaveAttribute('type', 'search')
    })
  })

  describe('Notifications', () => {
    it('renders notifications button with accessible label', () => {
      render(<Header onMenuClick={mockOnMenuClick} />)
      const notifButton = screen.getByLabelText('Notifications')
      expect(notifButton).toBeInTheDocument()
    })

    it('shows notification indicator dot', () => {
      render(<Header onMenuClick={mockOnMenuClick} />)
      const notifButton = screen.getByLabelText('Notifications')
      const dot = notifButton.querySelector('.rounded-full.bg-violet-500')
      expect(dot).toBeInTheDocument()
    })
  })

  describe('User Menu', () => {
    it('renders user menu button with accessible label', () => {
      render(<Header onMenuClick={mockOnMenuClick} />)
      const userButton = screen.getByLabelText('User menu')
      expect(userButton).toBeInTheDocument()
    })

    it('renders user avatar', () => {
      render(<Header onMenuClick={mockOnMenuClick} />)
      const userButton = screen.getByLabelText('User menu')
      const avatar = userButton.querySelector('.rounded-full')
      expect(avatar).toBeInTheDocument()
    })
  })

  describe('Theme Toggle', () => {
    it('renders theme toggle button', () => {
      render(<Header onMenuClick={mockOnMenuClick} />)
      // ThemeToggle renders a button with aria-label containing "mode"
      const themeButton = screen.getByLabelText(/mode/i)
      expect(themeButton).toBeInTheDocument()
    })
  })

  describe('Layout', () => {
    it('has backdrop blur for glass effect', () => {
      render(<Header onMenuClick={mockOnMenuClick} />)
      const header = document.querySelector('header')
      expect(header?.className).toContain('backdrop-blur')
    })

    it('has border-b for bottom border', () => {
      render(<Header onMenuClick={mockOnMenuClick} />)
      const header = document.querySelector('header')
      expect(header?.className).toContain('border-b')
    })

    it('has z-30 for proper stacking', () => {
      render(<Header onMenuClick={mockOnMenuClick} />)
      const header = document.querySelector('header')
      expect(header?.className).toContain('z-30')
    })
  })
})
