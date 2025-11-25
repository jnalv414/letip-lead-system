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
    <header className="h-16 bg-[var(--bg-secondary)]/80 backdrop-blur-md border-b border-[var(--border-default)] px-6 flex items-center justify-between">
      {/* Title with dropdown */}
      <div className="flex items-center gap-2">
        <h1 className="text-lg font-semibold text-[var(--text-primary)]">{title}</h1>
        <ChevronDown size={16} className="text-[var(--text-muted)]" />
      </div>

      {/* Center: Search */}
      <div className="flex-1 max-w-md mx-8">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Search businesses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-lg bg-white/5 border border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-colors"
          />
        </div>
      </div>

      {/* Right: Notifications, Date, Profile */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="relative w-10 h-10 rounded-lg bg-white/5 border border-[var(--border-default)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          <Bell size={18} />
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-violet-500 text-[10px] font-medium text-white flex items-center justify-center">
            2
          </span>
        </motion.button>

        {/* Date Navigation */}
        <div className="flex items-center gap-1 px-3 py-2 rounded-lg bg-white/5 border border-[var(--border-default)]">
          <button className="p-1 hover:bg-white/10 rounded transition-colors">
            <ChevronLeft size={14} className="text-[var(--text-muted)]" />
          </button>
          <span className="text-sm text-[var(--text-secondary)] px-2">
            Today, {formattedDate}
          </span>
          <button className="p-1 hover:bg-white/10 rounded transition-colors">
            <ChevronRight size={14} className="text-[var(--text-muted)]" />
          </button>
        </div>

        {/* User Profile */}
        <div className="flex items-center gap-3 pl-4 border-l border-[var(--border-default)]">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center">
            <span className="text-white text-sm font-medium">JN</span>
          </div>
          <div className="hidden lg:block">
            <p className="text-sm font-medium text-[var(--text-primary)]">Justin</p>
            <p className="text-xs text-[var(--text-muted)]">Admin</p>
          </div>
          <ChevronDown size={14} className="text-[var(--text-muted)]" />
        </div>
      </div>
    </header>
  );
}
