'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  Copy,
  Check,
  Clock,
  Send,
  XCircle,
  Mail,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { OutreachMessage } from '@/types/api';

interface MessagePreviewProps {
  message: OutreachMessage | null;
  isLoading?: boolean;
  className?: string;
}

const statusConfig = {
  generated: {
    icon: Clock,
    label: 'Generated',
    color: 'text-amber-400',
    borderColor: 'border-amber-500/50',
  },
  sent: {
    icon: Send,
    label: 'Sent',
    color: 'text-green-400',
    borderColor: 'border-green-500/50',
  },
  failed: {
    icon: XCircle,
    label: 'Failed',
    color: 'text-red-400',
    borderColor: 'border-red-500/50',
  },
};

export function MessagePreview({
  message,
  isLoading,
  className,
}: MessagePreviewProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (message?.message_text) {
      await navigator.clipboard.writeText(message.message_text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <Card className={cn('glass-card rounded-2xl', className)}>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-muted-foreground" />
            Message Preview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          <Skeleton data-testid="skeleton" className="h-4 w-full" />
          <Skeleton data-testid="skeleton" className="h-4 w-3/4" />
          <Skeleton data-testid="skeleton" className="h-4 w-5/6" />
          <Skeleton data-testid="skeleton" className="h-4 w-2/3" />
        </CardContent>
      </Card>
    );
  }

  if (!message) {
    return (
      <Card className={cn('glass-card rounded-2xl', className)}>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-muted-foreground" />
            Message Preview
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-center py-10">
            <div className="p-4 rounded-2xl bg-muted/10 w-fit mx-auto mb-4">
              <Mail className="h-10 w-10 text-muted-foreground/50" />
            </div>
            <p className="text-foreground font-medium mb-1">No message generated yet</p>
            <p className="text-sm text-muted-foreground">
              Select a business and generate a message
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const status = statusConfig[message.status];
  const StatusIcon = status.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={cn('glass-card rounded-2xl', className)}>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <span>Message Preview</span>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className={cn(status.color, status.borderColor)}>
                <StatusIcon className="h-3 w-3 mr-1.5" />
                {status.label}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="gap-2"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-green-400" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5 pt-0">
          {/* Message Content */}
          <div className="p-5 rounded-xl bg-background/30 border border-border/30 max-h-[400px] overflow-y-auto">
            <pre className="whitespace-pre-wrap font-sans text-sm text-foreground leading-relaxed">
              {message.message_text}
            </pre>
          </div>

          {/* Timestamp */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
            <Clock className="h-3.5 w-3.5" />
            <span>
              Generated on{' '}
              {new Date(message.generated_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
              })}
            </span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default MessagePreview;
