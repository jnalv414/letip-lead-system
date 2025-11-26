'use client';

import { useRef, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, Users, Search, Sparkles, Send, Settings, Menu, X, ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { LeTipLogoCompact } from '@/components/ui/letip-logo';

const navItems = [
  { href: '/', icon: Home, label: 'Dashboard' },
  { href: '/leads', icon: Users, label: 'Leads' },
  { href: '/search', icon: Search, label: 'Search' },
  { href: '/enrichment', icon: Sparkles, label: 'Enrichment' },
  { href: '/outreach', icon: Send, label: 'Outreach' },
];

// Animation variants for sidebar panel
const sidebarVariants = {
  closed: {
    x: '-100%',
    transition: {
      type: 'spring' as const,
      stiffness: 400,
      damping: 40,
    },
  },
  open: {
    x: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 400,
      damping: 40,
    },
  },
};

// Animation variants for backdrop overlay
const overlayVariants = {
  closed: {
    opacity: 0,
    transition: { duration: 0.2 },
  },
  open: {
    opacity: 1,
    transition: { duration: 0.3 },
  },
};

// Animation variants for menu items (staggered entrance)
const menuItemVariants = {
  closed: {
    opacity: 0,
    x: -20,
  },
  open: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: 0.1 + i * 0.05,
      duration: 0.3,
      ease: 'easeOut' as const,
    },
  }),
};

// Animation variants for icons (spring bounce)
const iconVariants = {
  closed: {
    scale: 0,
    rotate: -180,
  },
  open: (i: number) => ({
    scale: 1,
    rotate: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 260,
      damping: 20,
      delay: 0.2 + i * 0.05,
    },
  }),
};

// Animation for menu toggle button
const menuButtonVariants = {
  hover: {
    scale: 1.1,
    transition: { duration: 0.2 },
  },
  tap: {
    scale: 0.95,
  },
};

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Close sidebar on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Close sidebar on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  // Close sidebar on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        isOpen &&
        sidebarRef.current &&
        !sidebarRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Prevent body scroll when sidebar is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <>
      {/* Menu Toggle Button - Always Visible */}
      <motion.button
        variants={menuButtonVariants}
        whileHover="hover"
        whileTap="tap"
        onClick={() => setIsOpen(true)}
        className={cn(
          'fixed left-6 top-6 z-50 w-14 h-14 rounded-2xl flex items-center justify-center',
          'glass-elevated border border-[var(--border-default)]',
          'text-[var(--text-muted)] hover:text-[var(--text-primary)]',
          'transition-colors duration-200',
          'shadow-lg shadow-black/20',
          isOpen && 'opacity-0 pointer-events-none'
        )}
        aria-label="Open navigation menu"
      >
        <Menu size={24} />
      </motion.button>

      {/* Overlay + Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop Overlay */}
            <motion.div
              variants={overlayVariants}
              initial="closed"
              animate="open"
              exit="closed"
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
              aria-hidden="true"
            />

            {/* Sidebar Panel */}
            <motion.aside
              ref={sidebarRef}
              variants={sidebarVariants}
              initial="closed"
              animate="open"
              exit="closed"
              className={cn(
                'fixed left-0 top-0 h-screen w-72 z-50',
                'glass-elevated border-r border-[var(--border-default)]',
                'flex flex-col justify-between py-10 px-6',
                'backdrop-blur-xl'
              )}
            >
              {/* Header with Logo and Close Button */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <LeTipLogoCompact size={56} className="drop-shadow-lg" />
                  <div>
                    <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                      Le Tip
                    </h2>
                    <p className="text-xs text-[var(--text-muted)]">
                      Western Monmouth
                    </p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center',
                    'text-[var(--text-muted)] hover:text-[var(--text-primary)]',
                    'hover:bg-white/10 transition-colors'
                  )}
                  aria-label="Close navigation menu"
                >
                  <X size={20} />
                </motion.button>
              </div>

              {/* Navigation Items - Starting from top with generous spacing */}
              <nav className="flex-1 flex flex-col gap-3 pt-8">
                {navItems.map((item, index) => {
                  const isActive = pathname === item.href;
                  return (
                    <motion.div
                      key={item.href}
                      custom={index}
                      variants={menuItemVariants}
                      initial="closed"
                      animate="open"
                    >
                      <Link
                        href={item.href}
                        className={cn(
                          'group flex items-center gap-4 px-4 py-4 rounded-xl',
                          'transition-all duration-200',
                          isActive
                            ? 'bg-[var(--accent-purple)]/20 text-[var(--accent-purple)]'
                            : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/10'
                        )}
                      >
                        {/* Active Indicator */}
                        {isActive && (
                          <motion.div
                            layoutId="activeSidebarNav"
                            className="absolute left-0 w-1.5 h-12 bg-[var(--accent-purple)] rounded-r-full shadow-[0_0_12px_rgba(155,109,255,0.5)]"
                            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                          />
                        )}

                        {/* Icon with spring animation */}
                        <motion.div
                          custom={index}
                          variants={iconVariants}
                          initial="closed"
                          animate="open"
                          className={cn(
                            'w-12 h-12 rounded-xl flex items-center justify-center',
                            isActive
                              ? 'bg-[var(--accent-purple)]/30'
                              : 'bg-white/5 group-hover:bg-white/10'
                          )}
                        >
                          <item.icon size={22} />
                        </motion.div>

                        {/* Label */}
                        <span className="font-medium text-base">{item.label}</span>

                        {/* Chevron for active */}
                        {isActive && (
                          <ChevronRight
                            size={18}
                            className="ml-auto text-[var(--accent-purple)]"
                          />
                        )}
                      </Link>
                    </motion.div>
                  );
                })}
              </nav>

              {/* Bottom Section - Settings and Version */}
              <div>
                {/* Divider */}
                <div className="h-px bg-white/10 mb-6" />

                {/* Settings */}
                <motion.div
                  custom={navItems.length}
                  variants={menuItemVariants}
                  initial="closed"
                  animate="open"
                >
                  <Link
                    href="/settings"
                    className={cn(
                      'group flex items-center gap-4 px-4 py-4 rounded-xl',
                      'transition-all duration-200',
                      pathname === '/settings'
                        ? 'bg-[var(--accent-purple)]/20 text-[var(--accent-purple)]'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/10'
                    )}
                  >
                    <motion.div
                      custom={navItems.length}
                      variants={iconVariants}
                      initial="closed"
                      animate="open"
                      className={cn(
                        'w-12 h-12 rounded-xl flex items-center justify-center',
                        pathname === '/settings'
                          ? 'bg-[var(--accent-purple)]/30'
                          : 'bg-white/5 group-hover:bg-white/10'
                      )}
                    >
                      <Settings size={22} />
                    </motion.div>
                    <span className="font-medium text-base">Settings</span>
                    {pathname === '/settings' && (
                      <ChevronRight
                        size={18}
                        className="ml-auto text-[var(--accent-purple)]"
                      />
                    )}
                  </Link>
                </motion.div>

                {/* Version Info */}
                <div className="mt-8 text-center">
                  <p className="text-xs text-[var(--text-muted)]">
                    Lead System v1.0
                  </p>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
