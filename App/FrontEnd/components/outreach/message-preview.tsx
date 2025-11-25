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
      <Card className={cn('bg-card/50 backdrop-blur-sm border-border/50', className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-muted-foreground" />
            Message Preview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
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
      <Card className={cn('bg-card/50 backdrop-blur-sm border-border/50', className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-muted-foreground" />
            Message Preview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Mail className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">No message generated yet</p>
            <p className="text-sm text-muted-foreground/70 mt-1">
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
      <Card className={cn('bg-card/50 backdrop-blur-sm border-border/50', className)}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <span>Message Preview</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={cn(status.color, status.borderColor)}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {status.label}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="gap-1"
              >
                {copied ? (
                  <>
                    <Check className="h-3 w-3 text-green-400" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Message Content */}
          <div className="p-4 rounded-lg bg-background/30 border border-border/30 max-h-[400px] overflow-y-auto">
            <pre className="whitespace-pre-wrap font-sans text-sm text-foreground leading-relaxed">
              {message.message_text}
            </pre>
          </div>

          {/* Timestamp */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
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
