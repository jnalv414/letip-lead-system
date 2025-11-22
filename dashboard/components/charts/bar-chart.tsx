/**
 * Bar Chart Component
 *
 * Stacked/grouped bar chart for categorical comparisons (lead sources, categories).
 * Uses 60/30/10 color rule: Teal bars (30%), Orange highlights (10%), Charcoal background (60%)
 *
 * Usage:
 * <BarChart data={data} dataKey="value" />
 * <BarChart data={data} bars={[{ dataKey: 'inbound' }, { dataKey: 'outbound' }]} stacked />
 */

'use client';

import * as React from 'react';
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { chartConfig } from '@/lib/chart-config';
import { cn } from '@/lib/utils';

export interface BarChartProps {
  data: Array<Record<string, any>>;
  dataKey?: string;
  bars?: Array<{ dataKey: string; name?: string; color?: string }>;
  xAxisKey?: string;
  height?: number;
  stacked?: boolean;
  showGrid?: boolean;
  showXAxis?: boolean;
  showYAxis?: boolean;
  barColors?: string[];
  className?: string;
}

export function BarChart({
  data,
  dataKey,
  bars,
  xAxisKey = 'name',
  height = 300,
  stacked = false,
  showGrid = true,
  showXAxis = true,
  showYAxis = false,
  barColors,
  className,
}: BarChartProps) {
  // Default colors following 60/30/10 rule
  const defaultColors = [
    chartConfig.colors.secondary, // Teal (30%)
    chartConfig.colors.primary,   // Orange (10%)
    chartConfig.colors.tertiary,  // Light teal
    chartConfig.colors.success,
  ];

  const colors = barColors || defaultColors;

  // Single bar mode
  const renderSingleBar = () => (
    <Bar
      dataKey={dataKey!}
      fill={chartConfig.colors.secondary}
      radius={chartConfig.chart.bar.radius}
      maxBarSize={chartConfig.chart.bar.maxBarSize}
    >
      {data.map((entry, index) => (
        <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
      ))}
    </Bar>
  );

  // Multiple bars mode
  const renderMultipleBars = () =>
    bars?.map((bar, index) => (
      <Bar
        key={bar.dataKey}
        dataKey={bar.dataKey}
        name={bar.name || bar.dataKey}
        fill={bar.color || colors[index % colors.length]}
        stackId={stacked ? 'stack' : undefined}
        radius={stacked ? (index === bars.length - 1 ? [8, 8, 0, 0] : [0, 0, 0, 0]) : [8, 8, 0, 0]}
        maxBarSize={chartConfig.chart.bar.maxBarSize}
      />
    ));

  return (
    <div className={cn('w-full', className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          {showGrid && (
            <CartesianGrid
              stroke={chartConfig.chart.grid.stroke}
              strokeDasharray={chartConfig.chart.grid.strokeDasharray}
              vertical={false}
            />
          )}

          {showXAxis && (
            <XAxis
              dataKey={xAxisKey}
              stroke={chartConfig.chart.axis.stroke}
              tick={{ fill: chartConfig.chart.axis.tick.fill, fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
          )}

          {showYAxis && (
            <YAxis
              stroke={chartConfig.chart.axis.stroke}
              tick={{ fill: chartConfig.chart.axis.tick.fill, fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
          )}

          <Tooltip
            contentStyle={chartConfig.chart.tooltip.contentStyle}
            labelStyle={chartConfig.chart.tooltip.labelStyle}
            itemStyle={chartConfig.chart.tooltip.itemStyle}
            cursor={{ fill: 'transparent' }}
          />

          {dataKey && !bars ? renderSingleBar() : renderMultipleBars()}
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * Horizontal Bar Chart
 */
export interface HorizontalBarChartProps extends Omit<BarChartProps, 'showXAxis' | 'showYAxis'> {
  showLeftAxis?: boolean;
  showBottomAxis?: boolean;
}

export function HorizontalBarChart({
  data,
  dataKey = 'value',
  xAxisKey = 'name',
  height = 300,
  showGrid = true,
  showLeftAxis = true,
  showBottomAxis = false,
  barColors,
  className,
}: HorizontalBarChartProps) {
  const colors = barColors || [
    chartConfig.colors.secondary,
    chartConfig.colors.primary,
    chartConfig.colors.tertiary,
  ];

  return (
    <div className={cn('w-full', className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBarChart
          data={data}
          layout="horizontal"
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          {showGrid && (
            <CartesianGrid
              stroke={chartConfig.chart.grid.stroke}
              strokeDasharray={chartConfig.chart.grid.strokeDasharray}
              horizontal={false}
            />
          )}

          {showBottomAxis && (
            <XAxis
              type="number"
              stroke={chartConfig.chart.axis.stroke}
              tick={{ fill: chartConfig.chart.axis.tick.fill, fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
          )}

          {showLeftAxis && (
            <YAxis
              type="category"
              dataKey={xAxisKey}
              stroke={chartConfig.chart.axis.stroke}
              tick={{ fill: chartConfig.chart.axis.tick.fill, fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
          )}

          <Tooltip
            contentStyle={chartConfig.chart.tooltip.contentStyle}
            labelStyle={chartConfig.chart.tooltip.labelStyle}
            itemStyle={chartConfig.chart.tooltip.itemStyle}
            cursor={{ fill: 'transparent' }}
          />

          <Bar
            dataKey={dataKey}
            fill={chartConfig.colors.secondary}
            radius={[0, 8, 8, 0]}
            maxBarSize={40}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Bar>
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}
