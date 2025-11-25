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
        <div className="mb-8">
          <div className={`
            flex items-center gap-2 px-4 py-2 rounded-lg text-sm w-fit
            ${isConnected
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              : 'bg-red-500/10 text-red-400 border border-red-500/20'}
          `}>
            <span className={`
              w-2 h-2 rounded-full
              ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}
            `} />
            {isConnected ? 'Live Updates Active' : 'Connecting...'}
          </div>
        </div>
      </BlurFade>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
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
        <div className="mt-10">
          <TopBusinessesGrid />
        </div>
      </BlurFade>

      {/* Recent Businesses Table */}
      <BlurFade delay={0.5} duration={0.5}>
        <div className="mt-10">
          <RecentBusinessesTable />
        </div>
      </BlurFade>
    </AppShell>
  );
}
