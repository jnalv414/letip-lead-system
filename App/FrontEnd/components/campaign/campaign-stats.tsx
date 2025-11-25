'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Mail,
  Send,
  Clock,
  XCircle,
  TrendingUp,
  BarChart3,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface CampaignStatsProps {
  stats: {
    totalMessages: number;
    sentMessages: number;
    pendingMessages: number;
    failedMessages: number;
    responseRate: number;
  };
  isLoading?: boolean;
  className?: string;
}

const statCards = [
  {
    key: 'totalMessages',
    label: 'Total Messages',
    icon: Mail,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20',
  },
  {
    key: 'sentMessages',
    label: 'Sent',
    icon: Send,
    color: 'text-green-400',
    bgColor: 'bg-green-500/20',
  },
  {
    key: 'pendingMessages',
    label: 'Pending',
    icon: Clock,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/20',
  },
  {
    key: 'failedMessages',
    label: 'Failed',
    icon: XCircle,
    color: 'text-red-400',
    bgColor: 'bg-red-500/20',
  },
];

export function CampaignStats({
  stats,
  isLoading,
  className,
}: CampaignStatsProps) {
  if (isLoading) {
    return (
      <Card className={cn('bg-card/50 backdrop-blur-sm border-border/50', className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-muted-foreground" />
            Campaign Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="p-4 rounded-lg bg-background/30">
                <Skeleton data-testid="skeleton" className="h-8 w-16 mb-2" />
                <Skeleton data-testid="skeleton" className="h-4 w-20" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={cn('bg-card/50 backdrop-blur-sm border-border/50', className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            <span>Campaign Overview</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {statCards.map((card, index) => {
              const Icon = card.icon;
              const value = stats[card.key as keyof typeof stats];

              return (
                <motion.div
                  key={card.key}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                  className="p-4 rounded-lg bg-background/30"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className={cn('p-1.5 rounded-md', card.bgColor)}>
                      <Icon className={cn('h-4 w-4', card.color)} />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{value}</p>
                  <p className="text-xs text-muted-foreground">{card.label}</p>
                </motion.div>
              );
            })}
          </div>

          {/* Response Rate */}
          <div className="p-4 rounded-lg bg-background/30">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-primary/20">
                  <TrendingUp className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm text-muted-foreground">Response Rate</span>
              </div>
              <span className="text-xl font-bold text-primary">{stats.responseRate}%</span>
            </div>
            <div className="h-2 bg-background/50 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(stats.responseRate, 100)}%` }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="h-full bg-primary rounded-full"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default CampaignStats;
