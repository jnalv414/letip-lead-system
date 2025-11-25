'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Home, Users, Search, Sparkles, Send, Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', icon: Home, label: 'Dashboard' },
  { href: '/leads', icon: Users, label: 'Leads' },
  { href: '/search', icon: Search, label: 'Search' },
  { href: '/enrichment', icon: Sparkles, label: 'Enrichment' },
  { href: '/outreach', icon: Send, label: 'Outreach' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-[70px] glass-elevated border-r border-[var(--border-default)] flex flex-col items-center py-6 z-50 backdrop-blur-xl">
      {/* Logo */}
      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--accent-purple)] to-[var(--accent-blue)] flex items-center justify-center mb-10 shadow-lg shadow-[var(--accent-purple)]/20">
        <span className="text-white font-bold text-xl">L</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-3">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <motion.div
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className={cn(
                  'w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 relative',
                  isActive
                    ? 'bg-[var(--accent-purple)]/20 text-[var(--accent-purple)] shadow-lg shadow-[var(--accent-purple)]/10'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/5'
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute left-0 w-1 h-8 bg-[var(--accent-purple)] rounded-r-full"
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  />
                )}
                <item.icon size={22} />
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* Settings at bottom */}
      <Link href="/settings">
        <motion.div
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className={cn(
            'w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300',
            pathname === '/settings'
              ? 'bg-[var(--accent-purple)]/20 text-[var(--accent-purple)] shadow-lg shadow-[var(--accent-purple)]/10'
              : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/5'
          )}
        >
          <Settings size={22} />
        </motion.div>
      </Link>
    </aside>
  );
}
