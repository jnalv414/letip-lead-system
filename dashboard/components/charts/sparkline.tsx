/**
 * Sparkline Component
 *
 * Tiny inline trend charts for stat cards.
 * Minimalist design with 60/30/10 color rule: Orange line (10% accent)
 *
 * Usage:
 * <Sparkline data={[10, 20, 15, 30, 25]} />
 * <Sparkline data={data} dataKey="value" color="teal" />
 */

'use client';

import * as React from 'react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { chartConfig } from '@/lib/chart-config';
import { cn } from '@/lib/utils';

export interface SparklineProps {
  data: Array<Record<string, any>> | number[];
  dataKey?: string;
  color?: 'orange' | 'teal' | 'success' | 'error';
  height?: number;
  className?: string;
}

export function Sparkline({
  data,
  dataKey = 'value',
  color = 'orange',
  height = 40,
  className,
}: SparklineProps) {
  // Convert number array to object array
  const chartData = Array.isArray(data[0])
    ? data
    : typeof data[0] === 'number'
    ? data.map((value, index) => ({ index, value }))
    : data;

  const colorMap = {
    orange: chartConfig.colors.primary,
    teal: chartConfig.colors.secondary,
    success: chartConfig.colors.success,
    error: chartConfig.colors.error,
  };

  const strokeColor = colorMap[color];

  return (
    <div className={cn('w-full', className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
          <Line
            type="monotone"
            dataKey={dataKey}
            stroke={strokeColor}
            strokeWidth={chartConfig.chart.sparkline.strokeWidth}
            dot={false}
            animationDuration={chartConfig.animation.duration}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * Sparkline with Trend Indicator
 */
export interface SparklineWithTrendProps extends SparklineProps {
  showTrend?: boolean;
}

export function SparklineWithTrend({
  data,
  dataKey = 'value',
  color = 'orange',
  height = 60,
  showTrend = true,
  className,
}: SparklineWithTrendProps) {
  // Convert number array to object array
  const chartData = Array.isArray(data[0])
    ? data
    : typeof data[0] === 'number'
    ? data.map((value, index) => ({ index, value }))
    : data;

  // Calculate trend
  const values = chartData.map((item) =>
    typeof item === 'number' ? item : (item as Record<string, any>)[dataKey]
  ) as number[];
  const firstValue = values[0];
  const lastValue = values[values.length - 1];
  const change = lastValue - firstValue;
  const percentChange = ((change / firstValue) * 100).toFixed(1);
  const isPositive = change >= 0;

  const colorMap = {
    orange: chartConfig.colors.primary,
    teal: chartConfig.colors.secondary,
    success: chartConfig.colors.success,
    error: chartConfig.colors.error,
  };

  const strokeColor = colorMap[color];

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className="flex-1" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke={strokeColor}
              strokeWidth={chartConfig.chart.sparkline.strokeWidth}
              dot={false}
              animationDuration={chartConfig.animation.duration}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {showTrend && (
        <div
          className={cn(
            'flex items-center gap-1 text-xs font-semibold',
            isPositive ? 'text-green-400' : 'text-red-400'
          )}
        >
          <svg
            className="w-3 h-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {isPositive ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"
              />
            )}
          </svg>
          <span>{isPositive ? '+' : ''}{percentChange}%</span>
        </div>
      )}
    </div>
  );
}
