'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  History,
  FileText,
  Clock,
  Send,
  XCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { OutreachMessage } from '@/types/api';

interface MessageHistoryProps {
  messages: OutreachMessage[];
  onSelectMessage: (message: OutreachMessage) => void;
  selectedMessageId?: number;
  isLoading?: boolean;
  className?: string;
}

const statusConfig = {
  generated: {
    icon: Clock,
    label: 'Generated',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/20',
  },
  sent: {
    icon: Send,
    label: 'Sent',
    color: 'text-green-400',
    bgColor: 'bg-green-500/20',
  },
  failed: {
    icon: XCircle,
    label: 'Failed',
    color: 'text-red-400',
    bgColor: 'bg-red-500/20',
  },
};

export function MessageHistory({
  messages,
  onSelectMessage,
  selectedMessageId,
  isLoading,
  className,
}: MessageHistoryProps) {
  // Sort messages by date (most recent first)
  const sortedMessages = [...messages].sort(
    (a, b) => new Date(b.generated_at).getTime() - new Date(a.generated_at).getTime()
  );

  if (isLoading) {
    return (
      <Card className={cn('bg-card/50 backdrop-blur-sm border-border/50', className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-muted-foreground" />
            Message History
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-background/30">
              <Skeleton data-testid="skeleton" className="h-10 w-10 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton data-testid="skeleton" className="h-4 w-32" />
                <Skeleton data-testid="skeleton" className="h-3 w-24" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('bg-card/50 backdrop-blur-sm border-border/50', className)}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            <span>Message History</span>
          </div>
          <Badge variant="outline" className="text-primary border-primary/50">
            {messages.length} messages
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">No messages generated</p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              Generate a message to see history
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
            <AnimatePresence>
              {sortedMessages.map((message, index) => {
                const status = statusConfig[message.status];
                const StatusIcon = status.icon;
                const isSelected = selectedMessageId === message.id;

                return (
                  <motion.button
                    key={message.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                    onClick={() => onSelectMessage(message)}
                    className={cn(
                      'w-full p-3 rounded-lg text-left transition-colors',
                      isSelected
                        ? 'bg-primary/20 border border-primary/50'
                        : 'bg-background/30 hover:bg-background/50 border border-transparent'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn('p-2 rounded-lg', status.bgColor)}>
                        <StatusIcon className={cn('h-4 w-4', status.color)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm text-foreground">
                            Message #{message.id}
                          </span>
                          <Badge
                            variant="outline"
                            className={cn('text-xs', status.color)}
                          >
                            {status.label}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {new Date(message.generated_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default MessageHistory;
