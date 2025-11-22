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
  variant?: 'default' | 'teal' | 'charcoal';
  hover?: boolean;
  animated?: boolean;
  children?: React.ReactNode;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', hover = false, animated = false, children, onClick, ...props }, ref) => {
    const baseClasses = 'rounded-3xl p-6 border shadow-xl transition-all duration-300';

    const variantClasses = {
      default: 'bg-charcoal-light border-orange/20',
      teal: 'bg-teal border-orange/20',
      charcoal: 'bg-charcoal border-orange/10',
    };

    const hoverClasses = hover
      ? 'hover:border-orange/40 hover:shadow-3d-hover hover:-translate-y-1'
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
          transition={{ duration: 0.5, ease: 'easeOut' }}
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
      className={cn('text-xl font-semibold text-white tracking-tight', className)}
      {...props}
    />
  )
);

CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn('text-sm text-gray-400', className)}
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
