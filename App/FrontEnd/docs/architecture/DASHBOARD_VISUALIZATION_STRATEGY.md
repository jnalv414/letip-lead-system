# LeTip Lead System - Dashboard Visualization Strategy

## Overview

This document defines the complete data visualization strategy for the LeTip Lead System dashboard, including data transformation functions, Prisma query patterns, real-time update logic, and Recharts configurations.

**Color Scheme:**
- Primary: Charcoal `#1A1A1D` (60% usage)
- Secondary: Teal `#145A5A` (30% usage)
- Accent: Orange `#FF5722` (10% usage)
- Status Colors:
  - Pending: `#145A5A` (Teal)
  - Enriched: `#FF5722` (Orange)
  - Failed: `#E53935` (Red)
  - Success: `#4CAF50` (Green)

---

## 1. Business Growth Area Chart

### Purpose
Visualize business acquisition trends over time with daily/weekly/monthly aggregation options.

### Data Transformation

```typescript
// dashboard/lib/data-transformations/business-growth.ts

import { format, subDays, startOfWeek, startOfMonth, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval } from 'date-fns';

export type TimeGranularity = 'daily' | 'weekly' | 'monthly';

export interface BusinessGrowthDataPoint {
  date: string;           // Formatted date label
  count: number;          // Number of businesses created
  cumulative: number;     // Cumulative total
  trend: number;          // Percentage change from previous period
  timestamp: Date;        // Raw timestamp for calculations
}

export interface Business {
  id: number;
  name: string;
  created_at: Date;
  enrichment_status: string;
}

/**
 * Transform raw business data into growth chart format.
 *
 * @param businesses - Array of businesses from database
 * @param granularity - Time aggregation level
 * @param days - Number of days to include (default 30)
 * @returns Array of data points for Recharts
 *
 * @example
 * const data = transformBusinessGrowthData(businesses, 'daily', 30);
 * // [{ date: 'Jan 01', count: 12, cumulative: 45, trend: 8.5, timestamp: Date }]
 */
export function transformBusinessGrowthData(
  businesses: Business[],
  granularity: TimeGranularity = 'daily',
  days: number = 30
): BusinessGrowthDataPoint[] {
  const endDate = new Date();
  const startDate = subDays(endDate, days);

  // Generate date intervals based on granularity
  let intervals: Date[];
  let dateFormat: string;

  switch (granularity) {
    case 'daily':
      intervals = eachDayOfInterval({ start: startDate, end: endDate });
      dateFormat = 'MMM dd';
      break;
    case 'weekly':
      intervals = eachWeekOfInterval({ start: startDate, end: endDate }, { weekStartsOn: 1 });
      dateFormat = 'MMM dd';
      break;
    case 'monthly':
      intervals = eachMonthOfInterval({ start: startDate, end: endDate });
      dateFormat = 'MMM yyyy';
      break;
  }

  // Group businesses by date interval
  const grouped = new Map<string, number>();
  intervals.forEach(date => {
    grouped.set(date.toISOString(), 0);
  });

  businesses.forEach(business => {
    const createdDate = new Date(business.created_at);
    if (createdDate < startDate || createdDate > endDate) return;

    // Find the interval this business belongs to
    let intervalKey: string;
    switch (granularity) {
      case 'daily':
        intervalKey = new Date(createdDate.setHours(0, 0, 0, 0)).toISOString();
        break;
      case 'weekly':
        intervalKey = startOfWeek(createdDate, { weekStartsOn: 1 }).toISOString();
        break;
      case 'monthly':
        intervalKey = startOfMonth(createdDate).toISOString();
        break;
    }

    if (grouped.has(intervalKey)) {
      grouped.set(intervalKey, grouped.get(intervalKey)! + 1);
    }
  });

  // Transform to chart data with cumulative and trend calculations
  let cumulative = 0;
  const dataPoints: BusinessGrowthDataPoint[] = [];

  intervals.forEach((date, index) => {
    const key = date.toISOString();
    const count = grouped.get(key) || 0;
    cumulative += count;

    // Calculate trend (percentage change from previous period)
    let trend = 0;
    if (index > 0 && dataPoints[index - 1].count > 0) {
      trend = ((count - dataPoints[index - 1].count) / dataPoints[index - 1].count) * 100;
    }

    dataPoints.push({
      date: format(date, dateFormat),
      count,
      cumulative,
      trend: Math.round(trend * 10) / 10, // Round to 1 decimal
      timestamp: date
    });
  });

  return dataPoints;
}

/**
 * Calculate key growth metrics for summary cards.
 */
export function calculateGrowthMetrics(data: BusinessGrowthDataPoint[]) {
  if (data.length === 0) {
    return {
      totalGrowth: 0,
      averagePerPeriod: 0,
      peakPeriod: null,
      weekOverWeekGrowth: 0
    };
  }

  const total = data.reduce((sum, point) => sum + point.count, 0);
  const average = total / data.length;

  // Find peak period
  const peak = data.reduce((max, point) =>
    point.count > max.count ? point : max
  , data[0]);

  // Calculate week-over-week growth (compare last 7 days to previous 7 days)
  const lastWeek = data.slice(-7).reduce((sum, p) => sum + p.count, 0);
  const previousWeek = data.slice(-14, -7).reduce((sum, p) => sum + p.count, 0);
  const weekOverWeekGrowth = previousWeek > 0
    ? ((lastWeek - previousWeek) / previousWeek) * 100
    : 0;

  return {
    totalGrowth: total,
    averagePerPeriod: Math.round(average * 10) / 10,
    peakPeriod: {
      date: peak.date,
      count: peak.count
    },
    weekOverWeekGrowth: Math.round(weekOverWeekGrowth * 10) / 10
  };
}
```

### Prisma Query

```typescript
// dashboard/lib/queries/business-growth.ts

import { PrismaClient } from '@prisma/client';
import { subDays } from 'date-fns';

const prisma = new PrismaClient();

/**
 * Fetch businesses for growth chart with optimized query.
 * Only retrieves necessary fields and filters by date range.
 */
export async function fetchBusinessGrowthData(days: number = 30) {
  const startDate = subDays(new Date(), days);

  return await prisma.business.findMany({
    where: {
      created_at: {
        gte: startDate
      }
    },
    select: {
      id: true,
      name: true,
      created_at: true,
      enrichment_status: true
    },
    orderBy: {
      created_at: 'asc'
    }
  });
}

/**
 * Database-level aggregation for better performance on large datasets.
 * Uses raw SQL for optimized grouping.
 */
export async function fetchBusinessGrowthAggregated(
  granularity: 'day' | 'week' | 'month',
  days: number = 30
) {
  const startDate = subDays(new Date(), days);

  const groupByClause = {
    day: "DATE_TRUNC('day', created_at)",
    week: "DATE_TRUNC('week', created_at)",
    month: "DATE_TRUNC('month', created_at)"
  }[granularity];

  const result = await prisma.$queryRawUnsafe<Array<{
    date: Date;
    count: bigint;
  }>>`
    SELECT
      ${groupByClause} as date,
      COUNT(*)::int as count
    FROM business
    WHERE created_at >= ${startDate}
    GROUP BY date
    ORDER BY date ASC
  `;

  return result.map(row => ({
    date: row.date,
    count: Number(row.count)
  }));
}
```

### Recharts Configuration

```typescript
// dashboard/components/charts/BusinessGrowthChart.tsx

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const COLORS = {
  gradient: {
    start: '#FF5722',  // Orange
    end: '#E64A19'     // Darker orange
  },
  grid: '#2A2A2D',     // Subtle grid
  text: '#B0B0B0'      // Light gray text
};

export default function BusinessGrowthChart({ data }: { data: BusinessGrowthDataPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="growthGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={COLORS.gradient.start} stopOpacity={0.8} />
            <stop offset="95%" stopColor={COLORS.gradient.end} stopOpacity={0.1} />
          </linearGradient>
        </defs>

        <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} />

        <XAxis
          dataKey="date"
          stroke={COLORS.text}
          style={{ fontSize: '12px' }}
        />

        <YAxis
          stroke={COLORS.text}
          style={{ fontSize: '12px' }}
        />

        <Tooltip
          contentStyle={{
            backgroundColor: '#1A1A1D',
            border: '1px solid #145A5A',
            borderRadius: '8px',
            padding: '12px'
          }}
          labelStyle={{ color: '#FFFFFF', fontWeight: 'bold' }}
          formatter={(value: number, name: string) => {
            if (name === 'count') return [`${value} businesses`, 'New'];
            if (name === 'cumulative') return [`${value} total`, 'Cumulative'];
            return [value, name];
          }}
        />

        <Area
          type="monotone"
          dataKey="count"
          stroke={COLORS.gradient.start}
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#growthGradient)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
```

### Real-time Updates

```typescript
// dashboard/hooks/useBusinessGrowth.ts

import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { transformBusinessGrowthData, BusinessGrowthDataPoint } from '@/lib/data-transformations/business-growth';
import { fetchBusinessGrowthData } from '@/lib/queries/business-growth';

export function useBusinessGrowth(granularity: 'daily' | 'weekly' | 'monthly', days: number = 30) {
  const [data, setData] = useState<BusinessGrowthDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState<Socket | null>(null);

  // Initial data fetch
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const businesses = await fetchBusinessGrowthData(days);
        const transformed = transformBusinessGrowthData(businesses, granularity, days);
        setData(transformed);
      } catch (error) {
        console.error('Error loading business growth data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [granularity, days]);

  // WebSocket connection for real-time updates
  useEffect(() => {
    const socketInstance = io(process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3000');
    setSocket(socketInstance);

    // Listen for business creation events
    socketInstance.on('business:created', async (payload) => {
      console.log('New business created:', payload);

      // Refetch data to include new business
      const businesses = await fetchBusinessGrowthData(days);
      const transformed = transformBusinessGrowthData(businesses, granularity, days);
      setData(transformed);
    });

    return () => {
      socketInstance.disconnect();
    };
  }, [granularity, days]);

  return { data, loading };
}
```

### Mock Data Generator

```typescript
// dashboard/lib/mock-data/business-growth.ts

import { subDays, addDays } from 'date-fns';
import { Business } from '@/lib/data-transformations/business-growth';

/**
 * Generate realistic mock business data for testing.
 * Simulates growth patterns with weekly cycles and random variation.
 */
export function generateMockBusinessGrowthData(days: number = 30): Business[] {
  const businesses: Business[] = [];
  const endDate = new Date();
  const startDate = subDays(endDate, days);

  let id = 1;
  let currentDate = startDate;

  while (currentDate <= endDate) {
    // Simulate weekly pattern (more businesses on weekdays)
    const dayOfWeek = currentDate.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    // Base count with weekend reduction
    let dailyCount = Math.floor(Math.random() * 15) + 5; // 5-20 businesses
    if (isWeekend) dailyCount = Math.floor(dailyCount * 0.4); // 60% reduction on weekends

    // Add trend (gradual increase over time)
    const daysSinceStart = Math.floor((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const trendBoost = Math.floor(daysSinceStart / 7); // +1 business per week
    dailyCount += trendBoost;

    // Create businesses for this day
    for (let i = 0; i < dailyCount; i++) {
      const createdAt = new Date(currentDate);
      createdAt.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));

      businesses.push({
        id: id++,
        name: `Business ${id}`,
        created_at: createdAt,
        enrichment_status: ['pending', 'enriched', 'failed'][Math.floor(Math.random() * 3)]
      });
    }

    currentDate = addDays(currentDate, 1);
  }

  return businesses.sort((a, b) => a.created_at.getTime() - b.created_at.getTime());
}

/**
 * Pre-generated mock data for consistent testing.
 */
export const mockBusinessGrowthData = [
  { date: 'Jan 15', count: 12, cumulative: 45, trend: 8.5, timestamp: new Date('2025-01-15') },
  { date: 'Jan 16', count: 15, cumulative: 60, trend: 25.0, timestamp: new Date('2025-01-16') },
  { date: 'Jan 17', count: 8, cumulative: 68, trend: -46.7, timestamp: new Date('2025-01-17') },
  { date: 'Jan 18', count: 3, cumulative: 71, trend: -62.5, timestamp: new Date('2025-01-18') },
  { date: 'Jan 19', count: 4, cumulative: 75, trend: 33.3, timestamp: new Date('2025-01-19') },
  { date: 'Jan 20', count: 18, cumulative: 93, trend: 350.0, timestamp: new Date('2025-01-20') },
  { date: 'Jan 21', count: 22, cumulative: 115, trend: 22.2, timestamp: new Date('2025-01-21') },
];
```

---

## 2. Lead Sources Bar Chart

### Purpose
Compare business acquisition sources (scraped, manual, imported) with enrichment status breakdown.

### Data Transformation

```typescript
// dashboard/lib/data-transformations/lead-sources.ts

export interface LeadSourceDataPoint {
  source: string;           // 'Google Maps', 'Manual Entry', 'CSV Import'
  total: number;            // Total businesses from this source
  pending: number;          // Pending enrichment
  enriched: number;         // Successfully enriched
  failed: number;           // Failed enrichment
  enrichmentRate: number;   // Percentage enriched
}

export interface BusinessWithSource {
  source: string;
  enrichment_status: string;
}

/**
 * Transform businesses into lead source breakdown.
 *
 * @param businesses - Array of businesses with source and enrichment status
 * @returns Array of data points for stacked bar chart
 */
export function transformLeadSourceData(businesses: BusinessWithSource[]): LeadSourceDataPoint[] {
  // Group by source
  const grouped = new Map<string, {
    total: number;
    pending: number;
    enriched: number;
    failed: number;
  }>();

  businesses.forEach(business => {
    const source = formatSourceName(business.source);

    if (!grouped.has(source)) {
      grouped.set(source, { total: 0, pending: 0, enriched: 0, failed: 0 });
    }

    const stats = grouped.get(source)!;
    stats.total++;

    switch (business.enrichment_status) {
      case 'pending':
        stats.pending++;
        break;
      case 'enriched':
        stats.enriched++;
        break;
      case 'failed':
        stats.failed++;
        break;
    }
  });

  // Transform to array and calculate enrichment rate
  return Array.from(grouped.entries()).map(([source, stats]) => ({
    source,
    total: stats.total,
    pending: stats.pending,
    enriched: stats.enriched,
    failed: stats.failed,
    enrichmentRate: stats.total > 0
      ? Math.round((stats.enriched / stats.total) * 100)
      : 0
  }))
  .sort((a, b) => b.total - a.total); // Sort by total descending
}

/**
 * Format source names for display.
 */
function formatSourceName(source: string): string {
  const mapping: Record<string, string> = {
    'google_maps': 'Google Maps',
    'manual': 'Manual Entry',
    'csv_import': 'CSV Import',
    'api': 'API Integration'
  };

  return mapping[source] || source.replace(/_/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Calculate source performance metrics.
 */
export function calculateSourceMetrics(data: LeadSourceDataPoint[]) {
  const totalBusinesses = data.reduce((sum, source) => sum + source.total, 0);
  const bestSource = data.reduce((best, source) =>
    source.enrichmentRate > best.enrichmentRate ? source : best
  , data[0]);

  const averageEnrichmentRate = data.reduce((sum, source) =>
    sum + source.enrichmentRate, 0
  ) / data.length;

  return {
    totalBusinesses,
    bestSource: {
      name: bestSource?.source,
      rate: bestSource?.enrichmentRate
    },
    averageEnrichmentRate: Math.round(averageEnrichmentRate * 10) / 10,
    sourceCount: data.length
  };
}
```

### Prisma Query

```typescript
// dashboard/lib/queries/lead-sources.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Fetch businesses grouped by source with enrichment status.
 * Optimized query that only retrieves necessary fields.
 */
export async function fetchLeadSourceData() {
  return await prisma.business.findMany({
    select: {
      source: true,
      enrichment_status: true
    }
  });
}

/**
 * Database-level aggregation for better performance.
 */
export async function fetchLeadSourceAggregated() {
  const result = await prisma.$queryRaw<Array<{
    source: string;
    enrichment_status: string;
    count: bigint;
  }>>`
    SELECT
      source,
      enrichment_status,
      COUNT(*)::int as count
    FROM business
    GROUP BY source, enrichment_status
    ORDER BY source
  `;

  return result.map(row => ({
    source: row.source,
    enrichment_status: row.enrichment_status,
    count: Number(row.count)
  }));
}
```

### Recharts Configuration

```typescript
// dashboard/components/charts/LeadSourcesChart.tsx

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = {
  pending: '#145A5A',   // Teal
  enriched: '#FF5722',  // Orange
  failed: '#E53935',    // Red
  grid: '#2A2A2D',
  text: '#B0B0B0'
};

export default function LeadSourcesChart({ data }: { data: LeadSourceDataPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} />

        <XAxis
          dataKey="source"
          stroke={COLORS.text}
          style={{ fontSize: '12px' }}
        />

        <YAxis
          stroke={COLORS.text}
          style={{ fontSize: '12px' }}
        />

        <Tooltip
          contentStyle={{
            backgroundColor: '#1A1A1D',
            border: '1px solid #145A5A',
            borderRadius: '8px',
            padding: '12px'
          }}
          labelStyle={{ color: '#FFFFFF', fontWeight: 'bold', marginBottom: '8px' }}
          formatter={(value: number, name: string) => {
            const labels: Record<string, string> = {
              enriched: 'Enriched',
              pending: 'Pending',
              failed: 'Failed'
            };
            return [`${value} businesses`, labels[name] || name];
          }}
        />

        <Legend
          wrapperStyle={{ paddingTop: '20px' }}
          iconType="square"
        />

        <Bar dataKey="enriched" stackId="a" fill={COLORS.enriched} name="Enriched" />
        <Bar dataKey="pending" stackId="a" fill={COLORS.pending} name="Pending" />
        <Bar dataKey="failed" stackId="a" fill={COLORS.failed} name="Failed" />
      </BarChart>
    </ResponsiveContainer>
  );
}
```

### Real-time Updates

```typescript
// dashboard/hooks/useLeadSources.ts

import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { transformLeadSourceData, LeadSourceDataPoint } from '@/lib/data-transformations/lead-sources';
import { fetchLeadSourceData } from '@/lib/queries/lead-sources';

export function useLeadSources() {
  const [data, setData] = useState<LeadSourceDataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    setLoading(true);
    try {
      const businesses = await fetchLeadSourceData();
      const transformed = transformLeadSourceData(businesses);
      setData(transformed);
    } catch (error) {
      console.error('Error loading lead source data:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();

    const socket = io(process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3000');

    // Refresh on any business change
    socket.on('business:created', loadData);
    socket.on('business:enriched', loadData);
    socket.on('stats:updated', loadData);

    return () => {
      socket.disconnect();
    };
  }, []);

  return { data, loading, refresh: loadData };
}
```

### Mock Data Generator

```typescript
// dashboard/lib/mock-data/lead-sources.ts

import { LeadSourceDataPoint } from '@/lib/data-transformations/lead-sources';

export function generateMockLeadSourceData(): LeadSourceDataPoint[] {
  return [
    {
      source: 'Google Maps',
      total: 342,
      pending: 45,
      enriched: 287,
      failed: 10,
      enrichmentRate: 84
    },
    {
      source: 'Manual Entry',
      total: 89,
      pending: 12,
      enriched: 73,
      failed: 4,
      enrichmentRate: 82
    },
    {
      source: 'CSV Import',
      total: 156,
      pending: 67,
      enriched: 78,
      failed: 11,
      enrichmentRate: 50
    },
    {
      source: 'API Integration',
      total: 24,
      pending: 3,
      enriched: 21,
      failed: 0,
      enrichmentRate: 88
    }
  ];
}
```

---

## 3. Enrichment Status Distribution

### Purpose
Show the overall distribution of enrichment statuses across all businesses.

### Data Transformation

```typescript
// dashboard/lib/data-transformations/enrichment-status.ts

export interface EnrichmentStatusDataPoint {
  status: string;          // 'Pending', 'Enriched', 'Failed'
  count: number;           // Number of businesses
  percentage: number;      // Percentage of total
  color: string;           // Assigned color
}

export interface BusinessStatus {
  enrichment_status: string;
}

/**
 * Transform businesses into enrichment status distribution.
 */
export function transformEnrichmentStatusData(businesses: BusinessStatus[]): EnrichmentStatusDataPoint[] {
  const total = businesses.length;

  // Count by status
  const counts = new Map<string, number>();
  businesses.forEach(business => {
    const status = business.enrichment_status;
    counts.set(status, (counts.get(status) || 0) + 1);
  });

  // Color mapping
  const colors: Record<string, string> = {
    pending: '#145A5A',   // Teal
    enriched: '#FF5722',  // Orange
    failed: '#E53935'     // Red
  };

  // Transform to array
  return Array.from(counts.entries()).map(([status, count]) => ({
    status: status.charAt(0).toUpperCase() + status.slice(1),
    count,
    percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    color: colors[status] || '#9E9E9E'
  }))
  .sort((a, b) => b.count - a.count);
}

/**
 * Calculate enrichment health score (0-100).
 * Higher score = more enriched businesses, fewer failures.
 */
export function calculateEnrichmentHealthScore(data: EnrichmentStatusDataPoint[]): number {
  const enriched = data.find(d => d.status === 'Enriched')?.percentage || 0;
  const failed = data.find(d => d.status === 'Failed')?.percentage || 0;

  // Health = enrichment rate - (failure rate * 2)
  const healthScore = enriched - (failed * 2);
  return Math.max(0, Math.min(100, healthScore));
}
```

### Prisma Query

```typescript
// dashboard/lib/queries/enrichment-status.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Fetch enrichment status counts.
 */
export async function fetchEnrichmentStatusData() {
  return await prisma.business.findMany({
    select: {
      enrichment_status: true
    }
  });
}

/**
 * Database-level aggregation.
 */
export async function fetchEnrichmentStatusAggregated() {
  const result = await prisma.$queryRaw<Array<{
    enrichment_status: string;
    count: bigint;
  }>>`
    SELECT
      enrichment_status,
      COUNT(*)::int as count
    FROM business
    GROUP BY enrichment_status
    ORDER BY count DESC
  `;

  return result.map(row => ({
    enrichment_status: row.enrichment_status,
    count: Number(row.count)
  }));
}
```

### Recharts Configuration (Horizontal Bar)

```typescript
// dashboard/components/charts/EnrichmentStatusChart.tsx

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer } from 'recharts';

export default function EnrichmentStatusChart({ data }: { data: EnrichmentStatusDataPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2D" />

        <XAxis type="number" stroke="#B0B0B0" />
        <YAxis
          type="category"
          dataKey="status"
          stroke="#B0B0B0"
          width={80}
        />

        <Tooltip
          contentStyle={{
            backgroundColor: '#1A1A1D',
            border: '1px solid #145A5A',
            borderRadius: '8px'
          }}
          formatter={(value: number, name: string, props: any) => [
            `${value} (${props.payload.percentage}%)`,
            'Businesses'
          ]}
        />

        <Bar dataKey="count" radius={[0, 8, 8, 0]}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
```

### Alternative: Donut Chart

```typescript
// dashboard/components/charts/EnrichmentStatusDonut.tsx

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

export default function EnrichmentStatusDonut({ data }: { data: EnrichmentStatusDataPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={90}
          paddingAngle={5}
          dataKey="count"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>

        <Tooltip
          contentStyle={{
            backgroundColor: '#1A1A1D',
            border: '1px solid #145A5A',
            borderRadius: '8px'
          }}
          formatter={(value: number, name: string, props: any) => [
            `${value} (${props.payload.percentage}%)`,
            props.payload.status
          ]}
        />

        <Legend
          verticalAlign="middle"
          align="right"
          layout="vertical"
          formatter={(value, entry: any) => `${entry.payload.status}: ${entry.payload.percentage}%`}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
```

### Mock Data Generator

```typescript
// dashboard/lib/mock-data/enrichment-status.ts

import { EnrichmentStatusDataPoint } from '@/lib/data-transformations/enrichment-status';

export function generateMockEnrichmentStatusData(): EnrichmentStatusDataPoint[] {
  return [
    {
      status: 'Enriched',
      count: 459,
      percentage: 75,
      color: '#FF5722'
    },
    {
      status: 'Pending',
      count: 127,
      percentage: 21,
      color: '#145A5A'
    },
    {
      status: 'Failed',
      count: 25,
      percentage: 4,
      color: '#E53935'
    }
  ];
}
```

---

## 4. Top Performing Businesses

### Purpose
Identify businesses with the most contacts (successful enrichment).

### Data Transformation

```typescript
// dashboard/lib/data-transformations/top-businesses.ts

export interface TopBusinessDataPoint {
  id: number;
  name: string;
  industry: string | null;
  city: string | null;
  contactCount: number;
  enrichmentStatus: string;
  badge: 'gold' | 'silver' | 'bronze' | null;
}

export interface BusinessWithContacts {
  id: number;
  name: string;
  industry: string | null;
  city: string | null;
  enrichment_status: string;
  _count: {
    contacts: number;
  };
}

/**
 * Transform businesses into ranked list by contact count.
 */
export function transformTopBusinessesData(
  businesses: BusinessWithContacts[],
  limit: number = 10
): TopBusinessDataPoint[] {
  // Sort by contact count descending
  const sorted = businesses
    .filter(b => b._count.contacts > 0)
    .sort((a, b) => b._count.contacts - a._count.contacts)
    .slice(0, limit);

  // Assign badges to top 3
  return sorted.map((business, index) => ({
    id: business.id,
    name: business.name,
    industry: business.industry,
    city: business.city,
    contactCount: business._count.contacts,
    enrichmentStatus: business.enrichment_status,
    badge: index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? 'bronze' : null
  }));
}
```

### Prisma Query

```typescript
// dashboard/lib/queries/top-businesses.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Fetch businesses with contact counts, sorted by performance.
 */
export async function fetchTopBusinesses(limit: number = 10) {
  return await prisma.business.findMany({
    select: {
      id: true,
      name: true,
      industry: true,
      city: true,
      enrichment_status: true,
      _count: {
        select: {
          contacts: true
        }
      }
    },
    orderBy: {
      contacts: {
        _count: 'desc'
      }
    },
    take: limit,
    where: {
      contacts: {
        some: {}  // Only businesses with at least 1 contact
      }
    }
  });
}
```

### Component

```typescript
// dashboard/components/lists/TopBusinessesList.tsx

import { Trophy, Medal, Award } from 'lucide-react';

const badgeIcons = {
  gold: <Trophy className="w-5 h-5 text-yellow-500" />,
  silver: <Medal className="w-5 h-5 text-gray-400" />,
  bronze: <Award className="w-5 h-5 text-orange-700" />
};

export default function TopBusinessesList({ data }: { data: TopBusinessDataPoint[] }) {
  return (
    <div className="space-y-2">
      {data.map((business, index) => (
        <div
          key={business.id}
          className="flex items-center justify-between p-3 bg-[#1A1A1D] border border-[#2A2A2D] rounded-lg hover:border-[#145A5A] transition-colors"
        >
          <div className="flex items-center gap-3">
            {business.badge && (
              <div className="flex-shrink-0">
                {badgeIcons[business.badge]}
              </div>
            )}

            <div>
              <h4 className="font-medium text-white">{business.name}</h4>
              <p className="text-sm text-gray-400">
                {business.industry} • {business.city}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-[#FF5722]">
              {business.contactCount}
            </span>
            <span className="text-sm text-gray-400">contacts</span>
          </div>
        </div>
      ))}
    </div>
  );
}
```

### Mock Data Generator

```typescript
// dashboard/lib/mock-data/top-businesses.ts

import { TopBusinessDataPoint } from '@/lib/data-transformations/top-businesses';

export function generateMockTopBusinessesData(): TopBusinessDataPoint[] {
  return [
    { id: 1, name: 'Acme Plumbing Solutions', industry: 'Plumbing', city: 'Freehold', contactCount: 12, enrichmentStatus: 'enriched', badge: 'gold' },
    { id: 2, name: 'Superior HVAC Services', industry: 'HVAC', city: 'Manalapan', contactCount: 9, enrichmentStatus: 'enriched', badge: 'silver' },
    { id: 3, name: 'Elite Legal Partners', industry: 'Legal', city: 'Marlboro', contactCount: 8, enrichmentStatus: 'enriched', badge: 'bronze' },
    { id: 4, name: 'Precision Dental Care', industry: 'Healthcare', city: 'Howell', contactCount: 7, enrichmentStatus: 'enriched', badge: null },
    { id: 5, name: 'Metro Construction Group', industry: 'Construction', city: 'Freehold', contactCount: 6, enrichmentStatus: 'enriched', badge: null },
    { id: 6, name: 'TechStart Solutions', industry: 'Technology', city: 'Colts Neck', contactCount: 5, enrichmentStatus: 'enriched', badge: null },
    { id: 7, name: 'Green Landscaping Co', industry: 'Landscaping', city: 'Marlboro', contactCount: 5, enrichmentStatus: 'enriched', badge: null },
    { id: 8, name: 'Prime Real Estate', industry: 'Real Estate', city: 'Manalapan', contactCount: 4, enrichmentStatus: 'enriched', badge: null },
    { id: 9, name: 'Auto Experts Garage', industry: 'Automotive', city: 'Freehold', contactCount: 4, enrichmentStatus: 'enriched', badge: null },
    { id: 10, name: 'Wellness Chiropractic', industry: 'Healthcare', city: 'Howell', contactCount: 3, enrichmentStatus: 'enriched', badge: null }
  ];
}
```

---

## 5. Geographic Distribution

### Purpose
Show which cities have the most business leads.

### Data Transformation

```typescript
// dashboard/lib/data-transformations/geographic-distribution.ts

export interface GeographicDataPoint {
  city: string;
  count: number;
  percentage: number;
  enriched: number;
  pending: number;
}

export interface BusinessLocation {
  city: string | null;
  enrichment_status: string;
}

/**
 * Transform businesses into geographic distribution.
 */
export function transformGeographicData(
  businesses: BusinessLocation[],
  limit: number = 10
): GeographicDataPoint[] {
  const total = businesses.length;

  // Group by city
  const grouped = new Map<string, { total: number; enriched: number; pending: number }>();

  businesses.forEach(business => {
    const city = business.city || 'Unknown';

    if (!grouped.has(city)) {
      grouped.set(city, { total: 0, enriched: 0, pending: 0 });
    }

    const stats = grouped.get(city)!;
    stats.total++;

    if (business.enrichment_status === 'enriched') stats.enriched++;
    if (business.enrichment_status === 'pending') stats.pending++;
  });

  // Transform to array and calculate percentages
  return Array.from(grouped.entries())
    .map(([city, stats]) => ({
      city,
      count: stats.total,
      percentage: total > 0 ? Math.round((stats.total / total) * 100) : 0,
      enriched: stats.enriched,
      pending: stats.pending
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}
```

### Prisma Query

```typescript
// dashboard/lib/queries/geographic-distribution.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function fetchGeographicData() {
  return await prisma.business.findMany({
    select: {
      city: true,
      enrichment_status: true
    }
  });
}

/**
 * Database-level aggregation for better performance.
 */
export async function fetchGeographicAggregated(limit: number = 10) {
  const result = await prisma.$queryRaw<Array<{
    city: string;
    enrichment_status: string;
    count: bigint;
  }>>`
    SELECT
      COALESCE(city, 'Unknown') as city,
      enrichment_status,
      COUNT(*)::int as count
    FROM business
    GROUP BY city, enrichment_status
    ORDER BY count DESC
    LIMIT ${limit * 3}
  `;

  return result.map(row => ({
    city: row.city,
    enrichment_status: row.enrichment_status,
    count: Number(row.count)
  }));
}
```

### Recharts Configuration

```typescript
// dashboard/components/charts/GeographicDistributionChart.tsx

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function GeographicDistributionChart({ data }: { data: GeographicDataPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 5, right: 30, left: 120, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2D" />

        <XAxis type="number" stroke="#B0B0B0" />
        <YAxis
          type="category"
          dataKey="city"
          stroke="#B0B0B0"
          width={100}
        />

        <Tooltip
          contentStyle={{
            backgroundColor: '#1A1A1D',
            border: '1px solid #145A5A',
            borderRadius: '8px',
            padding: '12px'
          }}
          formatter={(value: number, name: string, props: any) => [
            `${value} (${props.payload.percentage}%)`,
            'Businesses'
          ]}
        />

        <Bar dataKey="count" fill="#145A5A" radius={[0, 8, 8, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
```

### Mock Data Generator

```typescript
// dashboard/lib/mock-data/geographic-distribution.ts

import { GeographicDataPoint } from '@/lib/data-transformations/geographic-distribution';

export function generateMockGeographicData(): GeographicDataPoint[] {
  return [
    { city: 'Freehold', count: 178, percentage: 29, enriched: 145, pending: 33 },
    { city: 'Manalapan', count: 142, percentage: 23, enriched: 118, pending: 24 },
    { city: 'Marlboro', count: 98, percentage: 16, enriched: 82, pending: 16 },
    { city: 'Howell', count: 76, percentage: 12, enriched: 58, pending: 18 },
    { city: 'Colts Neck', count: 45, percentage: 7, enriched: 39, pending: 6 },
    { city: 'Englishtown', count: 32, percentage: 5, enriched: 24, pending: 8 },
    { city: 'Farmingdale', count: 28, percentage: 5, enriched: 21, pending: 7 },
    { city: 'Jackson', count: 12, percentage: 2, enriched: 8, pending: 4 },
    { city: 'Lakewood', count: 8, percentage: 1, enriched: 5, pending: 3 },
    { city: 'Unknown', count: 3, percentage: 0, enriched: 0, pending: 3 }
  ];
}
```

---

## 6. Activity Feed

### Purpose
Real-time timeline of recent events (businesses created, enriched, contacts added).

### Data Transformation

```typescript
// dashboard/lib/data-transformations/activity-feed.ts

export interface ActivityEvent {
  id: string;
  type: 'business_created' | 'business_enriched' | 'contact_added' | 'enrichment_failed';
  timestamp: Date;
  title: string;
  description: string;
  icon: string;
  iconColor: string;
  metadata?: {
    businessId?: number;
    businessName?: string;
    contactName?: string;
    contactEmail?: string;
  };
}

/**
 * Transform database events into activity feed format.
 */
export function transformActivityEvents(events: any[]): ActivityEvent[] {
  return events.map(event => {
    switch (event.type) {
      case 'business:created':
        return {
          id: `business-${event.data.id}-${event.timestamp}`,
          type: 'business_created',
          timestamp: new Date(event.timestamp),
          title: 'New Business Added',
          description: `${event.data.name} was added to the system`,
          icon: 'building',
          iconColor: '#145A5A',
          metadata: {
            businessId: event.data.id,
            businessName: event.data.name
          }
        };

      case 'business:enriched':
        return {
          id: `enriched-${event.data.id}-${event.timestamp}`,
          type: 'business_enriched',
          timestamp: new Date(event.timestamp),
          title: 'Business Enriched',
          description: `${event.data.name} successfully enriched with contact data`,
          icon: 'check-circle',
          iconColor: '#FF5722',
          metadata: {
            businessId: event.data.id,
            businessName: event.data.name
          }
        };

      case 'contact:added':
        return {
          id: `contact-${event.data.id}-${event.timestamp}`,
          type: 'contact_added',
          timestamp: new Date(event.timestamp),
          title: 'Contact Added',
          description: `${event.data.name || event.data.email} added to ${event.data.business_name}`,
          icon: 'user-plus',
          iconColor: '#4CAF50',
          metadata: {
            businessId: event.data.business_id,
            businessName: event.data.business_name,
            contactName: event.data.name,
            contactEmail: event.data.email
          }
        };

      case 'enrichment:failed':
        return {
          id: `failed-${event.data.id}-${event.timestamp}`,
          type: 'enrichment_failed',
          timestamp: new Date(event.timestamp),
          title: 'Enrichment Failed',
          description: `Failed to enrich ${event.data.name}`,
          icon: 'alert-circle',
          iconColor: '#E53935',
          metadata: {
            businessId: event.data.id,
            businessName: event.data.name
          }
        };

      default:
        return {
          id: `unknown-${Date.now()}`,
          type: 'business_created',
          timestamp: new Date(),
          title: 'Unknown Event',
          description: 'Unknown event type',
          icon: 'info',
          iconColor: '#9E9E9E'
        };
    }
  }).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}
```

### Prisma Query (Recent Events)

```typescript
// dashboard/lib/queries/activity-feed.ts

import { PrismaClient } from '@prisma/client';
import { subHours } from 'date-fns';

const prisma = new PrismaClient();

/**
 * Fetch recent activities from multiple tables.
 */
export async function fetchRecentActivities(hours: number = 24, limit: number = 50) {
  const since = subHours(new Date(), hours);

  const [recentBusinesses, recentContacts, recentEnrichments] = await Promise.all([
    // Recent businesses
    prisma.business.findMany({
      where: { created_at: { gte: since } },
      select: {
        id: true,
        name: true,
        created_at: true,
        enrichment_status: true
      },
      orderBy: { created_at: 'desc' },
      take: limit
    }),

    // Recent contacts
    prisma.contact.findMany({
      where: { created_at: { gte: since } },
      select: {
        id: true,
        name: true,
        email: true,
        created_at: true,
        business: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { created_at: 'desc' },
      take: limit
    }),

    // Recent enrichment logs
    prisma.enrichment_log.findMany({
      where: {
        created_at: { gte: since },
        status: { in: ['success', 'failed'] }
      },
      select: {
        id: true,
        status: true,
        service: true,
        created_at: true,
        business: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { created_at: 'desc' },
      take: limit
    })
  ]);

  // Combine and format as events
  const events = [];

  recentBusinesses.forEach(business => {
    events.push({
      type: 'business:created',
      timestamp: business.created_at.toISOString(),
      data: business
    });
  });

  recentContacts.forEach(contact => {
    events.push({
      type: 'contact:added',
      timestamp: contact.created_at.toISOString(),
      data: {
        ...contact,
        business_id: contact.business.id,
        business_name: contact.business.name
      }
    });
  });

  recentEnrichments.forEach(log => {
    events.push({
      type: log.status === 'success' ? 'business:enriched' : 'enrichment:failed',
      timestamp: log.created_at.toISOString(),
      data: {
        id: log.business.id,
        name: log.business.name,
        service: log.service
      }
    });
  });

  // Sort by timestamp descending
  return events.sort((a, b) =>
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  ).slice(0, limit);
}
```

### Component

```typescript
// dashboard/components/feeds/ActivityFeed.tsx

import { Building2, CheckCircle2, UserPlus, AlertCircle, Info } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const iconComponents = {
  building: Building2,
  'check-circle': CheckCircle2,
  'user-plus': UserPlus,
  'alert-circle': AlertCircle,
  info: Info
};

export default function ActivityFeed({ events }: { events: ActivityEvent[] }) {
  return (
    <div className="space-y-4">
      {events.map((event, index) => {
        const Icon = iconComponents[event.icon as keyof typeof iconComponents] || Info;

        return (
          <div key={event.id} className="flex gap-3">
            {/* Timeline line */}
            <div className="flex flex-col items-center">
              <div
                className="rounded-full p-2"
                style={{ backgroundColor: `${event.iconColor}20` }}
              >
                <Icon className="w-4 h-4" style={{ color: event.iconColor }} />
              </div>
              {index < events.length - 1 && (
                <div className="w-px h-full bg-[#2A2A2D] mt-2" />
              )}
            </div>

            {/* Event content */}
            <div className="flex-1 pb-4">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-medium text-white">{event.title}</h4>
                  <p className="text-sm text-gray-400 mt-1">{event.description}</p>
                </div>
                <span className="text-xs text-gray-500 whitespace-nowrap">
                  {formatDistanceToNow(event.timestamp, { addSuffix: true })}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

### Real-time Updates

```typescript
// dashboard/hooks/useActivityFeed.ts

import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { transformActivityEvents, ActivityEvent } from '@/lib/data-transformations/activity-feed';
import { fetchRecentActivities } from '@/lib/queries/activity-feed';

export function useActivityFeed(limit: number = 20) {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load initial data
    async function loadData() {
      setLoading(true);
      try {
        const activities = await fetchRecentActivities(24, limit);
        const transformed = transformActivityEvents(activities);
        setEvents(transformed);
      } catch (error) {
        console.error('Error loading activity feed:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();

    // WebSocket for real-time updates
    const socket = io(process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3000');

    // Listen for all event types
    const eventTypes = [
      'business:created',
      'business:enriched',
      'contact:added',
      'enrichment:failed'
    ];

    eventTypes.forEach(eventType => {
      socket.on(eventType, (payload) => {
        const newEvents = transformActivityEvents([payload]);
        setEvents(prev => [newEvents[0], ...prev].slice(0, limit));
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [limit]);

  return { events, loading };
}
```

### Mock Data Generator

```typescript
// dashboard/lib/mock-data/activity-feed.ts

import { subMinutes } from 'date-fns';
import { ActivityEvent } from '@/lib/data-transformations/activity-feed';

export function generateMockActivityEvents(): ActivityEvent[] {
  const now = new Date();

  return [
    {
      id: '1',
      type: 'business_created',
      timestamp: subMinutes(now, 5),
      title: 'New Business Added',
      description: 'Acme Plumbing Solutions was added to the system',
      icon: 'building',
      iconColor: '#145A5A',
      metadata: { businessId: 123, businessName: 'Acme Plumbing Solutions' }
    },
    {
      id: '2',
      type: 'business_enriched',
      timestamp: subMinutes(now, 12),
      title: 'Business Enriched',
      description: 'Superior HVAC Services successfully enriched with contact data',
      icon: 'check-circle',
      iconColor: '#FF5722',
      metadata: { businessId: 122, businessName: 'Superior HVAC Services' }
    },
    {
      id: '3',
      type: 'contact_added',
      timestamp: subMinutes(now, 18),
      title: 'Contact Added',
      description: 'john.doe@acmeplumbing.com added to Acme Plumbing Solutions',
      icon: 'user-plus',
      iconColor: '#4CAF50',
      metadata: {
        businessId: 123,
        businessName: 'Acme Plumbing Solutions',
        contactEmail: 'john.doe@acmeplumbing.com'
      }
    },
    {
      id: '4',
      type: 'enrichment_failed',
      timestamp: subMinutes(now, 25),
      title: 'Enrichment Failed',
      description: 'Failed to enrich Quick Fix Auto Repair',
      icon: 'alert-circle',
      iconColor: '#E53935',
      metadata: { businessId: 121, businessName: 'Quick Fix Auto Repair' }
    },
    {
      id: '5',
      type: 'business_created',
      timestamp: subMinutes(now, 45),
      title: 'New Business Added',
      description: 'Elite Legal Partners was added to the system',
      icon: 'building',
      iconColor: '#145A5A',
      metadata: { businessId: 120, businessName: 'Elite Legal Partners' }
    }
  ];
}
```

---

## 7. WebSocket Event Mapping

### Event → Chart Update Matrix

| WebSocket Event | Affected Charts | Update Strategy |
|----------------|-----------------|-----------------|
| `business:created` | Business Growth, Lead Sources, Geographic, Activity Feed | Incremental update: Add new data point |
| `business:enriched` | Enrichment Status, Lead Sources, Top Businesses, Activity Feed | Refetch affected data (status changed) |
| `business:deleted` | All charts | Full refetch |
| `contact:added` | Top Businesses, Activity Feed | Refetch top businesses list |
| `stats:updated` | Summary cards | Update metrics only |
| `enrichment:failed` | Enrichment Status, Activity Feed | Update status distribution |

### Centralized Event Handler

```typescript
// dashboard/lib/websocket/event-handler.ts

import { io, Socket } from 'socket.io-client';

export type ChartRefreshCallback = () => void | Promise<void>;

export class WebSocketEventHandler {
  private socket: Socket;
  private callbacks: Map<string, Set<ChartRefreshCallback>> = new Map();

  constructor(url: string = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3000') {
    this.socket = io(url);
    this.setupListeners();
  }

  /**
   * Register a callback for a specific event type.
   */
  on(eventType: string, callback: ChartRefreshCallback) {
    if (!this.callbacks.has(eventType)) {
      this.callbacks.set(eventType, new Set());
    }
    this.callbacks.get(eventType)!.add(callback);
  }

  /**
   * Unregister a callback.
   */
  off(eventType: string, callback: ChartRefreshCallback) {
    this.callbacks.get(eventType)?.delete(callback);
  }

  /**
   * Setup WebSocket listeners.
   */
  private setupListeners() {
    const events = [
      'business:created',
      'business:enriched',
      'business:deleted',
      'contact:added',
      'stats:updated',
      'enrichment:failed'
    ];

    events.forEach(eventType => {
      this.socket.on(eventType, async (payload) => {
        console.log(`[WebSocket] Received: ${eventType}`, payload);

        // Execute all registered callbacks for this event
        const callbacks = this.callbacks.get(eventType);
        if (callbacks) {
          for (const callback of callbacks) {
            try {
              await callback();
            } catch (error) {
              console.error(`Error executing callback for ${eventType}:`, error);
            }
          }
        }
      });
    });
  }

  /**
   * Disconnect socket.
   */
  disconnect() {
    this.socket.disconnect();
  }
}
```

---

## 8. Performance Optimization Strategies

### 1. Database Query Optimization

**Use Aggregation at Database Level:**
```typescript
// Instead of fetching all businesses and grouping in application
const businessesByCity = await prisma.business.groupBy({
  by: ['city'],
  _count: {
    id: true
  },
  orderBy: {
    _count: {
      id: 'desc'
    }
  },
  take: 10
});
```

**Use Database Indexes:**
```prisma
// Already in schema.prisma
@@index([city])
@@index([industry])
@@index([enrichment_status])
@@index([created_at])  // Add if missing
```

### 2. Caching Strategy

```typescript
// dashboard/lib/cache/query-cache.ts

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class QueryCache {
  private cache: Map<string, CacheEntry<any>> = new Map();

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  set<T>(key: string, data: T, ttl: number = 30000) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  invalidate(pattern: string) {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }
}

export const queryCache = new QueryCache();

// Usage
export async function fetchBusinessGrowthDataCached(days: number) {
  const cacheKey = `business-growth-${days}`;

  let data = queryCache.get(cacheKey);
  if (data) {
    console.log('Cache hit:', cacheKey);
    return data;
  }

  console.log('Cache miss:', cacheKey);
  data = await fetchBusinessGrowthData(days);
  queryCache.set(cacheKey, data, 30000); // 30 second TTL

  return data;
}
```

### 3. Incremental Updates (Avoid Full Refetch)

```typescript
// Instead of refetching all data on business:created
socket.on('business:created', (payload) => {
  setData(prev => {
    const newPoint = {
      date: format(new Date(payload.data.created_at), 'MMM dd'),
      count: 1,
      cumulative: prev[prev.length - 1].cumulative + 1,
      trend: 0,
      timestamp: new Date(payload.data.created_at)
    };

    // Find matching date and increment, or add new point
    const existingIndex = prev.findIndex(p => p.date === newPoint.date);
    if (existingIndex >= 0) {
      const updated = [...prev];
      updated[existingIndex].count++;
      updated[existingIndex].cumulative++;
      return updated;
    }

    return [...prev, newPoint];
  });
});
```

### 4. Debounce Rapid Updates

```typescript
// dashboard/hooks/useDebouncedRefresh.ts

import { useRef, useCallback } from 'react';

export function useDebouncedRefresh(callback: () => void, delay: number = 1000) {
  const timeoutRef = useRef<NodeJS.Timeout>();

  return useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      callback();
    }, delay);
  }, [callback, delay]);
}

// Usage
const debouncedRefresh = useDebouncedRefresh(() => {
  loadData();
}, 1000);

socket.on('business:created', debouncedRefresh);
```

### 5. Virtual Scrolling for Large Lists

```typescript
// For top businesses list with 100+ items
import { useVirtualizer } from '@tanstack/react-virtual';

export default function VirtualizedTopBusinesses({ data }: { data: TopBusinessDataPoint[] }) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60, // Estimated row height
    overscan: 5
  });

  return (
    <div ref={parentRef} className="h-[400px] overflow-auto">
      <div style={{ height: `${virtualizer.getTotalSize()}px`, position: 'relative' }}>
        {virtualizer.getVirtualItems().map(virtualRow => (
          <div
            key={virtualRow.index}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualRow.size}px`,
              transform: `translateY(${virtualRow.start}px)`
            }}
          >
            {/* Render business item */}
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 9. Summary: Implementation Checklist

### Phase 1: Data Layer
- [ ] Create all transformation functions in `/dashboard/lib/data-transformations/`
- [ ] Implement Prisma queries in `/dashboard/lib/queries/`
- [ ] Add database indexes if missing (created_at)
- [ ] Test queries with mock data

### Phase 2: Visualization Components
- [ ] Build Recharts components in `/dashboard/components/charts/`
- [ ] Create list components in `/dashboard/components/lists/`
- [ ] Create activity feed in `/dashboard/components/feeds/`
- [ ] Test with mock data generators

### Phase 3: Real-time Integration
- [ ] Implement WebSocket hooks in `/dashboard/hooks/`
- [ ] Create centralized event handler
- [ ] Test incremental updates
- [ ] Implement debouncing for rapid events

### Phase 4: Performance Optimization
- [ ] Add query caching with TTL
- [ ] Implement incremental update logic
- [ ] Add virtual scrolling for large lists
- [ ] Monitor and optimize slow queries

### Phase 5: Polish
- [ ] Add loading states and skeletons
- [ ] Implement error boundaries
- [ ] Add empty states for charts with no data
- [ ] Test with production-scale data (1000+ businesses)

---

## File Structure

```
dashboard/
├── lib/
│   ├── data-transformations/
│   │   ├── business-growth.ts
│   │   ├── lead-sources.ts
│   │   ├── enrichment-status.ts
│   │   ├── top-businesses.ts
│   │   ├── geographic-distribution.ts
│   │   └── activity-feed.ts
│   ├── queries/
│   │   ├── business-growth.ts
│   │   ├── lead-sources.ts
│   │   ├── enrichment-status.ts
│   │   ├── top-businesses.ts
│   │   ├── geographic-distribution.ts
│   │   └── activity-feed.ts
│   ├── mock-data/
│   │   ├── business-growth.ts
│   │   ├── lead-sources.ts
│   │   ├── enrichment-status.ts
│   │   ├── top-businesses.ts
│   │   ├── geographic-distribution.ts
│   │   └── activity-feed.ts
│   ├── websocket/
│   │   └── event-handler.ts
│   └── cache/
│       └── query-cache.ts
├── components/
│   ├── charts/
│   │   ├── BusinessGrowthChart.tsx
│   │   ├── LeadSourcesChart.tsx
│   │   ├── EnrichmentStatusChart.tsx
│   │   ├── EnrichmentStatusDonut.tsx
│   │   └── GeographicDistributionChart.tsx
│   ├── lists/
│   │   └── TopBusinessesList.tsx
│   └── feeds/
│       └── ActivityFeed.tsx
└── hooks/
    ├── useBusinessGrowth.ts
    ├── useLeadSources.ts
    ├── useEnrichmentStatus.ts
    ├── useTopBusinesses.ts
    ├── useGeographicDistribution.ts
    ├── useActivityFeed.ts
    └── useDebouncedRefresh.ts
```

---

This strategy provides production-ready code for all dashboard visualizations with:
- Optimized database queries
- Real-time WebSocket updates
- Performance optimization techniques
- Comprehensive mock data for development
- Type-safe TypeScript implementations
- Recharts configuration with brand colors
- Statistical insights and metrics calculations
