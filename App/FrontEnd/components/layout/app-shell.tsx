'use client';

import { ReactNode } from 'react';
import { Sidebar } from './sidebar';
import { Header } from './header';

interface AppShellProps {
  children: ReactNode;
  title?: string;
}

export function AppShell({ children, title }: AppShellProps) {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <Sidebar />
      <div className="pl-[70px]">
        <Header title={title} />
        <main className="p-10 max-w-[1680px] mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

export { Sidebar } from './sidebar';
export { Header } from './header';
