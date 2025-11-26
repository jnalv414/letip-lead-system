'use client';

import { ReactNode } from 'react';
import { Sidebar } from './sidebar';
import { Header } from './header';

interface AppShellProps {
  children: ReactNode;
  title?: string;
  isConnected?: boolean;
}

export function AppShell({ children, title, isConnected }: AppShellProps) {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] relative overflow-hidden">
      {/* Left Gradient Glow Strip */}
      <div
        className="fixed left-0 top-0 h-full w-32 pointer-events-none z-0"
        style={{
          background: 'linear-gradient(to right, rgba(139, 92, 246, 0.18) 0%, rgba(59, 130, 246, 0.1) 50%, transparent 100%)',
        }}
      />

      {/* Left Primary Orb - Purple - Fast */}
      <div
        className="fixed left-[-30px] top-[15%] w-[280px] h-[380px] pointer-events-none z-0 orb-animated-fast"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(139, 92, 246, 0.5) 0%, transparent 70%)',
          filter: 'blur(45px)',
        }}
      />

      {/* Left Secondary Orb - Cyan/Teal - Slow */}
      <div
        className="fixed left-[-15px] bottom-[20%] w-[220px] h-[300px] pointer-events-none z-0 orb-animated-slow"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(6, 182, 212, 0.45) 0%, transparent 70%)',
          filter: 'blur(38px)',
        }}
      />

      {/* Right Gradient Glow Strip */}
      <div
        className="fixed right-0 top-0 h-full w-32 pointer-events-none z-0"
        style={{
          background: 'linear-gradient(to left, rgba(59, 130, 246, 0.18) 0%, rgba(6, 182, 212, 0.1) 50%, transparent 100%)',
        }}
      />

      {/* Right Primary Orb - Blue - Normal */}
      <div
        className="fixed right-[-25px] bottom-[18%] w-[300px] h-[400px] pointer-events-none z-0 orb-animated"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(59, 130, 246, 0.5) 0%, transparent 70%)',
          filter: 'blur(42px)',
        }}
      />

      {/* Right Secondary Orb - Purple - Slow */}
      <div
        className="fixed right-[-12px] top-[25%] w-[240px] h-[320px] pointer-events-none z-0 orb-animated-slow"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(139, 92, 246, 0.4) 0%, transparent 70%)',
          filter: 'blur(36px)',
        }}
      />

      {/* Center Floating Orb - Cyan/Teal - Fast (4th orb) */}
      <div
        className="fixed left-[50%] top-[40%] w-[180px] h-[240px] pointer-events-none z-0 orb-animated-fast"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(6, 214, 244, 0.35) 0%, transparent 70%)',
          filter: 'blur(32px)',
          transform: 'translateX(-50%)',
        }}
      />

      <Sidebar />
      <div className="relative z-10">
        <Header title={title} isConnected={isConnected} />
        <main className="p-10 pt-6 max-w-[1680px] mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

export { Sidebar } from './sidebar';
export { Header } from './header';
