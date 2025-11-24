import * as React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: 'default' | 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  children?: React.ReactNode;
}

const buttonVariants = {
  default: 'bg-teal-light text-white border-teal-lighter hover:bg-teal-lighter shadow-3d hover:shadow-3d-hover',
  primary: 'bg-orange text-white border-orange-dark hover:bg-orange-dark shadow-3d-md hover:shadow-3d-lg',
  secondary: 'bg-teal text-white border-teal-dark hover:bg-teal-dark shadow-3d hover:shadow-3d-md',
  outline: 'bg-transparent text-white border-teal-light hover:bg-teal/20 shadow-3d-sm hover:shadow-3d',
  ghost: 'bg-transparent text-white border-transparent hover:bg-teal/10',
  destructive: 'bg-red-600 text-white border-red-700 hover:bg-red-700 shadow-3d-md hover:shadow-3d-lg',
};

const buttonSizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
  icon: 'p-2',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'md', children, ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-xl border font-medium font-sans transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed',
          buttonVariants[variant],
          buttonSizes[size],
          className
        )}
        whileHover={{
          scale: 1.05,
          y: -2,
          transition: { duration: 0.2 }
        }}
        whileTap={{
          scale: 0.95,
          y: 0,
          transition: { duration: 0.1 }
        }}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        {...props}
      >
        {children}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';
