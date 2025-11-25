'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Sidebar } from './sidebar';
import { Header } from './header';

interface AppShellProps {
  children: ReactNode;
  title?: string;
}

export function AppShell({ children, title }: AppShellProps) {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] relative overflow-hidden">
      {/* Left Gradient Glow Strip */}
      <div
        className="fixed left-0 top-0 h-full w-32 pointer-events-none z-0"
        style={{
          background: 'linear-gradient(to right, rgba(139, 92, 246, 0.18) 0%, rgba(59, 130, 246, 0.1) 50%, transparent 100%)',
        }}
      />

      {/* Left Animated Orb */}
      <motion.div
        className="fixed left-[-20px] top-[20%] w-[250px] h-[350px] pointer-events-none z-0"
        animate={{
          opacity: [0.4, 0.7, 0.4],
          scale: [1, 1.15, 1],
          y: [0, 30, 0]
        }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        style={{
          background: 'radial-gradient(ellipse at center, rgba(139, 92, 246, 0.5) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />

      {/* Left Secondary Orb */}
      <motion.div
        className="fixed left-[-10px] bottom-[25%] w-[200px] h-[280px] pointer-events-none z-0"
        animate={{
          opacity: [0.35, 0.6, 0.35],
          scale: [1, 1.2, 1],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        style={{
          background: 'radial-gradient(ellipse at center, rgba(6, 182, 212, 0.45) 0%, transparent 70%)',
          filter: 'blur(35px)',
        }}
      />

      {/* Right Gradient Glow Strip */}
      <div
        className="fixed right-0 top-0 h-full w-32 pointer-events-none z-0"
        style={{
          background: 'linear-gradient(to left, rgba(59, 130, 246, 0.18) 0%, rgba(6, 182, 212, 0.1) 50%, transparent 100%)',
        }}
      />

      {/* Right Animated Orb */}
      <motion.div
        className="fixed right-[-20px] bottom-[20%] w-[250px] h-[350px] pointer-events-none z-0"
        animate={{
          opacity: [0.4, 0.7, 0.4],
          scale: [1, 1.15, 1],
          y: [0, -30, 0]
        }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        style={{
          background: 'radial-gradient(ellipse at center, rgba(59, 130, 246, 0.5) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />

      {/* Right Secondary Orb */}
      <motion.div
        className="fixed right-[-10px] top-[30%] w-[200px] h-[280px] pointer-events-none z-0"
        animate={{
          opacity: [0.35, 0.55, 0.35],
          scale: [1, 1.18, 1],
        }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 3 }}
        style={{
          background: 'radial-gradient(ellipse at center, rgba(139, 92, 246, 0.4) 0%, transparent 70%)',
          filter: 'blur(35px)',
        }}
      />

      <Sidebar />
      <div className="relative z-10">
        <Header title={title} />
        <main className="p-10 pt-6 max-w-[1680px] mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

export { Sidebar } from './sidebar';
export { Header } from './header';
