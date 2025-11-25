'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ShineBorderProps {
  children: ReactNode;
  className?: string;
  borderWidth?: number;
  duration?: number;
  color?: string | string[];
}

export function ShineBorder({
  children,
  className,
  borderWidth = 1,
  duration = 8,
  color = ['#8B5CF6', '#3B82F6', '#06B6D4'],
}: ShineBorderProps) {
  const colors = Array.isArray(color) ? color.join(', ') : color;

  return (
    <div
      className={cn(
        'relative rounded-lg overflow-hidden',
        className
      )}
      style={{
        '--border-width': `${borderWidth}px`,
        '--duration': `${duration}s`,
        '--colors': colors,
      } as React.CSSProperties}
    >
      <div
        className="absolute inset-0 rounded-lg"
        style={{
          padding: borderWidth,
          background: `linear-gradient(90deg, ${colors})`,
          backgroundSize: '300% 100%',
          animation: `shine ${duration}s linear infinite`,
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
        }}
      />
      <div className="relative bg-[var(--bg-card-solid)] rounded-lg">
        {children}
      </div>
    </div>
  );
}
