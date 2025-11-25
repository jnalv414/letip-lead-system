/**
 * Card Component
 *
 * Foundation component following 60/30/10 color rule:
 * - Background: Charcoal (#1A1A1D) - 60%
 * - Surface: Teal variations - 30%
 * - Border/Accent: Orange (#FF5722) - 10%
 *
 * Usage:
 * <Card>Content</Card>
 * <Card variant="teal">Content with teal background</Card>
 * <Card hover>Content with hover effects</Card>
 */

import * as React from 'react';
import { cn } from '@/lib/utils';
import { motion, HTMLMotionProps } from 'framer-motion';
import { useKeyboardClick } from '@/hooks/use-keyboard-click';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'teal' | 'charcoal' | 'glass' | 'glass-elevated';
  hover?: boolean;
  animated?: boolean;
  children?: React.ReactNode;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', hover = false, animated = false, children, onClick, ...props }, ref) => {
    const baseClasses = 'rounded-2xl p-6 border transition-all duration-300 ease-out';

    const variantClasses = {
      default: 'bg-charcoal-light border-orange/20',
      teal: 'bg-teal border-orange/20',
      charcoal: 'bg-charcoal border-orange/10',
      glass: 'glass',
      'glass-elevated': 'glass-elevated',
    };

    const hoverClasses = hover
      ? 'hover:border-[var(--border-accent)] hover:shadow-[0_8px_32px_rgba(155,109,255,0.15)] hover:-translate-y-1 hover:scale-[1.02]'
      : '';

    const handleKeyDown = useKeyboardClick(onClick);

    // Omit incompatible HTML event props when using motion.div
    const { onDrag, onDragEnd, onDragStart, ...safeProps } = props;

    if (animated) {
      return (
        <motion.div
          ref={ref}
          className={cn(baseClasses, variantClasses[variant], hoverClasses, className)}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          onClick={onClick}
          onKeyDown={handleKeyDown}
          {...(safeProps as any)}
        >
          {children}
        </motion.div>
      );
    }

    return (
      <div
        ref={ref}
        className={cn(baseClasses, variantClasses[variant], hoverClasses, className)}
        onClick={onClick}
        onKeyDown={handleKeyDown}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex flex-col space-y-1.5 mb-6', className)}
      {...props}
    />
  )
);

CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('text-xl font-bold text-[var(--text-primary)] tracking-tight', className)}
      {...props}
    />
  )
);

CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn('text-sm text-[var(--text-secondary)] leading-relaxed', className)}
      {...props}
    />
  )
);

CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('', className)} {...props} />
  )
);

CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex items-center mt-6 pt-6 border-t border-orange/10', className)}
      {...props}
    />
  )
);

CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
