/**
 * Usage Example: MyLeadsSection Component
 *
 * This file demonstrates how to integrate the MyLeadsSection
 * component into a dashboard page with other sections.
 *
 * Copy this pattern to your dashboard pages.
 */

import { MyLeadsSection } from '@/components/dashboard/sections';

// Example: Simple dashboard page with just the leads section
export default function SimpleDashboard() {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-8">
          Dashboard
        </h1>

        <MyLeadsSection />
      </div>
    </div>
  );
}

// Example: Full dashboard with multiple sections
export function FullDashboard() {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[var(--text-primary)]">
              Dashboard
            </h1>
            <p className="text-[var(--text-muted)] mt-1">
              Real-time lead tracking and analytics
            </p>
          </div>

          <button className="px-4 py-2 bg-[var(--accent-purple)] text-white rounded-lg hover:bg-[var(--accent-purple-light)] transition-colors">
            New Lead
          </button>
        </header>

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left column - Full width on mobile, half on desktop */}
          <div className="lg:col-span-2">
            <MyLeadsSection />
          </div>

          {/* Add other sections here */}
          {/* <PipelineOverviewSection /> */}
          {/* <RecentBusinessesTable /> */}
        </div>
      </div>
    </div>
  );
}

// Example: Dashboard with sidebar layout
export function DashboardWithSidebar() {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex">
      {/* Sidebar */}
      <aside className="w-64 glass-elevated p-6 border-r border-[var(--border-default)]">
        <nav className="space-y-2">
          <a
            href="#"
            className="block px-4 py-2 rounded-lg bg-[var(--accent-purple)]/10 text-[var(--accent-purple)] font-medium"
          >
            Overview
          </a>
          <a
            href="#"
            className="block px-4 py-2 rounded-lg text-[var(--text-secondary)] hover:bg-white/5"
          >
            Leads
          </a>
          <a
            href="#"
            className="block px-4 py-2 rounded-lg text-[var(--text-secondary)] hover:bg-white/5"
          >
            Pipeline
          </a>
          <a
            href="#"
            className="block px-4 py-2 rounded-lg text-[var(--text-secondary)] hover:bg-white/5"
          >
            Analytics
          </a>
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <h1 className="text-3xl font-bold text-[var(--text-primary)]">
            Lead Overview
          </h1>

          <MyLeadsSection />

          {/* Add more sections below */}
        </div>
      </main>
    </div>
  );
}

// Example: Responsive grid dashboard
export function GridDashboard() {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Responsive grid - 1 col mobile, 2 cols tablet, 3 cols desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Span 2 columns on desktop, full width on mobile */}
          <div className="lg:col-span-2">
            <MyLeadsSection />
          </div>

          {/* Sidebar stats - Full width on mobile, 1 col on desktop */}
          <div className="space-y-6">
            <div className="glass rounded-xl p-6">
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
                Quick Stats
              </h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-[var(--text-muted)]">Conversion Rate</p>
                  <p className="text-2xl font-bold text-[var(--accent-purple)]">
                    68.5%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-[var(--text-muted)]">Avg. Response Time</p>
                  <p className="text-2xl font-bold text-[var(--text-primary)]">
                    2.4h
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Example: Integration with react-query provider
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30000, // 30 seconds
    },
  },
});

export function DashboardWithProviders() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-[var(--bg-primary)] p-6">
        <MyLeadsSection />
      </div>
    </QueryClientProvider>
  );
}

/**
 * API Integration Example
 *
 * Replace mock data with real API calls:
 */

// 1. Create API service
/*
// services/leads-api.ts
export async function fetchLeadTrend(period: '24h' | 'week' | 'month') {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/leads/trend?period=${period}`
  );
  if (!response.ok) throw new Error('Failed to fetch lead trend');
  return response.json();
}

export async function fetchLeadStats(period: '24h' | 'week' | 'month') {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/leads/stats?period=${period}`
  );
  if (!response.ok) throw new Error('Failed to fetch lead stats');
  return response.json();
}
*/

// 2. Update component to use real API
/*
// In my-leads-section.tsx, replace:

const { data: leadData } = useQuery({
  queryKey: ['leads-trend', selectedPeriod],
  queryFn: () => Promise.resolve(generateMockData(selectedPeriod)),
  refetchInterval: 60000,
});

// With:

import { fetchLeadTrend } from '@/services/leads-api';

const { data: leadData } = useQuery({
  queryKey: ['leads-trend', selectedPeriod],
  queryFn: () => fetchLeadTrend(selectedPeriod),
  refetchInterval: 60000,
});
*/

/**
 * WebSocket Integration Example
 *
 * Add real-time updates when new leads are created:
 */

/*
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { io } from 'socket.io-client';

export function MyLeadsSectionWithRealTime() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000');

    // Listen for new leads
    socket.on('business:created', () => {
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['leads-trend'] });
      queryClient.invalidateQueries({ queryKey: ['leads-stats'] });
    });

    // Listen for enrichment updates
    socket.on('business:enriched', () => {
      queryClient.invalidateQueries({ queryKey: ['leads-stats'] });
    });

    return () => {
      socket.disconnect();
    };
  }, [queryClient]);

  return <MyLeadsSection />;
}
*/

/**
 * Testing Example
 *
 * Unit test for the component:
 */

/*
// __tests__/my-leads-section.test.tsx
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MyLeadsSection } from '../my-leads-section';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return ({ children }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('MyLeadsSection', () => {
  it('renders the component title', () => {
    render(<MyLeadsSection />, { wrapper: createWrapper() });
    expect(screen.getByText('My Leads')).toBeInTheDocument();
  });

  it('displays period selector tabs', () => {
    render(<MyLeadsSection />, { wrapper: createWrapper() });
    expect(screen.getByText('24 Hours')).toBeInTheDocument();
    expect(screen.getByText('Week')).toBeInTheDocument();
    expect(screen.getByText('Month')).toBeInTheDocument();
  });

  it('shows mini stats row', () => {
    render(<MyLeadsSection />, { wrapper: createWrapper() });
    expect(screen.getByText('Total Leads')).toBeInTheDocument();
    expect(screen.getByText('Enriched')).toBeInTheDocument();
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });
});
*/
