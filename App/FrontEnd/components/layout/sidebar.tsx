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
    <aside className="fixed left-0 top-0 h-screen w-[84px] glass-elevated border-r border-[var(--border-default)] flex flex-col items-center py-8 z-50 backdrop-blur-xl">
      {/* Logo - larger with more margin */}
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--accent-purple)] to-[var(--accent-blue)] flex items-center justify-center mb-12 shadow-lg shadow-[var(--accent-purple)]/30 flex-shrink-0">
        <span className="text-white font-bold text-2xl">L</span>
      </div>

      {/* Navigation - better spacing */}
      <nav className="flex-1 flex flex-col items-center justify-evenly">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} className="group relative">
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className={cn(
                  'w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 relative',
                  isActive
                    ? 'bg-[var(--accent-purple)]/20 text-[var(--accent-purple)] shadow-lg shadow-[var(--accent-purple)]/20'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/10'
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute left-0 w-1 h-10 bg-[var(--accent-purple)] rounded-r-full"
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  />
                )}
                <item.icon size={24} />
              </motion.div>
              {/* Tooltip */}
              <div className="absolute left-full ml-3 px-3 py-2 rounded-lg bg-slate-800 text-white text-sm font-medium opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap shadow-lg z-50">
                {item.label}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Settings at bottom */}
      <Link href="/settings" className="group relative mt-auto flex-shrink-0">
        <motion.div
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className={cn(
            'w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300',
            pathname === '/settings'
              ? 'bg-[var(--accent-purple)]/20 text-[var(--accent-purple)] shadow-lg shadow-[var(--accent-purple)]/20'
              : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/10'
          )}
        >
          <Settings size={24} />
        </motion.div>
        {/* Tooltip */}
        <div className="absolute left-full ml-3 px-3 py-2 rounded-lg bg-slate-800 text-white text-sm font-medium opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap shadow-lg z-50">
          Settings
        </div>
      </Link>
    </aside>
  );
}
