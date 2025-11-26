'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { History, CheckCircle2, XCircle, Database, Globe } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { EnrichmentLog } from '@/types/api';

interface EnrichmentHistoryProps {
  logs: EnrichmentLog[];
  isLoading?: boolean;
  className?: string;
}

const serviceConfig = {
  hunter: {
    icon: Globe,
    label: 'Hunter.io',
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/20',
  },
  abstract: {
    icon: Database,
    label: 'AbstractAPI',
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/20',
  },
};

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function EnrichmentHistory({ logs, isLoading, className }: EnrichmentHistoryProps) {
  if (isLoading) {
    return (
      <Card className={cn('glass-card rounded-2xl', className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-muted-foreground" />
            Enrichment History
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-background/30">
              <Skeleton data-testid="skeleton" className="h-8 w-8 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton data-testid="skeleton" className="h-4 w-24" />
                <Skeleton data-testid="skeleton" className="h-3 w-32" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('glass-card rounded-2xl', className)}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-muted-foreground" />
            <span>Enrichment History</span>
          </div>
          <Badge variant="outline" className="text-muted-foreground">
            {logs.length} logs
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <div className="text-center py-8">
            <History className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">No enrichment history yet</p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              Enrichment logs will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
            <AnimatePresence>
              {logs.map((log, index) => {
                const service = serviceConfig[log.service as keyof typeof serviceConfig] || {
                  icon: Database,
                  label: log.service,
                  color: 'text-muted-foreground',
                  bgColor: 'bg-muted/20',
                };
                const ServiceIcon = service.icon;
                const isSuccess = log.status === 'success';

                return (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                    className="flex items-start gap-3 p-3 rounded-lg bg-background/30"
                  >
                    <div className={cn('p-2 rounded-lg', service.bgColor)}>
                      <ServiceIcon className={cn('h-4 w-4', service.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">{service.label}</span>
                        {isSuccess ? (
                          <Badge variant="outline" className="text-green-400 border-green-400/50">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Success
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-red-400 border-red-400/50">
                            <XCircle className="h-3 w-3 mr-1" />
                            Failed
                          </Badge>
                        )}
                      </div>
                      {log.error_message && (
                        <p className="text-sm text-red-400/80 mt-1 truncate">
                          {log.error_message}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDate(log.created_at)}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default EnrichmentHistory;
