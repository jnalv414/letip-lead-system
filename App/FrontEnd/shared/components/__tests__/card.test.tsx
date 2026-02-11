/**
 * Test Suite: Card Component
 *
 * Tests for the shared Card component and its sub-components.
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '../ui/card'

describe('Card Component', () => {
  describe('Rendering', () => {
    it('renders a div element', () => {
      render(<Card data-testid="card">Content</Card>)
      const card = screen.getByTestId('card')
      expect(card.tagName.toLowerCase()).toBe('div')
    })

    it('renders children', () => {
      render(<Card>Card Content</Card>)
      expect(screen.getByText('Card Content')).toBeInTheDocument()
    })
  })

  describe('Variants', () => {
    it('applies default variant classes', () => {
      render(<Card data-testid="card">Default</Card>)
      const card = screen.getByTestId('card')
      expect(card.className).toContain('bg-card')
      expect(card.className).toContain('border-border')
    })

    it('applies glass variant classes', () => {
      render(
        <Card variant="glass" data-testid="card">
          Glass
        </Card>,
      )
      const card = screen.getByTestId('card')
      expect(card.className).toContain('backdrop-blur-md')
      expect(card.className).toContain('shadow-xl')
    })

    it('applies elevated variant classes', () => {
      render(
        <Card variant="elevated" data-testid="card">
          Elevated
        </Card>,
      )
      const card = screen.getByTestId('card')
      expect(card.className).toContain('shadow-lg')
    })
  })

  describe('Common styles', () => {
    it('always has rounded-xl and border', () => {
      render(<Card data-testid="card">Styled</Card>)
      const card = screen.getByTestId('card')
      expect(card.className).toContain('rounded-xl')
      expect(card.className).toContain('border')
    })

    it('has transition-all for animation', () => {
      render(<Card data-testid="card">Transition</Card>)
      const card = screen.getByTestId('card')
      expect(card.className).toContain('transition-all')
    })
  })

  describe('Custom className', () => {
    it('merges custom className', () => {
      render(
        <Card className="my-class" data-testid="card">
          Custom
        </Card>,
      )
      const card = screen.getByTestId('card')
      expect(card.className).toContain('my-class')
      expect(card.className).toContain('rounded-xl')
    })
  })

  describe('Ref Forwarding', () => {
    it('forwards ref to the div element', () => {
      const ref = vi.fn()
      render(<Card ref={ref}>Ref Card</Card>)
      expect(ref).toHaveBeenCalled()
      expect(ref.mock.calls[0][0]).toBeInstanceOf(HTMLDivElement)
    })
  })

  describe('Event Handling', () => {
    it('handles onClick events', async () => {
      const onClick = vi.fn()
      const user = userEvent.setup()

      render(
        <Card onClick={onClick} data-testid="card">
          Clickable
        </Card>,
      )

      await user.click(screen.getByTestId('card'))
      expect(onClick).toHaveBeenCalledTimes(1)
    })
  })

  describe('HTML Attributes', () => {
    it('passes through data attributes', () => {
      render(<Card data-testid="my-card">Attrs</Card>)
      expect(screen.getByTestId('my-card')).toBeInTheDocument()
    })

    it('passes through role and tabIndex', () => {
      render(
        <Card role="button" tabIndex={0} data-testid="card">
          Button Card
        </Card>,
      )
      const card = screen.getByTestId('card')
      expect(card).toHaveAttribute('role', 'button')
      expect(card).toHaveAttribute('tabindex', '0')
    })
  })
})

describe('CardHeader Component', () => {
  it('renders with correct padding', () => {
    render(<CardHeader data-testid="header">Header</CardHeader>)
    const header = screen.getByTestId('header')
    expect(header.className).toContain('p-6')
  })

  it('has flex column layout', () => {
    render(<CardHeader data-testid="header">Header</CardHeader>)
    const header = screen.getByTestId('header')
    expect(header.className).toContain('flex')
    expect(header.className).toContain('flex-col')
  })

  it('forwards ref', () => {
    const ref = vi.fn()
    render(<CardHeader ref={ref}>Header</CardHeader>)
    expect(ref).toHaveBeenCalled()
  })
})

describe('CardTitle Component', () => {
  it('renders as h3 element', () => {
    render(<CardTitle>Title</CardTitle>)
    const title = screen.getByText('Title')
    expect(title.tagName.toLowerCase()).toBe('h3')
  })

  it('has font-semibold styling', () => {
    render(<CardTitle>Title</CardTitle>)
    const title = screen.getByText('Title')
    expect(title.className).toContain('font-semibold')
  })
})

describe('CardDescription Component', () => {
  it('renders as p element', () => {
    render(<CardDescription>Description</CardDescription>)
    const desc = screen.getByText('Description')
    expect(desc.tagName.toLowerCase()).toBe('p')
  })

  it('has muted foreground styling', () => {
    render(<CardDescription>Description</CardDescription>)
    const desc = screen.getByText('Description')
    expect(desc.className).toContain('text-muted-foreground')
  })
})

describe('CardContent Component', () => {
  it('renders with padding', () => {
    render(<CardContent data-testid="content">Content</CardContent>)
    const content = screen.getByTestId('content')
    expect(content.className).toContain('p-6')
  })

  it('forwards ref', () => {
    const ref = vi.fn()
    render(<CardContent ref={ref}>Content</CardContent>)
    expect(ref).toHaveBeenCalled()
  })
})

describe('CardFooter Component', () => {
  it('renders with flex layout', () => {
    render(<CardFooter data-testid="footer">Footer</CardFooter>)
    const footer = screen.getByTestId('footer')
    expect(footer.className).toContain('flex')
    expect(footer.className).toContain('items-center')
  })

  it('renders with padding', () => {
    render(<CardFooter data-testid="footer">Footer</CardFooter>)
    const footer = screen.getByTestId('footer')
    expect(footer.className).toContain('p-6')
  })
})

describe('Card Composition', () => {
  it('renders a full card with all sub-components', () => {
    render(
      <Card data-testid="full-card">
        <CardHeader>
          <CardTitle>Card Title</CardTitle>
          <CardDescription>Card description text</CardDescription>
        </CardHeader>
        <CardContent>Main content here</CardContent>
        <CardFooter>Footer content</CardFooter>
      </Card>,
    )

    expect(screen.getByTestId('full-card')).toBeInTheDocument()
    expect(screen.getByText('Card Title')).toBeInTheDocument()
    expect(screen.getByText('Card description text')).toBeInTheDocument()
    expect(screen.getByText('Main content here')).toBeInTheDocument()
    expect(screen.getByText('Footer content')).toBeInTheDocument()
  })
})
