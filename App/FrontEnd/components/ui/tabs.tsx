'use client';

import { useState, useRef, useEffect, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface Tab {
  id: string;
  label: string;
}

interface TabsProps {
  tabs: Tab[];
  defaultTab?: string;
  onChange?: (tabId: string) => void;
  className?: string;
}

export function Tabs({ tabs, defaultTab, onChange, className }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  useEffect(() => {
    const activeTabEl = tabRefs.current.get(activeTab);
    if (activeTabEl) {
      setIndicatorStyle({
        left: activeTabEl.offsetLeft,
        width: activeTabEl.offsetWidth,
      });
    }
  }, [activeTab]);

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    onChange?.(tabId);
  };

  return (
    <div className={cn('relative inline-flex rounded-lg bg-white/5 p-1', className)}>
      <motion.div
        className="absolute top-1 bottom-1 rounded-md bg-violet-500/20"
        animate={indicatorStyle}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      />
      {tabs.map((tab) => (
        <button
          key={tab.id}
          ref={(el) => {
            if (el) tabRefs.current.set(tab.id, el);
          }}
          onClick={() => handleTabClick(tab.id)}
          className={cn(
            'relative z-10 px-4 py-2 text-sm font-medium rounded-md transition-colors',
            activeTab === tab.id
              ? 'text-violet-400'
              : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

interface TabsContentProps {
  children: ReactNode;
  value: string;
  activeValue: string;
}

export function TabsContent({ children, value, activeValue }: TabsContentProps) {
  if (value !== activeValue) return null;
  return <>{children}</>;
}
