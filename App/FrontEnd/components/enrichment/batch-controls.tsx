'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface BatchControlsProps {
  onStartBatch: (count: number) => void;
  isPending: boolean;
  pendingCount: number;
  className?: string;
}

const batchSizes = [5, 10, 20, 50];

export function BatchControls({
  onStartBatch,
  isPending,
  pendingCount,
  className,
}: BatchControlsProps) {
  const [selectedSize, setSelectedSize] = useState(10);

  const handleStartBatch = () => {
    onStartBatch(selectedSize);
  };

  const isDisabled = isPending || pendingCount === 0;

  return (
    <Card className={cn('bg-card/50 backdrop-blur-sm border-border/50', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          Batch Enrichment
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Batch Size Selector */}
        <div className="space-y-2">
          <Label htmlFor="batch-size">Batch Size</Label>
          <select
            id="batch-size"
            value={selectedSize}
            onChange={(e) => setSelectedSize(Number(e.target.value))}
            disabled={isPending}
            className="w-full h-10 px-3 rounded-md bg-background/50 border border-border/50 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            aria-label="Batch Size"
          >
            {batchSizes.map((size) => (
              <option key={size} value={size}>
                {size} businesses
              </option>
            ))}
          </select>
        </div>

        {/* Start Button */}
        <Button
          onClick={handleStartBatch}
          disabled={isDisabled}
          className="w-full gap-2"
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Zap className="h-4 w-4" />
              Start Batch Enrichment
            </>
          )}
        </Button>

        {/* Rate Limit Warning */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20"
        >
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-amber-400">API Rate Limits</p>
              <p className="text-muted-foreground mt-1">
                Hunter.io: 500/month | AbstractAPI: 3,000/month
              </p>
            </div>
          </div>
        </motion.div>

        {/* Status Info */}
        {pendingCount === 0 && (
          <p className="text-sm text-center text-muted-foreground">
            No pending businesses to enrich
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default BatchControls;
