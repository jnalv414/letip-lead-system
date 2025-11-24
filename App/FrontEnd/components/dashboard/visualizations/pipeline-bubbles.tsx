/**
 * Pipeline Bubbles
 *
 * Circular indicators showing pipeline stages with glow effects.
 * Inspired by the reference design but using charcoal/teal/orange palette.
 */

'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';

interface PipelineStage {
  stage: string;
  count: number;
  percentage: number;
  color: string;
  size: 'large' | 'medium' | 'small';
}

export function PipelineBubbles() {
  const { data: stages, isLoading } = useQuery({
    queryKey: ['pipeline-stages'],
    queryFn: async () => {
      // TODO: Replace with actual API endpoint
      // return apiClient.get('/api/analytics/pipeline');

      await new Promise((resolve) => setTimeout(resolve, 500));

      const mockStages: PipelineStage[] = [
        { stage: 'Qualified', count: 234, percentage: 46, color: '#FF5722', size: 'large' },
        { stage: 'Contacted', count: 156, percentage: 32, color: '#145A5A', size: 'medium' },
        { stage: 'Engaged', count: 89, percentage: 18, color: '#1A7070', size: 'small' },
      ];

      return mockStages;
    },
  });

  const totalLeads = stages?.reduce((sum, stage) => sum + stage.count, 0) || 0;

  return (
    <Card variant="charcoal" hover animated>
      <CardHeader>
        <CardTitle className="text-lg font-medium">Pipeline Stages</CardTitle>
      </CardHeader>

      <CardContent className="relative min-h-[300px] flex items-center justify-center">
        {isLoading ? (
          <div className="flex items-center justify-center gap-4">
            <div className="w-32 h-32 rounded-full bg-charcoal-light animate-pulse" />
            <div className="w-24 h-24 rounded-full bg-charcoal-light animate-pulse" />
          </div>
        ) : (
          <>
            {/* Background decorative circle */}
            <div className="absolute inset-0 flex items-center justify-center opacity-5">
              <svg className="w-64 h-64 text-teal-lighter" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" />
              </svg>
            </div>

            {/* Bubbles container */}
            <div className="relative w-full h-full flex items-center justify-center">
              {stages?.map((stage, index) => {
                // Position bubbles
                const positions = [
                  { top: '20%', left: '50%', translate: '-50%' }, // Large - top center
                  { bottom: '15%', right: '15%', translate: '0' }, // Medium - bottom right
                  { bottom: '25%', left: '10%', translate: '0' },  // Small - bottom left
                ];

                const sizes = {
                  large: 'w-40 h-40',
                  medium: 'w-28 h-28',
                  small: 'w-20 h-20',
                };

                return (
                  <motion.div
                    key={stage.stage}
                    className={`absolute ${sizes[stage.size]} rounded-full flex items-center justify-center cursor-pointer`}
                    style={{
                      ...positions[index],
                      backgroundColor: stage.color,
                      boxShadow: `0 0 40px ${stage.color}40`,
                    }}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{
                      delay: index * 0.2,
                      type: 'spring',
                      stiffness: 100,
                    }}
                    whileHover={{
                      scale: 1.1,
                      boxShadow: `0 0 60px ${stage.color}60`,
                    }}
                  >
                    {/* Inner glow */}
                    <div
                      className="absolute inset-0 rounded-full animate-pulse"
                      style={{
                        background: `radial-gradient(circle, ${stage.color}80 0%, transparent 70%)`,
                      }}
                    />

                    {/* Content */}
                    <div className="relative text-center z-10">
                      <motion.span
                        className={`block font-bold ${
                          stage.size === 'large'
                            ? 'text-4xl'
                            : stage.size === 'medium'
                            ? 'text-2xl'
                            : 'text-xl'
                        }`}
                        style={{ color: stage.color === '#FF5722' ? '#FFFFFF' : '#FFFFFF' }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.2 + 0.3 }}
                      >
                        {stage.percentage}%
                      </motion.span>
                      <motion.span
                        className={`block uppercase font-bold opacity-90 ${
                          stage.size === 'large'
                            ? 'text-xs mt-1'
                            : stage.size === 'medium'
                            ? 'text-[10px] mt-0.5'
                            : 'text-[8px]'
                        }`}
                        style={{ color: stage.color === '#FF5722' ? '#FFFFFF' : '#FFFFFF' }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.2 + 0.4 }}
                      >
                        {stage.stage}
                      </motion.span>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Legend at bottom */}
            <motion.div
              className="absolute bottom-0 left-0 right-0 flex justify-center gap-6 pb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              {stages?.map((stage) => (
                <div key={stage.stage} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{
                      backgroundColor: stage.color,
                      boxShadow: `0 0 8px ${stage.color}40`,
                    }}
                  />
                  <span className="text-xs text-gray-400">
                    {stage.stage}: {stage.count}
                  </span>
                </div>
              ))}
            </motion.div>

            {/* Total count */}
            <motion.div
              className="absolute top-4 right-4 bg-charcoal-light rounded-full px-4 py-2 border border-teal-light/20"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
            >
              <span className="text-xs text-gray-400">Total:</span>
              <span className="ml-2 text-sm font-bold text-white">{totalLeads}</span>
            </motion.div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
