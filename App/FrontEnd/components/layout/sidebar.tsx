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
    <aside className="fixed left-0 top-0 h-screen w-[60px] bg-[var(--bg-secondary)] border-r border-[var(--border-default)] flex flex-col items-center py-4 z-50">
      {/* Logo */}
      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center mb-8">
        <span className="text-white font-bold text-lg">L</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className={cn(
                  'w-10 h-10 rounded-lg flex items-center justify-center transition-colors relative',
                  isActive
                    ? 'bg-violet-500/20 text-violet-400'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-white/5'
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute left-0 w-0.5 h-6 bg-violet-500 rounded-r"
                  />
                )}
                <item.icon size={20} />
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* Settings at bottom */}
      <Link href="/settings">
        <motion.div
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className={cn(
            'w-10 h-10 rounded-lg flex items-center justify-center transition-colors',
            pathname === '/settings'
              ? 'bg-violet-500/20 text-violet-400'
              : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-white/5'
          )}
        >
          <Settings size={20} />
        </motion.div>
      </Link>
    </aside>
  );
}
