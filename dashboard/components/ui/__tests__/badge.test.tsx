/**
 * Test suite for Badge component
 * Tests orange and teal variants, sizes, and interactive states
 */

import React from 'react';
import { render, screen, validateColorDistribution, ColorScheme } from '@/__tests__/setup/test-utils';
import { Badge, BadgeVariant, BadgeSize } from '../badge';
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
  });

  // ==================== Variant Tests ====================

  describe('Color Variants', () => {
    it('should render orange variant (default)', () => {
      render(<Badge variant="orange">Orange</Badge>);
      const badge = screen.getByText('Orange');
      const styles = window.getComputedStyle(badge);

      expect(styles.backgroundColor).toBe(ColorScheme.orange.primary);
    });

    it('should render teal variant', () => {
      render(<Badge variant="teal">Teal</Badge>);
      const badge = screen.getByText('Teal');
      const styles = window.getComputedStyle(badge);

      expect(styles.backgroundColor).toBe(ColorScheme.teal.primary);
    });

    it('should render outline variant', () => {
      render(<Badge variant="outline">Outline</Badge>);
      const badge = screen.getByText('Outline');
      const styles = window.getComputedStyle(badge);

      expect(styles.backgroundColor).toBe('transparent');
      expect(styles.borderWidth).not.toBe('0px');
    });

    it('should render ghost variant', () => {
      render(<Badge variant="ghost">Ghost</Badge>);
      const badge = screen.getByText('Ghost');
      const styles = window.getComputedStyle(badge);

      expect(styles.backgroundColor).toContain('rgba');
      expect(parseFloat(styles.opacity || '1')).toBeLessThan(1);
    });

    it('should render success variant', () => {
      render(<Badge variant="success">Success</Badge>);
      const badge = screen.getByText('Success');
      expect(badge).toHaveClass('bg-green-500');
    });

    it('should render warning variant', () => {
      render(<Badge variant="warning">Warning</Badge>);
      const badge = screen.getByText('Warning');
      expect(badge).toHaveClass('bg-yellow-500');
    });

    it('should render error variant', () => {
      render(<Badge variant="error">Error</Badge>);
      const badge = screen.getByText('Error');
      expect(badge).toHaveClass('bg-red-500');
    });
  });

  // ==================== Size Tests ====================

  describe('Sizes', () => {
    it('should render small size', () => {
      render(<Badge size="sm">Small</Badge>);
      const badge = screen.getByText('Small');
      expect(badge).toHaveClass('text-xs', 'px-2', 'py-0.5');
    });

    it('should render default size', () => {
      render(<Badge size="default">Default</Badge>);
      const badge = screen.getByText('Default');
      expect(badge).toHaveClass('text-sm', 'px-2.5', 'py-0.5');
    });

    it('should render large size', () => {
      render(<Badge size="lg">Large</Badge>);
      const badge = screen.getByText('Large');
      expect(badge).toHaveClass('text-base', 'px-3', 'py-1');
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
        variant: i % 2 === 0 ? 'orange' : 'teal' as BadgeVariant,
      }));

      const { container } = render(
        <div>
          {badges.map(badge => (
            <Badge key={badge.id} variant={badge.variant}>
              {badge.text}
            </Badge>
          ))}
        </div>
      );

      const allBadges = container.querySelectorAll('[class*="badge"]');
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
      expect(screen.getByText('active')).toHaveClass('bg-green-500');

      rerender(<DynamicBadge status="pending" />);
      expect(screen.getByText('pending')).toHaveClass('bg-yellow-500');

      rerender(<DynamicBadge status="error" />);
      expect(screen.getByText('error')).toHaveClass('bg-red-500');
    });
  });
});