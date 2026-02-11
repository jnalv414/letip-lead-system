/**
 * Test Suite: Button Component
 *
 * Tests for the shared Button component variants, sizes, states, and behavior.
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from '../ui/button'

describe('Button Component', () => {
  describe('Rendering', () => {
    it('renders with default variant and size', () => {
      render(<Button>Click me</Button>)

      const button = screen.getByRole('button', { name: 'Click me' })
      expect(button).toBeInTheDocument()
      expect(button.tagName.toLowerCase()).toBe('button')
    })

    it('renders children content', () => {
      render(
        <Button>
          <span>Icon</span> Save
        </Button>,
      )

      expect(screen.getByText('Icon')).toBeInTheDocument()
      expect(screen.getByText('Save')).toBeInTheDocument()
    })
  })

  describe('Variants', () => {
    it('applies default variant classes', () => {
      render(<Button variant="default">Default</Button>)
      const button = screen.getByRole('button')
      expect(button.className).toContain('bg-primary')
    })

    it('applies destructive variant classes', () => {
      render(<Button variant="destructive">Delete</Button>)
      const button = screen.getByRole('button')
      expect(button.className).toContain('bg-destructive')
    })

    it('applies outline variant classes', () => {
      render(<Button variant="outline">Outline</Button>)
      const button = screen.getByRole('button')
      expect(button.className).toContain('border')
    })

    it('applies ghost variant classes', () => {
      render(<Button variant="ghost">Ghost</Button>)
      const button = screen.getByRole('button')
      expect(button.className).toContain('hover:bg-accent')
    })

    it('applies link variant classes', () => {
      render(<Button variant="link">Link</Button>)
      const button = screen.getByRole('button')
      expect(button.className).toContain('underline-offset-4')
    })

    it('applies glass variant classes', () => {
      render(<Button variant="glass">Glass</Button>)
      const button = screen.getByRole('button')
      expect(button.className).toContain('backdrop-blur-md')
    })
  })

  describe('Sizes', () => {
    it('applies default size', () => {
      render(<Button size="default">Default</Button>)
      const button = screen.getByRole('button')
      expect(button.className).toContain('h-10')
    })

    it('applies sm size', () => {
      render(<Button size="sm">Small</Button>)
      const button = screen.getByRole('button')
      expect(button.className).toContain('h-8')
    })

    it('applies lg size', () => {
      render(<Button size="lg">Large</Button>)
      const button = screen.getByRole('button')
      expect(button.className).toContain('h-12')
    })

    it('applies icon size', () => {
      render(<Button size="icon">X</Button>)
      const button = screen.getByRole('button')
      expect(button.className).toContain('h-10')
      expect(button.className).toContain('w-10')
    })
  })

  describe('Loading State', () => {
    it('shows loading spinner when isLoading is true', () => {
      render(<Button isLoading>Submit</Button>)

      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
      expect(screen.getByText('Loading...')).toBeInTheDocument()
      // Original children should not be visible
      expect(screen.queryByText('Submit')).not.toBeInTheDocument()
    })

    it('renders spinner SVG in loading state', () => {
      render(<Button isLoading>Submit</Button>)

      const button = screen.getByRole('button')
      const spinner = button.querySelector('svg.animate-spin')
      expect(spinner).toBeInTheDocument()
    })

    it('is disabled when loading', () => {
      render(<Button isLoading>Submit</Button>)
      expect(screen.getByRole('button')).toBeDisabled()
    })
  })

  describe('Disabled State', () => {
    it('is disabled when disabled prop is true', () => {
      render(<Button disabled>Disabled</Button>)
      expect(screen.getByRole('button')).toBeDisabled()
    })

    it('applies disabled styling', () => {
      render(<Button disabled>Disabled</Button>)
      const button = screen.getByRole('button')
      expect(button.className).toContain('disabled:opacity-50')
    })

    it('does not fire onClick when disabled', async () => {
      const onClick = vi.fn()
      const user = userEvent.setup()

      render(
        <Button disabled onClick={onClick}>
          Disabled
        </Button>,
      )

      await user.click(screen.getByRole('button'))
      expect(onClick).not.toHaveBeenCalled()
    })
  })

  describe('Click Handling', () => {
    it('calls onClick when clicked', async () => {
      const onClick = vi.fn()
      const user = userEvent.setup()

      render(<Button onClick={onClick}>Click</Button>)
      await user.click(screen.getByRole('button'))

      expect(onClick).toHaveBeenCalledTimes(1)
    })

    it('does not fire onClick when isLoading', async () => {
      const onClick = vi.fn()
      const user = userEvent.setup()

      render(
        <Button isLoading onClick={onClick}>
          Click
        </Button>,
      )

      await user.click(screen.getByRole('button'))
      expect(onClick).not.toHaveBeenCalled()
    })
  })

  describe('Ref Forwarding', () => {
    it('forwards ref to the button element', () => {
      const ref = vi.fn()
      render(<Button ref={ref}>Ref Button</Button>)

      expect(ref).toHaveBeenCalled()
      expect(ref.mock.calls[0][0]).toBeInstanceOf(HTMLButtonElement)
    })
  })

  describe('Custom className', () => {
    it('merges custom className with variant classes', () => {
      render(<Button className="my-custom-class">Custom</Button>)
      const button = screen.getByRole('button')
      expect(button.className).toContain('my-custom-class')
      expect(button.className).toContain('bg-primary') // default variant still applied
    })
  })

  describe('HTML Attributes', () => {
    it('passes through type attribute', () => {
      render(<Button type="submit">Submit</Button>)
      expect(screen.getByRole('button')).toHaveAttribute('type', 'submit')
    })

    it('passes through aria-label', () => {
      render(<Button aria-label="Close dialog">X</Button>)
      expect(screen.getByRole('button')).toHaveAttribute(
        'aria-label',
        'Close dialog',
      )
    })
  })
})
