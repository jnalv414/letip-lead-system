'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ShimmerButtonProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
}

export function ShimmerButton({
  children,
  className,
  onClick,
  disabled,
}: ShimmerButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'relative inline-flex items-center justify-center px-6 py-3 overflow-hidden font-medium text-white rounded-lg',
        'bg-gradient-to-r from-violet-600 to-blue-600',
        'transition-all duration-300',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        className
      )}
    >
      <span className="relative z-10">{children}</span>
      <div
        className="absolute inset-0 -translate-x-full animate-[shimmer-slide_2s_infinite]"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
        }}
      />
    </motion.button>
  );
}
