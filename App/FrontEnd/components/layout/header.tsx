'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Bell, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HeaderProps {
  title?: string;
}

export function Header({ title = 'Dashboard' }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });

  return (
    <header className="h-20 glass-elevated border-b border-[var(--border-default)] px-8 flex items-center justify-between">
      {/* Title with dropdown */}
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">{title}</h1>
        <ChevronDown size={18} className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors cursor-pointer" />
      </div>

      {/* Center: Search */}
      <div className="flex-1 max-w-lg mx-12">
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
          <input
            type="text"
            placeholder="Search businesses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-12 pl-14 pr-5 rounded-xl glass border border-[var(--border-default)] text-[var(--text-primary)] text-base placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-purple)]/50 focus:ring-2 focus:ring-[var(--accent-purple)]/20 transition-all"
          />
        </div>
      </div>

      {/* Right: Notifications, Date, Profile */}
      <div className="flex items-center gap-5">
        {/* Notifications */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="relative w-11 h-11 rounded-xl glass border border-[var(--border-default)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-accent)] transition-all"
        >
          <Bell size={20} />
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-br from-[var(--accent-purple)] to-[var(--accent-blue)] text-[10px] font-bold text-white flex items-center justify-center shadow-lg shadow-[var(--accent-purple)]/30">
            2
          </span>
        </motion.button>

        {/* Date Navigation */}
        <div className="flex items-center gap-1 px-4 py-2.5 rounded-xl glass border border-[var(--border-default)]">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="p-1.5 hover:bg-[var(--accent-purple)]/10 rounded-lg transition-colors"
          >
            <ChevronLeft size={16} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors" />
          </motion.button>
          <span className="text-sm font-medium text-[var(--text-secondary)] px-3">
            Today, {formattedDate}
          </span>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="p-1.5 hover:bg-[var(--accent-purple)]/10 rounded-lg transition-colors"
          >
            <ChevronRight size={16} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors" />
          </motion.button>
        </div>

        {/* User Profile */}
        <div className="flex items-center gap-3 pl-5 border-l border-[var(--border-default)]">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--accent-purple)] to-[var(--accent-blue)] flex items-center justify-center shadow-lg shadow-[var(--accent-purple)]/20">
            <span className="text-white text-sm font-bold">JN</span>
          </div>
          <div className="hidden lg:block">
            <p className="text-sm font-semibold text-[var(--text-primary)]">Justin</p>
            <p className="text-xs text-[var(--text-muted)]">Admin</p>
          </div>
          <ChevronDown size={16} className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors cursor-pointer" />
        </div>
      </div>
    </header>
  );
}
