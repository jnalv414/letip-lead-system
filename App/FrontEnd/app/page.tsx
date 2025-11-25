'use client';

import { useSocketStatus } from '@/core/providers/websocket-provider';
import {
  MyLeadsSection,
  PipelineOverviewSection,
  TopBusinessesGrid,
  RecentBusinessesTable,
} from '@/components/dashboard';
import { AppShell } from '@/components/layout';
import { BlurFade } from '@/components/magicui/blur-fade';

export default function DashboardPage() {
  const { isConnected } = useSocketStatus();

  return (
    <AppShell title="Dashboard">
      {/* Connection Status Banner */}
      <BlurFade delay={0.1} duration={0.4}>
        <div className="mb-10">
          <div className={`
            flex items-center gap-3 px-5 py-3 rounded-xl text-sm font-medium w-fit glass border
            ${isConnected
              ? 'bg-[var(--highlight-emerald)]/10 text-[var(--highlight-emerald)] border-[var(--highlight-emerald)]/20'
              : 'bg-red-500/10 text-red-400 border-red-500/20'}
          `}>
            <span className={`
              w-2.5 h-2.5 rounded-full
              ${isConnected ? 'bg-[var(--highlight-emerald)] animate-pulse shadow-lg shadow-[var(--highlight-emerald)]/50' : 'bg-red-400'}
            `} />
            {isConnected ? 'Live Updates Active' : 'Connecting...'}
          </div>
        </div>
      </BlurFade>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Column - My Leads Chart */}
        <BlurFade delay={0.2} duration={0.5} className="lg:col-span-7">
          <MyLeadsSection />
        </BlurFade>

        {/* Right Column - Pipeline Overview */}
        <BlurFade delay={0.3} duration={0.5} className="lg:col-span-5">
          <PipelineOverviewSection />
        </BlurFade>
      </div>

      {/* Top Businesses Grid */}
      <BlurFade delay={0.4} duration={0.5}>
        <div className="mt-12">
          <TopBusinessesGrid />
        </div>
      </BlurFade>

      {/* Recent Businesses Table */}
      <BlurFade delay={0.5} duration={0.5}>
        <div className="mt-12">
          <RecentBusinessesTable />
        </div>
      </BlurFade>
    </AppShell>
  );
}
