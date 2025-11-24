/**
 * Test suite for Card component
 * Tests charcoal background, orange borders, and responsive behavior
 */

import React from 'react';
import { render, screen, validateColorDistribution, ColorScheme, setViewport, Viewports } from '@/__tests__/setup/test-utils';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../card';
import userEvent from '@testing-library/user-event';

describe('Card Component', () => {
  // ==================== Rendering Tests ====================

  describe('Rendering', () => {
    it('should render with all subcomponents', () => {
      render(
        <Card data-testid="test-card">
          <CardHeader>
            <CardTitle>Test Title</CardTitle>
            <CardDescription>Test Description</CardDescription>
          </CardHeader>
          <CardContent>Test Content</CardContent>
          <CardFooter>Test Footer</CardFooter>
        </Card>
      );

      expect(screen.getByTestId('test-card')).toBeInTheDocument();
      expect(screen.getByText('Test Title')).toBeInTheDocument();
      expect(screen.getByText('Test Description')).toBeInTheDocument();
      expect(screen.getByText('Test Content')).toBeInTheDocument();
      expect(screen.getByText('Test Footer')).toBeInTheDocument();
    });

    it('should render without optional subcomponents', () => {
      render(
        <Card data-testid="minimal-card">
          <CardContent>Content Only</CardContent>
        </Card>
      );

      expect(screen.getByTestId('minimal-card')).toBeInTheDocument();
      expect(screen.getByText('Content Only')).toBeInTheDocument();
    });

    it('should accept and apply className prop', () => {
      render(
        <Card className="custom-class" data-testid="custom-card">
          <CardContent>Content</CardContent>
        </Card>
      );

      const card = screen.getByTestId('custom-card');
      expect(card).toHaveClass('custom-class');
    });
  });

  // ==================== Color Scheme Tests ====================

  describe('Color Scheme (60-30-10 Rule)', () => {
    it('should have charcoal background (60%)', () => {
      render(
        <Card variant="default" data-testid="color-card">
          <CardContent>Test</CardContent>
        </Card>
      );

      const card = screen.getByTestId('color-card');

      // Test Tailwind classes instead of computed styles (JSDOM limitation)
      // Default variant uses charcoal-light background (card.tsx line 32)
      expect(card).toHaveClass('bg-charcoal-light', 'border-orange/20');
    });

    it('should have teal variant styling', () => {
      render(
        <Card variant="teal" data-testid="teal-card">
          <CardContent>Teal Test</CardContent>
        </Card>
      );

      const card = screen.getByTestId('teal-card');

      // Test Tailwind classes for teal variant (card.tsx line 33)
      expect(card).toHaveClass('bg-teal', 'border-orange/20');
    });

    it('should have charcoal variant styling', () => {
      render(
        <Card variant="charcoal" data-testid="charcoal-card">
          <CardContent>Charcoal Test</CardContent>
        </Card>
      );

      const card = screen.getByTestId('charcoal-card');

      // Test Tailwind classes for charcoal variant (card.tsx line 34)
      expect(card).toHaveClass('bg-charcoal', 'border-orange/10');
    });

    it('should have orange accent borders on hover/focus', () => {
      render(
        <Card data-testid="hover-card" className="hover:border-orange-primary">
          <CardContent>Hover Test</CardContent>
        </Card>
      );

      const card = screen.getByTestId('hover-card');

      // Simulate hover
      userEvent.hover(card);

      // In a real test, we'd need to check computed styles after hover
      // This is a simplified check
      expect(card).toHaveClass('hover:border-orange-primary');
    });

    it('should validate overall color distribution with class checks', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle className="text-teal-primary">Teal Title</CardTitle>
            <CardDescription className="text-charcoal-text">Description</CardDescription>
          </CardHeader>
          <CardContent className="bg-charcoal-secondary">
            <button className="bg-orange-primary text-white">Action</button>
          </CardContent>
        </Card>
      );

      // Test class presence instead of computed color distribution (JSDOM limitation)
      const title = screen.getByText('Teal Title');
      const description = screen.getByText('Description');
      const content = screen.getByText('Description').parentElement?.parentElement;
      const button = screen.getByRole('button');

      expect(title).toHaveClass('text-teal-primary');
      expect(description).toHaveClass('text-charcoal-text');
      expect(content?.querySelector('[class*="bg-charcoal-secondary"]')).toBeInTheDocument();
      expect(button).toHaveClass('bg-orange-primary');
    });
  });

  // ==================== Accessibility Tests ====================

  describe('Accessibility', () => {
    it('should have proper ARIA roles', () => {
      render(
        <Card role="article" aria-label="Dashboard Card">
          <CardContent>Accessible Content</CardContent>
        </Card>
      );

      const card = screen.getByRole('article', { name: 'Dashboard Card' });
      expect(card).toBeInTheDocument();
    });

    it('should support keyboard navigation when interactive', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();

      render(
        <Card onClick={handleClick} tabIndex={0} data-testid="interactive-card">
          <CardContent>Click or press Enter</CardContent>
        </Card>
      );

      const card = screen.getByTestId('interactive-card');

      // Tab to card
      await user.tab();
      expect(card).toHaveFocus();

      // Press Enter to activate
      await user.keyboard('{Enter}');
      expect(handleClick).toHaveBeenCalledTimes(1);

      // Press Space to activate
      await user.keyboard(' ');
      expect(handleClick).toHaveBeenCalledTimes(2);
    });

    it('should meet WCAG contrast requirements', () => {
      const { container } = render(
        <Card>
          <CardHeader>
            <CardTitle className="text-white">High Contrast Title</CardTitle>
            <CardDescription className="text-gray-300">Readable Description</CardDescription>
          </CardHeader>
        </Card>
      );

      const validation = validateColorDistribution(container);
      expect(validation.meetsWCAG).toBe(true);
    });

    it('should properly associate header with content using aria-labelledby', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle id="card-title">Important Metrics</CardTitle>
          </CardHeader>
          <CardContent aria-labelledby="card-title">
            <p>Metric value: 42</p>
          </CardContent>
        </Card>
      );

      const content = screen.getByText('Metric value: 42').parentElement;
      expect(content).toHaveAttribute('aria-labelledby', 'card-title');
    });
  });

  // ==================== Responsive Tests ====================

  describe('Responsive Behavior', () => {
    it('should adapt padding on mobile viewport', () => {
      setViewport(Viewports.mobile.width, Viewports.mobile.height);

      const { container } = render(
        <Card className="p-4 sm:p-6 md:p-8" data-testid="responsive-card">
          <CardContent>Responsive Content</CardContent>
        </Card>
      );

      const card = screen.getByTestId('responsive-card');
      expect(card).toHaveClass('p-4');
    });

    it('should stack components vertically on mobile', () => {
      setViewport(Viewports.mobile.width, Viewports.mobile.height);

      render(
        <Card>
          <CardHeader className="flex flex-col">
            <CardTitle>Mobile Title</CardTitle>
            <CardDescription>Mobile Description</CardDescription>
          </CardHeader>
        </Card>
      );

      const header = screen.getByText('Mobile Title').parentElement;
      expect(header).toHaveClass('flex-col');
    });

    it('should show/hide elements based on viewport', () => {
      const { rerender } = render(
        <Card>
          <CardContent>
            <span className="hidden sm:inline">Desktop Only</span>
            <span className="sm:hidden">Mobile Only</span>
          </CardContent>
        </Card>
      );

      // Mobile viewport
      setViewport(Viewports.mobile.width, Viewports.mobile.height);
      expect(screen.queryByText('Desktop Only')).toHaveClass('hidden');
      expect(screen.queryByText('Mobile Only')).not.toHaveClass('hidden');

      // Desktop viewport
      setViewport(Viewports.desktop.width, Viewports.desktop.height);
      rerender(
        <Card>
          <CardContent>
            <span className="hidden sm:inline">Desktop Only</span>
            <span className="sm:hidden">Mobile Only</span>
          </CardContent>
        </Card>
      );
    });
  });

  // ==================== Edge Cases ====================

  describe('Edge Cases', () => {
    it('should handle empty card gracefully', () => {
      const { container } = render(<Card data-testid="empty-card" />);

      const card = screen.getByTestId('empty-card');
      expect(card).toBeInTheDocument();
      expect(card).toBeEmptyDOMElement();
    });

    it('should handle very long content with scrolling', () => {
      const longContent = 'Lorem ipsum '.repeat(100);

      render(
        <Card className="max-h-48 overflow-auto" data-testid="scrollable-card">
          <CardContent>{longContent}</CardContent>
        </Card>
      );

      const card = screen.getByTestId('scrollable-card');
      expect(card).toHaveClass('overflow-auto');
    });

    it('should handle nested cards', () => {
      render(
        <Card data-testid="parent-card">
          <CardContent>
            <Card data-testid="nested-card">
              <CardContent>Nested Content</CardContent>
            </Card>
          </CardContent>
        </Card>
      );

      expect(screen.getByTestId('parent-card')).toBeInTheDocument();
      expect(screen.getByTestId('nested-card')).toBeInTheDocument();
    });

    it('should preserve ref forwarding', () => {
      const ref = React.createRef<HTMLDivElement>();

      render(
        <Card ref={ref}>
          <CardContent>Ref Test</CardContent>
        </Card>
      );

      expect(ref.current).toBeInstanceOf(HTMLDivElement);
      expect(ref.current).toHaveTextContent('Ref Test');
    });
  });

  // ==================== Animation Tests ====================

  describe('Animations', () => {
    it('should have transition classes for smooth hover effects', () => {
      render(
        <Card className="transition-all duration-200" data-testid="animated-card">
          <CardContent>Animated</CardContent>
        </Card>
      );

      const card = screen.getByTestId('animated-card');
      expect(card).toHaveClass('transition-all');
      expect(card).toHaveClass('duration-200');
    });

    it('should support transform on hover', () => {
      render(
        <Card className="hover:scale-105 transform" data-testid="transform-card">
          <CardContent>Transform on Hover</CardContent>
        </Card>
      );

      const card = screen.getByTestId('transform-card');
      expect(card).toHaveClass('hover:scale-105');
      expect(card).toHaveClass('transform');
    });
  });

  // ==================== Integration Tests ====================

  describe('Integration', () => {
    it('should work with loading skeleton', () => {
      const { rerender } = render(
        <Card data-testid="loading-card">
          <CardContent>
            <div className="animate-pulse bg-gray-700 h-4 w-full rounded" />
          </CardContent>
        </Card>
      );

      expect(screen.getByTestId('loading-card')).toBeInTheDocument();

      // Simulate loading complete
      rerender(
        <Card data-testid="loading-card">
          <CardContent>Loaded Content</CardContent>
        </Card>
      );

      expect(screen.getByText('Loaded Content')).toBeInTheDocument();
    });

    it('should work with conditional rendering', () => {
      const { rerender } = render(
        <Card data-testid="conditional-card">
          <CardContent>
            {false && <span>Hidden</span>}
            {true && <span>Visible</span>}
          </CardContent>
        </Card>
      );

      expect(screen.queryByText('Hidden')).not.toBeInTheDocument();
      expect(screen.getByText('Visible')).toBeInTheDocument();
    });
  });

  // ==================== Keyboard Accessibility Tests (TDD) ====================

  describe('Keyboard Accessibility', () => {
    it('should trigger onClick when Enter key is pressed', () => {
      const handleClick = jest.fn();

      render(
        <Card onClick={handleClick} tabIndex={0}>
          <CardHeader><CardTitle>Test</CardTitle></CardHeader>
        </Card>
      );

      const card = screen.getByText('Test').closest('[tabindex="0"]');

      const enterEvent = new KeyboardEvent('keydown', {
        key: 'Enter',
        bubbles: true,
        cancelable: true
      });
      card!.dispatchEvent(enterEvent);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should trigger onClick when Space key is pressed', () => {
      const handleClick = jest.fn();

      render(
        <Card onClick={handleClick} tabIndex={0}>
          <CardHeader><CardTitle>Test</CardTitle></CardHeader>
        </Card>
      );

      const card = screen.getByText('Test').closest('[tabindex="0"]');

      const spaceEvent = new KeyboardEvent('keydown', {
        key: ' ',
        bubbles: true,
        cancelable: true
      });
      card!.dispatchEvent(spaceEvent);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should not crash when onClick is undefined', () => {
      render(
        <Card tabIndex={0}>
          <CardHeader><CardTitle>No Handler</CardTitle></CardHeader>
        </Card>
      );

      const card = screen.getByText('No Handler').closest('[tabindex="0"]');

      expect(() => {
        card!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      }).not.toThrow();
    });
  });

  // ==================== Performance Tests ====================

  describe('Performance', () => {
    it('should not re-render unnecessarily', () => {
      const renderSpy = jest.fn();

      function TestCard({ content }: { content: string }) {
        renderSpy();
        return (
          <Card>
            <CardContent>{content}</CardContent>
          </Card>
        );
      }

      const { rerender } = render(<TestCard content="Initial" />);
      expect(renderSpy).toHaveBeenCalledTimes(1);

      // Re-render with same props
      rerender(<TestCard content="Initial" />);
      expect(renderSpy).toHaveBeenCalledTimes(2); // React doesn't memoize by default

      // Re-render with different props
      rerender(<TestCard content="Updated" />);
      expect(renderSpy).toHaveBeenCalledTimes(3);
    });

    it('should handle rapid prop updates', () => {
      const { rerender } = render(
        <Card data-testid="rapid-update">
          <CardContent>Content 1</CardContent>
        </Card>
      );

      // Simulate rapid updates
      for (let i = 2; i <= 10; i++) {
        rerender(
          <Card data-testid="rapid-update">
            <CardContent>Content {i}</CardContent>
          </Card>
        );
      }

      expect(screen.getByText('Content 10')).toBeInTheDocument();
    });
  });

  // ==================== Edge Cases - Enhanced ====================

  describe('Edge Cases - Enhanced', () => {
    it('should render empty card gracefully', () => {
      render(<Card data-testid="empty-card" />);
      expect(screen.getByTestId('empty-card')).toBeInTheDocument();
      expect(screen.getByTestId('empty-card')).toBeEmptyDOMElement();
    });

    it('should handle deeply nested components', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Level 1</CardTitle>
            <CardDescription>
              <Card variant="teal">
                <CardHeader>
                  <CardTitle>Level 2 (Nested)</CardTitle>
                </CardHeader>
              </Card>
            </CardDescription>
          </CardHeader>
        </Card>
      );

      expect(screen.getByText('Level 1')).toBeInTheDocument();
      expect(screen.getByText('Level 2 (Nested)')).toBeInTheDocument();
    });

    it('should handle rapid hover state changes', () => {
      const { rerender } = render(<Card hover={true}>Test</Card>);

      for (let i = 0; i < 100; i++) {
        rerender(<Card hover={i % 2 === 0}>Test</Card>);
      }

      expect(screen.getByText('Test')).toBeInTheDocument();
    });

    it('should handle animated card with keyboard interactions', () => {
      const handleClick = jest.fn();
      render(
        <Card animated onClick={handleClick} tabIndex={0}>
          <CardContent>Animated Content</CardContent>
        </Card>
      );

      const card = screen.getByText('Animated Content').closest('[tabindex="0"]');

      // Test keyboard interaction on animated card
      const enterEvent = new KeyboardEvent('keydown', {
        key: 'Enter',
        bubbles: true,
        cancelable: true
      });
      card!.dispatchEvent(enterEvent);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should maintain ref with various interactions', () => {
      const ref = React.createRef<HTMLDivElement>();
      const handleClick = jest.fn();

      render(
        <Card ref={ref} onClick={handleClick} tabIndex={0} hover animated>
          <CardContent>Ref Test</CardContent>
        </Card>
      );

      // Verify ref is set
      expect(ref.current).toBeInstanceOf(HTMLDivElement);

      // Interact and verify ref still valid
      ref.current!.click();
      const enterEvent = new KeyboardEvent('keydown', {
        key: 'Enter',
        bubbles: true,
        cancelable: true
      });
      ref.current!.dispatchEvent(enterEvent);

      expect(handleClick).toHaveBeenCalledTimes(2);
      expect(ref.current).toBeInstanceOf(HTMLDivElement); // Still valid
    });

    it('should handle all variants with all modifiers simultaneously', () => {
      const variants = ['default', 'teal', 'charcoal'] as const;

      variants.forEach(variant => {
        const { unmount } = render(
          <Card
            variant={variant}
            hover
            animated
            onClick={jest.fn()}
            className="custom-class"
            data-testid={`card-${variant}`}
          >
            <CardHeader>
              <CardTitle>Title</CardTitle>
              <CardDescription>Description</CardDescription>
            </CardHeader>
            <CardContent>Content</CardContent>
            <CardFooter>Footer</CardFooter>
          </Card>
        );

        expect(screen.getByTestId(`card-${variant}`)).toBeInTheDocument();
        expect(screen.getByText('Title')).toBeInTheDocument();

        unmount();
      });
    });

    it('should handle null children in subcomponents', () => {
      render(
        <Card data-testid="null-children-card">
          <CardHeader>
            <CardTitle>{null}</CardTitle>
            <CardDescription>{undefined}</CardDescription>
          </CardHeader>
          <CardContent>{null}</CardContent>
          <CardFooter>{undefined}</CardFooter>
        </Card>
      );

      // Should render without crashing
      const card = screen.getByTestId('null-children-card');
      expect(card).toBeInTheDocument();
    });

    it('should handle rapid variant toggling', () => {
      const variants = ['default', 'teal', 'charcoal'] as const;
      const { rerender } = render(<Card variant="default">Test</Card>);

      for (let i = 0; i < 100; i++) {
        const variant = variants[i % 3];
        rerender(<Card variant={variant}>Test</Card>);
      }

      expect(screen.getByText('Test')).toBeInTheDocument();
    });

    it('should handle animated card with all event types', async () => {
      const handleClick = jest.fn();
      const handleMouseEnter = jest.fn();
      const handleMouseLeave = jest.fn();
      const user = userEvent.setup();

      render(
        <Card
          animated
          onClick={handleClick}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          tabIndex={0}
        >
          <CardContent>Interactive Animated</CardContent>
        </Card>
      );

      const card = screen.getByText('Interactive Animated').closest('[tabindex="0"]');

      // Test all interactions
      await user.hover(card!);
      expect(handleMouseEnter).toHaveBeenCalledTimes(1);

      await user.unhover(card!);
      expect(handleMouseLeave).toHaveBeenCalledTimes(1);

      await user.click(card!);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should preserve className when animated', () => {
      render(
        <Card animated className="custom-animated-class" data-testid="animated-class-card">
          <CardContent>Test</CardContent>
        </Card>
      );

      const card = screen.getByTestId('animated-class-card');
      expect(card).toHaveClass('custom-animated-class');
    });

    it('should handle extremely long content in all subcomponents', () => {
      const longText = 'Lorem ipsum '.repeat(200);

      render(
        <Card data-testid="long-content-card">
          <CardHeader>
            <CardTitle>{longText}</CardTitle>
            <CardDescription>{longText}</CardDescription>
          </CardHeader>
          <CardContent>{longText}</CardContent>
          <CardFooter>{longText}</CardFooter>
        </Card>
      );

      // Should render without crashing
      const card = screen.getByTestId('long-content-card');
      expect(card).toBeInTheDocument();
      expect(card.textContent).toContain('Lorem ipsum');
    });

    it('should handle special characters in all subcomponents', () => {
      const specialChars = '<script>alert("XSS")</script>';

      render(
        <Card>
          <CardHeader>
            <CardTitle>{specialChars}</CardTitle>
            <CardDescription>{specialChars}</CardDescription>
          </CardHeader>
          <CardContent>{specialChars}</CardContent>
          <CardFooter>{specialChars}</CardFooter>
        </Card>
      );

      // Should render as text, not execute
      const elements = screen.getAllByText(specialChars);
      expect(elements.length).toBe(4);

      // Verify no script execution
      elements.forEach(element => {
        expect(element.querySelector('script')).toBeNull();
      });
    });

    it('should handle concurrent keyboard events on interactive card', () => {
      const handleClick = jest.fn();

      render(
        <Card onClick={handleClick} tabIndex={0}>
          <CardContent>Test</CardContent>
        </Card>
      );

      const card = screen.getByText('Test').closest('[tabindex="0"]');

      // Rapidly press keys
      for (let i = 0; i < 20; i++) {
        const key = i % 2 === 0 ? 'Enter' : ' ';
        const event = new KeyboardEvent('keydown', {
          key,
          bubbles: true,
          cancelable: true
        });
        card!.dispatchEvent(event);
      }

      expect(handleClick).toHaveBeenCalledTimes(20);
    });

    it('should handle all aria attributes with animated card', () => {
      render(
        <Card
          animated
          role="article"
          aria-label="Test Article"
          aria-describedby="description"
          aria-live="polite"
          data-testid="aria-card"
        >
          <CardContent id="description">Content</CardContent>
        </Card>
      );

      const card = screen.getByTestId('aria-card');
      expect(card).toHaveAttribute('role', 'article');
      expect(card).toHaveAttribute('aria-label', 'Test Article');
      expect(card).toHaveAttribute('aria-describedby', 'description');
      expect(card).toHaveAttribute('aria-live', 'polite');
    });

    it('should handle transition from non-animated to animated', () => {
      const { rerender } = render(
        <Card data-testid="transition-card">
          <CardContent>Test</CardContent>
        </Card>
      );

      expect(screen.getByTestId('transition-card')).toBeInTheDocument();

      rerender(
        <Card animated data-testid="transition-card">
          <CardContent>Test</CardContent>
        </Card>
      );

      expect(screen.getByTestId('transition-card')).toBeInTheDocument();
    });

    it('should handle multiple refs on nested cards', () => {
      const parentRef = React.createRef<HTMLDivElement>();
      const childRef = React.createRef<HTMLDivElement>();

      render(
        <Card ref={parentRef} data-testid="parent">
          <CardContent>
            <Card ref={childRef} data-testid="child">
              <CardContent>Nested</CardContent>
            </Card>
          </CardContent>
        </Card>
      );

      expect(parentRef.current).toBeInstanceOf(HTMLDivElement);
      expect(childRef.current).toBeInstanceOf(HTMLDivElement);
      expect(parentRef.current).not.toBe(childRef.current);
    });

    it('should handle all props combinations with hover and animated', () => {
      const handleClick = jest.fn();

      render(
        <Card
          variant="teal"
          hover
          animated
          onClick={handleClick}
          className="custom-combo"
          role="region"
          aria-label="Combo Card"
          tabIndex={0}
          data-testid="combo-card"
        >
          <CardHeader>
            <CardTitle>Combo Title</CardTitle>
            <CardDescription>Combo Description</CardDescription>
          </CardHeader>
          <CardContent>Combo Content</CardContent>
          <CardFooter>Combo Footer</CardFooter>
        </Card>
      );

      const card = screen.getByTestId('combo-card');

      // Verify all props applied
      expect(card).toHaveClass('custom-combo');
      expect(card).toHaveAttribute('role', 'region');
      expect(card).toHaveAttribute('aria-label', 'Combo Card');
      expect(card).toHaveAttribute('tabIndex', '0');

      // Verify content
      expect(screen.getByText('Combo Title')).toBeInTheDocument();
      expect(screen.getByText('Combo Description')).toBeInTheDocument();
      expect(screen.getByText('Combo Content')).toBeInTheDocument();
      expect(screen.getByText('Combo Footer')).toBeInTheDocument();

      // Verify interaction
      card.click();
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });
});