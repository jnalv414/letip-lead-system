/**
 * Map Scraping Hooks
 */

'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { scrapingApi } from '../api/scraping-api';
import type { ScrapeRequestDto } from '@/core/types/global.types';
import type { ScrapingProgress } from '../types/scraping.types';

/**
 * Hook to start scraping and track progress
 */
export function useScraping() {
  const [progress, setProgress] = useState<ScrapingProgress>({
    jobId: null,
    status: 'idle',
    progress: 0,
    found: 0,
    saved: 0,
    message: '',
  });

  // Start scraping mutation
  const startScrapeMutation = useMutation({
    mutationFn: (request: ScrapeRequestDto) => scrapingApi.startScrape(request),
    onSuccess: (data) => {
      setProgress({
        jobId: data.jobId,
        status: 'scraping',
        progress: 0,
        found: data.found || 0,
        saved: data.saved || 0,
        message: data.message,
      });
    },
    onError: () => {
      setProgress((prev) => ({
        ...prev,
        status: 'failed',
        message: 'Failed to start scraping',
      }));
    },
  });

  // Poll job status if active
  const { data: jobStatus } = useQuery({
    queryKey: ['scraping-job', progress.jobId],
    queryFn: () => scrapingApi.getJobStatus(progress.jobId!),
    enabled: !!progress.jobId && progress.status === 'scraping',
    refetchInterval: 2000, // Poll every 2 seconds
  });

  // Update progress based on job status
  useEffect(() => {
    if (jobStatus && progress.status === 'scraping') {
      if (jobStatus.status === 'completed') {
        setProgress((prev) => ({
          ...prev,
          status: 'completed',
          progress: 100,
          message: 'Scraping completed successfully',
        }));
      } else if (jobStatus.status === 'failed') {
        setProgress((prev) => ({
          ...prev,
          status: 'failed',
          message: jobStatus.failedReason || 'Scraping failed',
        }));
      } else if (jobStatus.progress !== undefined && jobStatus.progress !== progress.progress) {
        setProgress((prev) => ({
          ...prev,
          progress: jobStatus.progress || 0,
        }));
      }
    }
  }, [jobStatus, progress.status, progress.progress]);

  return {
    progress,
    startScrape: startScrapeMutation.mutate,
    isStarting: startScrapeMutation.isPending,
    resetProgress: () =>
      setProgress({
        jobId: null,
        status: 'idle',
        progress: 0,
        found: 0,
        saved: 0,
        message: '',
      }),
  };
}
