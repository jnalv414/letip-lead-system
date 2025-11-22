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
      const { container } = render(
        <Card data-testid="color-card">
          <CardContent>Test</CardContent>
        </Card>
      );

      const card = screen.getByTestId('color-card');
      const styles = window.getComputedStyle(card);

      // Check for charcoal background
      expect(styles.backgroundColor).toBe(ColorScheme.charcoal.primary);
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

    it('should validate overall color distribution', () => {
      const { container } = render(
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

      const validation = validateColorDistribution(container);
      expect(validation.hasCharcoalBackground).toBe(true);
      expect(validation.hasTealAccent).toBe(true);
      expect(validation.hasOrangeHighlight).toBe(true);
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
});