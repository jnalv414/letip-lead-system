'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ListChecks,
  Clock,
  Send,
  XCircle,
  Building2,
  MapPin,
  Filter,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { OutreachMessage } from '@/types/api';

interface MessageStatusListProps {
  messages: OutreachMessage[];
  businessMap: Record<number, { name: string; city: string }>;
  isLoading?: boolean;
  className?: string;
}

const statusConfig = {
  generated: {
    icon: Clock,
    label: 'Generated',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/20',
    borderColor: 'border-amber-500/50',
  },
  sent: {
    icon: Send,
    label: 'Sent',
    color: 'text-green-400',
    bgColor: 'bg-green-500/20',
    borderColor: 'border-green-500/50',
  },
  failed: {
    icon: XCircle,
    label: 'Failed',
    color: 'text-red-400',
    bgColor: 'bg-red-500/20',
    borderColor: 'border-red-500/50',
  },
};

type StatusFilter = 'all' | 'generated' | 'sent' | 'failed';

export function MessageStatusList({
  messages,
  businessMap,
  isLoading,
  className,
}: MessageStatusListProps) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const filteredMessages = useMemo(() => {
    if (statusFilter === 'all') return messages;
    return messages.filter((m) => m.status === statusFilter);
  }, [messages, statusFilter]);

  // Sort by date (most recent first)
  const sortedMessages = [...filteredMessages].sort(
    (a, b) => new Date(b.generated_at).getTime() - new Date(a.generated_at).getTime()
  );

  if (isLoading) {
    return (
      <Card className={cn('glass-card', className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ListChecks className="h-5 w-5 text-muted-foreground" />
            Message Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-background/30">
              <Skeleton data-testid="skeleton" className="h-10 w-10 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton data-testid="skeleton" className="h-4 w-32" />
                <Skeleton data-testid="skeleton" className="h-3 w-24" />
              </div>
              <Skeleton data-testid="skeleton" className="h-6 w-20" />
            </div>
          ))}
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
      <Card className={cn('glass-card', className)}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ListChecks className="h-5 w-5 text-primary" />
              <span>Message Status</span>
            </div>
            <Badge variant="outline" className="text-primary border-primary/50">
              {messages.length} total
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filter Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="h-4 w-4 text-muted-foreground" />
            {(['all', 'generated', 'sent', 'failed'] as const).map((status) => (
              <Button
                key={status}
                variant={statusFilter === status ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter(status)}
                className="text-xs"
              >
                {status === 'all' ? 'All' : statusConfig[status].label}
              </Button>
            ))}
          </div>

          {/* Message List */}
          {sortedMessages.length === 0 ? (
            <div className="text-center py-8">
              <ListChecks className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">No messages found</p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                {statusFilter !== 'all' ? 'Try a different filter' : 'Generate messages to see them here'}
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
              <AnimatePresence>
                {sortedMessages.map((message, index) => {
                  const status = statusConfig[message.status];
                  const StatusIcon = status.icon;
                  const business = businessMap[message.business_id];

                  return (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      transition={{ duration: 0.2, delay: index * 0.03 }}
                      className="p-3 rounded-lg bg-background/30 hover:bg-background/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn('p-2 rounded-lg', status.bgColor)}>
                          <StatusIcon className={cn('h-4 w-4', status.color)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-sm text-foreground">
                              {business?.name || `Business #${message.business_id}`}
                            </span>
                            <Badge
                              variant="outline"
                              className={cn('text-xs', status.color, status.borderColor)}
                            >
                              {status.label}
                            </Badge>
                          </div>
                          {business?.city && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                              <MapPin className="h-3 w-3" />
                              {business.city}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(message.generated_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default MessageStatusList;
