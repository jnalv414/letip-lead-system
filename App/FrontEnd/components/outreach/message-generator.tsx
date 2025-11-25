'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles,
  Building2,
  MapPin,
  Loader2,
  RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import type { Business } from '@/types/api';

interface MessageGeneratorProps {
  business: Business;
  onGenerate: (businessId: number, regenerate: boolean) => void;
  isGenerating: boolean;
  className?: string;
}

export function MessageGenerator({
  business,
  onGenerate,
  isGenerating,
  className,
}: MessageGeneratorProps) {
  const [regenerate, setRegenerate] = useState(false);

  const handleGenerate = () => {
    onGenerate(business.id, regenerate);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={cn('bg-card/50 backdrop-blur-sm border-border/50', className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <span>Message Generator</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Business Info */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-background/30">
            <div className="p-2 rounded-lg bg-primary/20">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-foreground">{business.name}</p>
              {business.city && (
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {business.city}
                  {business.state && `, ${business.state}`}
                </p>
              )}
            </div>
          </div>

          {/* Regenerate Option */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="regenerate"
              checked={regenerate}
              onCheckedChange={(checked) => setRegenerate(checked === true)}
            />
            <label
              htmlFor="regenerate"
              className="text-sm text-muted-foreground cursor-pointer"
            >
              Regenerate (create new message even if one exists)
            </label>
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full gap-2"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : regenerate ? (
              <>
                <RotateCcw className="h-4 w-4" />
                Regenerate Message
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Generate Message
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default MessageGenerator;
