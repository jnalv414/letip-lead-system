'use client';

import { useQuery } from '@tanstack/react-query';
import { useSocketListener } from '@/core/providers/websocket-provider';
import { useState } from 'react';

interface Stats {
  totalBusinesses: number;
  enrichedBusinesses: number;
  pendingEnrichment: number;
  totalContacts: number;
  messagesSent?: number;
}

async function fetchStats(): Promise<Stats> {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/businesses/stats`);
  if (!response.ok) throw new Error('Failed to fetch stats');
  return response.json();
}

export function DashboardStats() {
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['stats'],
    queryFn: fetchStats,
    refetchInterval: 30000,
  });

  useSocketListener('stats:updated', () => {
    setLastUpdate(new Date());
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="bg-slate-800 rounded-lg p-6 animate-pulse"
          >
            <div className="h-4 bg-slate-700 rounded w-24 mb-4" />
            <div className="h-8 bg-slate-700 rounded w-16" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
        <p className="text-red-400 text-sm">Failed to load statistics</p>
      </div>
    );
  }

  const statCards = [
    {
      label: 'Total Businesses',
      value: stats?.totalBusinesses || 0,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
    },
    {
      label: 'Enriched',
      value: stats?.enrichedBusinesses || 0,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      accent: true,
    },
    {
      label: 'Pending',
      value: stats?.pendingEnrichment || 0,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: 'Total Contacts',
      value: stats?.totalContacts || 0,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
  ];

  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-100">
          Overview
        </h2>
        <span className="text-sm text-gray-500">
          Updated {lastUpdate.toLocaleTimeString()}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className={`
              bg-slate-800 rounded-lg p-6
              border border-slate-700
              hover:border-slate-600
              transition-colors duration-200
              ${stat.accent ? 'ring-1 ring-accent/20' : ''}
            `}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className={`
                p-2 rounded-md
                ${stat.accent ? 'bg-accent/10 text-accent' : 'bg-slate-700 text-gray-400'}
              `}>
                {stat.icon}
              </div>
              <span className="text-sm font-medium text-gray-400">
                {stat.label}
              </span>
            </div>
            <p className="text-3xl font-bold text-white">
              {stat.value.toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
