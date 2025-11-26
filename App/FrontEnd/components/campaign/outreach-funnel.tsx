'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles,
  Send,
  Eye,
  MessageCircle,
  TrendingDown,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface OutreachFunnelProps {
  data: {
    generated: number;
    sent: number;
    opened: number;
    responded: number;
  };
  isLoading?: boolean;
  className?: string;
}

const funnelStages = [
  {
    key: 'generated',
    label: 'Generated',
    icon: Sparkles,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500',
  },
  {
    key: 'sent',
    label: 'Sent',
    icon: Send,
    color: 'text-green-400',
    bgColor: 'bg-green-500',
  },
  {
    key: 'opened',
    label: 'Opened',
    icon: Eye,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500',
  },
  {
    key: 'responded',
    label: 'Responded',
    icon: MessageCircle,
    color: 'text-primary',
    bgColor: 'bg-primary',
  },
];

export function OutreachFunnel({
  data,
  isLoading,
  className,
}: OutreachFunnelProps) {
  // Calculate conversion rates
  const getConversionRate = (current: number, previous: number): string => {
    if (previous === 0) return '0%';
    return `${((current / previous) * 100).toFixed(1)}%`;
  };

  if (isLoading) {
    return (
      <Card className={cn('glass-card', className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-muted-foreground" />
            Outreach Funnel
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton data-testid="skeleton" className="h-8 w-8 rounded" />
              <Skeleton data-testid="skeleton" className="h-6 flex-1 rounded" />
              <Skeleton data-testid="skeleton" className="h-4 w-16" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  const maxValue = Math.max(data.generated, 1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={cn('glass-card', className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-primary" />
            <span>Outreach Funnel</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-2 space-y-4">
          {funnelStages.map((stage, index) => {
            const Icon = stage.icon;
            const value = data[stage.key as keyof typeof data];
            const prevValue = index === 0 ? value : data[funnelStages[index - 1].key as keyof typeof data];
            const widthPercent = (value / maxValue) * 100;

            return (
              <motion.div
                key={stage.key}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="space-y-2"
              >
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2.5">
                    <Icon className={cn('h-4 w-4', stage.color)} />
                    <span className="text-foreground font-medium">{stage.label}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-foreground">{value}</span>
                    {index > 0 && (
                      <span className="text-xs text-muted-foreground">
                        ({getConversionRate(value, prevValue)})
                      </span>
                    )}
                  </div>
                </div>
                <div className="h-9 bg-background/30 rounded-lg overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${widthPercent}%` }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className={cn('h-full rounded-lg', stage.bgColor, 'opacity-80')}
                  />
                </div>
              </motion.div>
            );
          })}

          {/* Summary */}
          <div className="pt-5 mt-5 border-t border-border/50">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Overall Conversion</span>
              <span className="text-lg font-semibold text-primary">
                {getConversionRate(data.responded, data.generated)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default OutreachFunnel;
