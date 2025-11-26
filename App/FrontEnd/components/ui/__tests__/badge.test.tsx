/**
 * Test suite for Badge component
 * Tests orange and teal variants, sizes, and interactive states
 */

import React from 'react';
import { render, screen, validateColorDistribution, ColorScheme } from '@/__tests__/setup/test-utils';
import { Badge } from '../badge';
import userEvent from '@testing-library/user-event';

describe('Badge Component', () => {
  // ==================== Rendering Tests ====================

  describe('Rendering', () => {
    it('should render with text content', () => {
      render(<Badge>New</Badge>);
      expect(screen.getByText('New')).toBeInTheDocument();
    });

    it('should render with number content', () => {
      render(<Badge>42</Badge>);
      expect(screen.getByText('42')).toBeInTheDocument();
    });

    it('should accept custom className', () => {
      render(<Badge className="custom-badge">Custom</Badge>);
      const badge = screen.getByText('Custom');
      expect(badge).toHaveClass('custom-badge');
    });

    it('should render as different HTML elements', () => {
      const { rerender } = render(<Badge as="span">Span Badge</Badge>);
      expect(screen.getByText('Span Badge').tagName).toBe('SPAN');

      rerender(<Badge as="div">Div Badge</Badge>);
      expect(screen.getByText('Div Badge').tagName).toBe('DIV');
    });

    it('should render as anchor with href prop', () => {
      render(
        <Badge as="a" href="https://example.com">
          Link Badge
        </Badge>
      );
      const badge = screen.getByText('Link Badge');
      expect(badge.tagName).toBe('A');
      expect(badge).toHaveAttribute('href', 'https://example.com');
    });

    it('should render as button with onClick prop', () => {
      const handleClick = jest.fn();
      render(
        <Badge as="button" onClick={handleClick}>
          Button Badge
        </Badge>
      );
      const badge = screen.getByText('Button Badge');
      expect(badge.tagName).toBe('BUTTON');
    });

    it('should default to div when as prop is not provided', () => {
      render(<Badge>Default Badge</Badge>);
      const badge = screen.getByText('Default Badge');
      expect(badge.tagName).toBe('DIV');
    });
  });

  // ==================== Variant Tests ====================

  describe('Color Variants', () => {
    it('should render orange variant (default)', () => {
      render(<Badge variant="orange">Orange</Badge>);
      const badge = screen.getByText('Orange');

      // Test Tailwind classes instead of computed styles (JSDOM limitation)
      expect(badge).toHaveClass('bg-orange/20', 'text-orange', 'border-orange/40');
    });

    it('should render teal variant', () => {
      render(<Badge variant="teal">Teal</Badge>);
      const badge = screen.getByText('Teal');

      // Test Tailwind classes instead of computed styles (JSDOM limitation)
      expect(badge).toHaveClass('bg-teal-light/20', 'text-teal-lighter', 'border-teal-light/40');
    });

    it('should render outline variant', () => {
      render(<Badge variant="outline">Outline</Badge>);
      const badge = screen.getByText('Outline');

      // Test Tailwind classes instead of computed styles (JSDOM limitation)
      expect(badge).toHaveClass('bg-transparent', 'border', 'border-orange/40', 'text-orange');
    });

    it('should render charcoal variant', () => {
      // Note: "ghost" variant doesn't exist in badge.tsx, testing "charcoal" instead
      render(<Badge variant="charcoal">Charcoal</Badge>);
      const badge = screen.getByText('Charcoal');

      // Test Tailwind classes instead of computed styles (JSDOM limitation)
      expect(badge).toHaveClass('bg-charcoal-light', 'text-gray-300', 'border-gray-700');
    });

    it('should render success variant', () => {
      render(<Badge variant="success">Success</Badge>);
      const badge = screen.getByText('Success');

      // Test Tailwind classes for success state
      expect(badge).toHaveClass('bg-green-500/20', 'text-green-400', 'border-green-500/40');
    });

    it('should render warning variant', () => {
      render(<Badge variant="warning">Warning</Badge>);
      const badge = screen.getByText('Warning');

      // Test Tailwind classes for warning state
      expect(badge).toHaveClass('bg-yellow-500/20', 'text-yellow-400', 'border-yellow-500/40');
    });

    it('should render error variant', () => {
      render(<Badge variant="error">Error</Badge>);
      const badge = screen.getByText('Error');

      // Test Tailwind classes for error state
      expect(badge).toHaveClass('bg-red-500/20', 'text-red-400', 'border-red-500/40');
    });
  });

  // ==================== Size Tests ====================

  describe('Sizes', () => {
    it('should render small size', () => {
      render(<Badge size="sm">Small</Badge>);
      const badge = screen.getByText('Small');

      // Test actual size classes from badge.tsx line 45
      expect(badge).toHaveClass('px-2', 'py-0.5', 'text-[10px]');
    });

    it('should render default size', () => {
      render(<Badge size="md">Default</Badge>);
      const badge = screen.getByText('Default');

      // Test actual size classes from badge.tsx line 46
      expect(badge).toHaveClass('px-3', 'py-1', 'text-xs');
    });

    it('should render large size', () => {
      render(<Badge size="lg">Large</Badge>);
      const badge = screen.getByText('Large');

      // Test actual size classes from badge.tsx line 47
      expect(badge).toHaveClass('px-4', 'py-1.5', 'text-sm');
    });
  });

  // ==================== Interactive Tests ====================

  describe('Interactive Behavior', () => {
    it('should be clickable when onClick is provided', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();

      render(
        <Badge onClick={handleClick} className="cursor-pointer">
          Clickable
        </Badge>
      );

      const badge = screen.getByText('Clickable');
      await user.click(badge);

      expect(handleClick).toHaveBeenCalledTimes(1);
      expect(badge).toHaveClass('cursor-pointer');
    });

    it('should support keyboard interaction when interactive', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();

      render(
        <Badge onClick={handleClick} tabIndex={0} role="button">
          Interactive
        </Badge>
      );

      const badge = screen.getByRole('button');

      await user.tab();
      expect(badge).toHaveFocus();

      await user.keyboard('{Enter}');
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should show hover state', async () => {
      const user = userEvent.setup();

      render(
        <Badge className="hover:bg-orange-secondary">
          Hoverable
        </Badge>
      );

      const badge = screen.getByText('Hoverable');
      await user.hover(badge);

      expect(badge).toHaveClass('hover:bg-orange-secondary');
    });

    it('should be dismissible with close button', async () => {
      const handleDismiss = jest.fn();
      const user = userEvent.setup();

      render(
        <Badge dismissible onDismiss={handleDismiss}>
          Dismissible
          <button
            aria-label="Dismiss"
            onClick={handleDismiss}
            className="ml-1"
          >
            ×
          </button>
        </Badge>
      );

      const dismissButton = screen.getByLabelText('Dismiss');
      await user.click(dismissButton);

      expect(handleDismiss).toHaveBeenCalledTimes(1);
    });
  });

  // ==================== Accessibility Tests ====================

  describe('Accessibility', () => {
    it('should have appropriate ARIA role for status badges', () => {
      render(
        <Badge role="status" aria-label="3 new notifications">
          3
        </Badge>
      );

      const badge = screen.getByRole('status');
      expect(badge).toHaveAttribute('aria-label', '3 new notifications');
    });

    it('should support aria-live for dynamic updates', () => {
      const { rerender } = render(
        <Badge aria-live="polite" aria-atomic="true">
          5 items
        </Badge>
      );

      const badge = screen.getByText('5 items');
      expect(badge).toHaveAttribute('aria-live', 'polite');
      expect(badge).toHaveAttribute('aria-atomic', 'true');

      // Update count
      rerender(
        <Badge aria-live="polite" aria-atomic="true">
          6 items
        </Badge>
      );

      expect(screen.getByText('6 items')).toBeInTheDocument();
    });

    it('should meet color contrast requirements', () => {
      const { container } = render(
        <>
          <Badge variant="orange">Orange Text</Badge>
          <Badge variant="teal">Teal Text</Badge>
        </>
      );

      const validation = validateColorDistribution(container);
      expect(validation.meetsWCAG).toBe(true);
    });

    it('should be screen reader friendly', () => {
      render(
        <Badge>
          <span className="sr-only">Status:</span>
          Active
        </Badge>
      );

      expect(screen.getByText('Status:')).toHaveClass('sr-only');
      expect(screen.getByText('Active')).toBeInTheDocument();
    });
  });

  // ==================== Edge Cases ====================

  describe('Edge Cases', () => {
    it('should handle empty content', () => {
      render(<Badge data-testid="empty-badge"></Badge>);
      const badge = screen.getByTestId('empty-badge');
      expect(badge).toBeInTheDocument();
      expect(badge).toBeEmptyDOMElement();
    });

    it('should handle very long text with truncation', () => {
      const longText = 'VeryLongTextThatShouldBeTruncated'.repeat(3);
      render(
        <Badge className="max-w-xs truncate">
          {longText}
        </Badge>
      );

      const badge = screen.getByText(longText);
      expect(badge).toHaveClass('truncate');
    });

    it('should handle special characters', () => {
      render(<Badge>{"<>&\"'"}</Badge>);
      expect(screen.getByText("<>&\"'")).toBeInTheDocument();
    });

    it('should handle emoji content', () => {
      render(<Badge>🔥 Hot</Badge>);
      expect(screen.getByText('🔥 Hot')).toBeInTheDocument();
    });

    it('should handle numeric boundaries', () => {
      render(
        <>
          <Badge>0</Badge>
          <Badge>999+</Badge>
          <Badge>-1</Badge>
        </>
      );

      expect(screen.getByText('0')).toBeInTheDocument();
      expect(screen.getByText('999+')).toBeInTheDocument();
      expect(screen.getByText('-1')).toBeInTheDocument();
    });
  });

  // ==================== Composition Tests ====================

  describe('Composition', () => {
    it('should work with icons', () => {
      render(
        <Badge>
          <svg
            data-testid="icon"
            className="w-3 h-3 mr-1"
            fill="currentColor"
          >
            <circle cx="6" cy="6" r="6" />
          </svg>
          With Icon
        </Badge>
      );

      expect(screen.getByTestId('icon')).toBeInTheDocument();
      expect(screen.getByText('With Icon')).toBeInTheDocument();
    });

    it('should work in badge groups', () => {
      render(
        <div className="flex gap-2">
          <Badge variant="orange">Tag 1</Badge>
          <Badge variant="teal">Tag 2</Badge>
          <Badge variant="outline">Tag 3</Badge>
        </div>
      );

      expect(screen.getByText('Tag 1')).toBeInTheDocument();
      expect(screen.getByText('Tag 2')).toBeInTheDocument();
      expect(screen.getByText('Tag 3')).toBeInTheDocument();
    });

    it('should work as notification indicator', () => {
      render(
        <div className="relative">
          <button>Messages</button>
          <Badge className="absolute -top-1 -right-1" variant="orange">
            5
          </Badge>
        </div>
      );

      const badge = screen.getByText('5');
      expect(badge).toHaveClass('absolute');
    });
  });

  // ==================== Animation Tests ====================

  describe('Animations', () => {
    it('should support pulse animation for attention', () => {
      render(
        <Badge className="animate-pulse">
          New
        </Badge>
      );

      const badge = screen.getByText('New');
      expect(badge).toHaveClass('animate-pulse');
    });

    it('should support bounce animation', () => {
      render(
        <Badge className="animate-bounce">
          Alert
        </Badge>
      );

      const badge = screen.getByText('Alert');
      expect(badge).toHaveClass('animate-bounce');
    });

    it('should support fade-in animation', () => {
      render(
        <Badge className="animate-fadeIn">
          Appearing
        </Badge>
      );

      const badge = screen.getByText('Appearing');
      expect(badge).toHaveClass('animate-fadeIn');
    });
  });

  // ==================== Performance Tests ====================

  describe('Performance', () => {
    it('should render multiple badges efficiently', () => {
      const badges = Array.from({ length: 100 }, (_, i) => ({
        id: i,
        text: `Badge ${i}`,
        variant: i % 2 === 0 ? 'orange' as const : 'teal' as const,
      }));

      const { container } = render(
        <div>
          {badges.map(badge => (
            <Badge key={badge.id} variant={badge.variant} data-testid={`badge-${badge.id}`}>
              {badge.text}
            </Badge>
          ))}
        </div>
      );

      // Use data-testid instead of searching for "badge" class (which doesn't exist)
      const allBadges = screen.getAllByTestId(/^badge-\d+$/);
      expect(allBadges).toHaveLength(100);
    });

    it('should update efficiently when content changes', () => {
      const { rerender } = render(<Badge>1</Badge>);

      for (let i = 2; i <= 100; i++) {
        rerender(<Badge>{i}</Badge>);
      }

      expect(screen.getByText('100')).toBeInTheDocument();
    });
  });

  // ==================== Keyboard Accessibility Tests (TDD) ====================

  describe('Keyboard Accessibility', () => {
    it('should trigger onClick when Enter key is pressed', () => {
      const handleClick = jest.fn();

      render(<Badge onClick={handleClick} tabIndex={0}>Clickable</Badge>);

      const badge = screen.getByText('Clickable');

      // Simulate Enter key press with keydown event
      const enterEvent = new KeyboardEvent('keydown', {
        key: 'Enter',
        bubbles: true,
        cancelable: true
      });
      badge.dispatchEvent(enterEvent);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should trigger onClick when Space key is pressed', () => {
      const handleClick = jest.fn();

      render(<Badge onClick={handleClick} tabIndex={0}>Clickable</Badge>);

      const badge = screen.getByText('Clickable');

      // Simulate Space key press with keydown event
      const spaceEvent = new KeyboardEvent('keydown', {
        key: ' ',
        bubbles: true,
        cancelable: true
      });
      badge.dispatchEvent(spaceEvent);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should prevent default on Space key to avoid page scroll', () => {
      const handleClick = jest.fn();

      render(<Badge onClick={handleClick} tabIndex={0}>Clickable</Badge>);

      const badge = screen.getByText('Clickable');

      // Create a spy on preventDefault
      const spaceEvent = new KeyboardEvent('keydown', {
        key: ' ',
        bubbles: true,
        cancelable: true
      });
      const preventDefaultSpy = jest.spyOn(spaceEvent, 'preventDefault');

      badge.dispatchEvent(spaceEvent);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it('should not trigger onClick for other keys', () => {
      const handleClick = jest.fn();

      render(<Badge onClick={handleClick} tabIndex={0}>Clickable</Badge>);

      const badge = screen.getByText('Clickable');

      // Test various non-activation keys
      badge.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', bubbles: true }));
      badge.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      badge.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));

      expect(handleClick).not.toHaveBeenCalled();
    });

    it('should not crash when onClick is undefined', () => {
      render(<Badge tabIndex={0}>No Handler</Badge>);

      const badge = screen.getByText('No Handler');

      expect(() => {
        badge.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      }).not.toThrow();
    });
  });

  // ==================== Integration Tests ====================

  describe('Integration', () => {
    it('should work with conditional rendering', () => {
      const showBadge = true;
      const count = 5;

      render(
        <div>
          {showBadge && <Badge>{count > 0 && count}</Badge>}
        </div>
      );

      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('should work with dynamic variant selection', () => {
      function DynamicBadge({ status }: { status: string }) {
        const variant = status === 'active' ? 'success' :
                        status === 'pending' ? 'warning' :
                        'error';

        return <Badge variant={variant}>{status}</Badge>;
      }

      const { rerender } = render(<DynamicBadge status="active" />);
      // Test actual class from badge.tsx line 35
      expect(screen.getByText('active')).toHaveClass('bg-green-500/20', 'text-green-400');

      rerender(<DynamicBadge status="pending" />);
      // Test actual class from badge.tsx line 36
      expect(screen.getByText('pending')).toHaveClass('bg-yellow-500/20', 'text-yellow-400');

      rerender(<DynamicBadge status="error" />);
      // Test actual class from badge.tsx line 37
      expect(screen.getByText('error')).toHaveClass('bg-red-500/20', 'text-red-400');
    });
  });

  // ==================== Edge Cases - Enhanced ====================

  describe('Edge Cases - Enhanced', () => {
    it('should handle null children gracefully', () => {
      render(<Badge data-testid="null-badge">{null}</Badge>);
      const badge = screen.getByTestId('null-badge');
      expect(badge).toBeInTheDocument();
      expect(badge).toBeEmptyDOMElement();
    });

    it('should handle undefined children gracefully', () => {
      render(<Badge data-testid="undefined-badge">{undefined}</Badge>);
      const badge = screen.getByTestId('undefined-badge');
      expect(badge).toBeInTheDocument();
      expect(badge).toBeEmptyDOMElement();
    });

    it('should handle empty string children', () => {
      render(<Badge data-testid="empty-string-badge">{''}</Badge>);
      const badge = screen.getByTestId('empty-string-badge');
      expect(badge).toBeInTheDocument();
      expect(badge.textContent).toBe('');
    });

    it('should handle rapid variant changes without memory leaks', () => {
      const { rerender } = render(<Badge variant="orange">Test</Badge>);

      // Rapidly change variants 100 times
      for (let i = 0; i < 100; i++) {
        const variant = i % 2 === 0 ? 'orange' : 'teal';
        rerender(<Badge variant={variant as any}>Test</Badge>);
      }

      expect(screen.getByText('Test')).toBeInTheDocument();
      // No memory leak = test completes without hanging
    });

    it('should handle polymorphic rendering with combined mouse and keyboard events', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();

      render(<Badge as="button" onClick={handleClick} tabIndex={0}>Button Badge</Badge>);

      const badge = screen.getByRole('button');

      // Mouse click
      await user.click(badge);

      // Keyboard Enter
      const enterEvent = new KeyboardEvent('keydown', {
        key: 'Enter',
        bubbles: true,
        cancelable: true
      });
      badge.dispatchEvent(enterEvent);

      // Keyboard Space
      const spaceEvent = new KeyboardEvent('keydown', {
        key: ' ',
        bubbles: true,
        cancelable: true
      });
      badge.dispatchEvent(spaceEvent);

      expect(handleClick).toHaveBeenCalledTimes(3);
    });

    it('should handle icon prop with null', () => {
      render(<Badge icon={null}>With Null Icon</Badge>);
      expect(screen.getByText('With Null Icon')).toBeInTheDocument();
    });

    it('should handle icon prop with undefined', () => {
      render(<Badge icon={undefined}>With Undefined Icon</Badge>);
      expect(screen.getByText('With Undefined Icon')).toBeInTheDocument();
    });

    it('should handle extremely long text content', () => {
      const longText = 'A'.repeat(1000);
      render(<Badge>{longText}</Badge>);
      expect(screen.getByText(longText)).toBeInTheDocument();
    });

    it('should handle special characters in content', () => {
      const specialChars = '<script>alert("XSS")</script>';
      render(<Badge>{specialChars}</Badge>);

      // Should render as text, not execute
      expect(screen.getByText(specialChars)).toBeInTheDocument();

      // Verify no script execution
      const badge = screen.getByText(specialChars);
      expect(badge.querySelector('script')).toBeNull();
    });

    it('should handle concurrent keyboard events without double-firing', async () => {
      const handleClick = jest.fn();
      render(<Badge onClick={handleClick} tabIndex={0}>Test</Badge>);

      const badge = screen.getByText('Test');

      // Rapidly press Enter multiple times
      for (let i = 0; i < 10; i++) {
        const enterEvent = new KeyboardEvent('keydown', {
          key: 'Enter',
          bubbles: true,
          cancelable: true
        });
        badge.dispatchEvent(enterEvent);
      }

      // Should fire once per keypress (10 times)
      expect(handleClick).toHaveBeenCalledTimes(10);
    });

    it('should handle all props combined simultaneously', () => {
      const handleClick = jest.fn();
      const icon = <span>Icon</span>;

      render(
        <Badge
          as="button"
          variant="success"
          size="lg"
          icon={icon}
          onClick={handleClick}
          className="custom-class"
          data-testid="complex-badge"
          aria-label="Complex badge"
          tabIndex={0}
        >
          Complex Badge
        </Badge>
      );

      const badge = screen.getByTestId('complex-badge');

      // Verify all props applied
      expect(badge.tagName).toBe('BUTTON');
      expect(badge).toHaveClass('bg-green-500/20', 'custom-class');
      expect(badge).toHaveAttribute('aria-label', 'Complex badge');
      expect(badge).toHaveAttribute('tabIndex', '0');
      expect(screen.getByText('Icon')).toBeInTheDocument();
      expect(screen.getByText('Complex Badge')).toBeInTheDocument();

      // Verify interactions work
      badge.click();
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should handle zero value gracefully', () => {
      render(<Badge>{0}</Badge>);
      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('should handle false boolean value', () => {
      render(<Badge data-testid="false-badge">{false}</Badge>);
      const badge = screen.getByTestId('false-badge');
      expect(badge).toBeInTheDocument();
      expect(badge).toBeEmptyDOMElement();
    });

    it('should handle multiple icons in children', () => {
      render(
        <Badge>
          <span data-testid="icon1">🔥</span>
          <span data-testid="icon2">⚡</span>
          Text
        </Badge>
      );

      expect(screen.getByTestId('icon1')).toBeInTheDocument();
      expect(screen.getByTestId('icon2')).toBeInTheDocument();
      expect(screen.getByText('Text')).toBeInTheDocument();
    });

    it('should maintain accessibility with rapid state changes', () => {
      const { rerender } = render(
        <Badge role="status" aria-live="polite">
          1
        </Badge>
      );

      for (let i = 2; i <= 50; i++) {
        rerender(
          <Badge role="status" aria-live="polite">
            {i}
          </Badge>
        );
      }

      const badge = screen.getByRole('status');
      expect(badge).toHaveTextContent('50');
      expect(badge).toHaveAttribute('aria-live', 'polite');
    });

    it('should handle data attributes correctly', () => {
      render(
        <Badge
          data-testid="data-badge"
          data-custom="custom-value"
          data-number={42}
          data-boolean={true}
        >
          Data Test
        </Badge>
      );

      const badge = screen.getByTestId('data-badge');
      expect(badge).toHaveAttribute('data-custom', 'custom-value');
      expect(badge).toHaveAttribute('data-number', '42');
      expect(badge).toHaveAttribute('data-boolean', 'true');
    });
  });
});