'use client';

import { cn } from '@/lib/utils';

interface AvatarProps {
  src?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'w-6 h-6 text-xs',
  md: 'w-8 h-8 text-sm',
  lg: 'w-10 h-10 text-base',
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function getColorFromName(name: string): string {
  const colors = [
    'from-violet-500 to-purple-600',
    'from-blue-500 to-cyan-600',
    'from-emerald-500 to-teal-600',
    'from-orange-500 to-red-600',
    'from-pink-500 to-rose-600',
  ];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
}

export function Avatar({ src, name = 'User', size = 'md', className }: AvatarProps) {
  const initials = getInitials(name);
  const gradientColor = getColorFromName(name);

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={cn(
          'rounded-full object-cover ring-2 ring-[var(--bg-primary)]',
          sizeClasses[size],
          className
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-medium text-white ring-2 ring-[var(--bg-primary)]',
        `bg-gradient-to-br ${gradientColor}`,
        sizeClasses[size],
        className
      )}
    >
      {initials}
    </div>
  );
}

interface AvatarStackProps {
  avatars: Array<{ src?: string; name: string }>;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const stackOverlap = {
  sm: '-ml-2',
  md: '-ml-3',
  lg: '-ml-4',
};

export function AvatarStack({ avatars, max = 4, size = 'md', className }: AvatarStackProps) {
  const visibleAvatars = avatars.slice(0, max);
  const remainingCount = avatars.length - max;

  return (
    <div className={cn('flex items-center', className)}>
      {visibleAvatars.map((avatar, index) => (
        <div
          key={index}
          className={cn(index > 0 && stackOverlap[size])}
          style={{ zIndex: visibleAvatars.length - index }}
        >
          <Avatar {...avatar} size={size} />
        </div>
      ))}
      {remainingCount > 0 && (
        <div
          className={cn(
            'rounded-full flex items-center justify-center font-medium text-[var(--text-secondary)] bg-[var(--bg-tertiary)] ring-2 ring-[var(--bg-primary)]',
            sizeClasses[size],
            stackOverlap[size]
          )}
          style={{ zIndex: 0 }}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  );
}
