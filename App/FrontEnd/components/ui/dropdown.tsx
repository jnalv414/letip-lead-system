'use client';

import { ReactNode, useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DropdownProps {
  trigger: ReactNode;
  children: ReactNode;
  className?: string;
  align?: 'left' | 'right';
}

export function Dropdown({ trigger, children, className, align = 'left' }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} className={cn('relative', className)}>
      <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
        {trigger}
      </div>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={cn(
              'absolute z-50 mt-2 min-w-[180px] rounded-lg',
              'bg-[var(--bg-card-elevated)] backdrop-blur-xl',
              'border border-[var(--border-default)]',
              'shadow-xl shadow-black/20',
              'py-1',
              align === 'right' ? 'right-0' : 'left-0'
            )}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface DropdownItemProps {
  children: ReactNode;
  onClick?: () => void;
  icon?: ReactNode;
  variant?: 'default' | 'destructive';
  className?: string;
}

export function DropdownItem({
  children,
  onClick,
  icon,
  variant = 'default',
  className,
}: DropdownItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full px-4 py-2 text-sm text-left flex items-center gap-3',
        'transition-colors',
        variant === 'default' && 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5',
        variant === 'destructive' && 'text-red-400 hover:text-red-300 hover:bg-red-500/10',
        className
      )}
    >
      {icon && <span className="w-4 h-4">{icon}</span>}
      {children}
    </button>
  );
}

export function DropdownSeparator() {
  return <div className="my-1 border-t border-[var(--border-default)]" />;
}
