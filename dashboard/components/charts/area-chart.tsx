/**
 * Area Chart Component
 *
 * Gradient-filled area chart for time series data (business growth, revenue trends).
 * Uses 60/30/10 color rule: Teal primary series (30%), Orange accent (10%), Charcoal background (60%)
 *
 * Usage:
 * <AreaChart data={data} dataKey="value" />
 * <AreaChart data={data} dataKey="value" gradient="orange" />
 */

'use client';

import * as React from 'react';
import {
  AreaChart as RechartsAreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { chartConfig, createGradientDefs } from '@/lib/chart-config';
import { cn } from '@/lib/utils';

export interface AreaChartProps {
  data: Array<Record<string, any>>;
  dataKey: string;
  xAxisKey?: string;
  gradient?: 'orange' | 'teal' | 'tealLight';
  height?: number;
  showGrid?: boolean;
  showXAxis?: boolean;
  showYAxis?: boolean;
  className?: string;
  ariaLabel?: string;
}

export function AreaChart({
  data,
  dataKey,
  xAxisKey = 'name',
  gradient = 'teal',
  height = 300,
  showGrid = true,
  showXAxis = true,
  showYAxis = false,
  className,
  ariaLabel,
}: AreaChartProps) {
  const strokeColor =
    gradient === 'orange'
      ? chartConfig.colors.primary
      : gradient === 'teal'
      ? chartConfig.colors.secondary
      : chartConfig.colors.tertiary;

  return (
    <div
      className={cn('w-full', className)}
      style={{ height }}
      role="img"
      aria-label={ariaLabel || `Area chart showing ${dataKey} data`}
    >
      <ResponsiveContainer width="100%" height="100%" aria-label={ariaLabel || "Area chart"}>
        <RechartsAreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          {createGradientDefs()}

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
            cursor={chartConfig.chart.tooltip.cursor}
          />

          <Area
            type="monotone"
            dataKey={dataKey}
            stroke={strokeColor}
            strokeWidth={chartConfig.chart.area.strokeWidth}
            fill={`url(#gradient-${gradient})`}
            fillOpacity={chartConfig.chart.area.fillOpacity}
            activeDot={chartConfig.chart.area.activeDot}
          />
        </RechartsAreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * Dual Area Chart - Shows two data series
 */
export interface DualAreaChartProps extends Omit<AreaChartProps, 'dataKey' | 'gradient'> {
  dataKey1: string;
  dataKey2: string;
  label1?: string;
  label2?: string;
  ariaLabel?: string;
}

export function DualAreaChart({
  data,
  dataKey1,
  dataKey2,
  label1,
  label2,
  xAxisKey = 'name',
  height = 300,
  showGrid = true,
  showXAxis = true,
  showYAxis = false,
  className,
  ariaLabel,
}: DualAreaChartProps) {
  return (
    <div
      className={cn('w-full', className)}
      style={{ height }}
      role="img"
      aria-label={ariaLabel || `Dual area chart comparing ${label1 || dataKey1} and ${label2 || dataKey2}`}
    >
      <ResponsiveContainer width="100%" height="100%" aria-label={ariaLabel || "Dual area chart"}>
        <RechartsAreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          {createGradientDefs()}

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
            cursor={chartConfig.chart.tooltip.cursor}
          />

          {/* Primary series - Teal (30% rule) */}
          <Area
            type="monotone"
            dataKey={dataKey1}
            name={label1 || dataKey1}
            stroke={chartConfig.colors.secondary}
            strokeWidth={chartConfig.chart.area.strokeWidth}
            fill="url(#gradient-teal)"
            fillOpacity={chartConfig.chart.area.fillOpacity}
          />

          {/* Secondary series - Orange (10% rule) */}
          <Area
            type="monotone"
            dataKey={dataKey2}
            name={label2 || dataKey2}
            stroke={chartConfig.colors.primary}
            strokeWidth={chartConfig.chart.area.strokeWidth}
            fill="url(#gradient-orange)"
            fillOpacity={chartConfig.chart.area.fillOpacity}
          />
        </RechartsAreaChart>
      </ResponsiveContainer>
    </div>
  );
}
