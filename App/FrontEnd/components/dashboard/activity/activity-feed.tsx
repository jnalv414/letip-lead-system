/**
 * Activity Feed
 *
 * Real-time event stream showing business creation, enrichment, scraping events.
 * Uses WebSocket for live updates and 60/30/10 color rule.
 */

'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSocketEvents } from '@/core/providers/websocket-provider';
import { motion, AnimatePresence } from 'framer-motion';

interface ActivityEvent {
  id: string;
  type: 'business:created' | 'business:enriched' | 'scraping:complete' | 'enrichment:failed';
  title: string;
  description: string;
  timestamp: Date;
  icon: 'business' | 'enrichment' | 'scraping' | 'error';
}

export function ActivityFeed() {
  const [events, setEvents] = React.useState<ActivityEvent[]>([
    {
      id: '1',
      type: 'business:created',
      title: 'New Business Added',
      description: 'ABC Plumbing Services in Freehold',
      timestamp: new Date(Date.now() - 5000),
      icon: 'business',
    },
    {
      id: '2',
      type: 'business:enriched',
      title: 'Business Enriched',
      description: 'Elite Legal Advisors - 3 contacts found',
      timestamp: new Date(Date.now() - 120000),
      icon: 'enrichment',
    },
    {
      id: '3',
      type: 'scraping:complete',
      title: 'Scraping Complete',
      description: '47 businesses found on Route 9, Freehold',
      timestamp: new Date(Date.now() - 300000),
      icon: 'scraping',
    },
    {
      id: '4',
      type: 'enrichment:failed',
      title: 'Enrichment Failed',
      description: 'TechStart Solutions - No website found',
      timestamp: new Date(Date.now() - 600000),
      icon: 'error',
    },
  ]);

  const maxEvents = 10;

  // Listen for real-time events
  useSocketEvents({
    'business:created': (data) => {
      addEvent({
        id: `${Date.now()}-created`,
        type: 'business:created',
        title: 'New Business Added',
        description: `${data.name} in ${data.city}`,
        timestamp: new Date(),
        icon: 'business',
      });
    },
    'business:enriched': (data) => {
      addEvent({
        id: `${Date.now()}-enriched`,
        type: 'business:enriched',
        title: 'Business Enriched',
        description: `${data.name} - ${data.contacts_count || 0} contacts found`,
        timestamp: new Date(),
        icon: 'enrichment',
      });
    },
    'scraping:complete': (data) => {
      addEvent({
        id: `${Date.now()}-scraping`,
        type: 'scraping:complete',
        title: 'Scraping Complete',
        description: `${data.found || 0} businesses found`,
        timestamp: new Date(),
        icon: 'scraping',
      });
    },
  });

  const addEvent = (event: ActivityEvent) => {
    setEvents((prev) => [event, ...prev].slice(0, maxEvents));
  };

  const getIcon = (iconType: ActivityEvent['icon']) => {
    switch (iconType) {
      case 'business':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
          </svg>
        );
      case 'enrichment':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      case 'scraping':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
    }
  };

  const getIconColor = (iconType: ActivityEvent['icon']) => {
    switch (iconType) {
      case 'business':
        return 'bg-teal-light/20 text-teal-lighter border-teal-light/40';
      case 'enrichment':
        return 'bg-teal-light/20 text-teal-lighter border-teal-light/40';
      case 'scraping':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/40';
      case 'error':
        return 'bg-red-500/20 text-red-400 border-red-500/40';
    }
  };

  const getTimeAgo = (timestamp: Date) => {
    const seconds = Math.floor((Date.now() - timestamp.getTime()) / 1000);

    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <Card variant="charcoal" hover animated>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-medium">Activity Feed</CardTitle>
          <div className="flex items-center gap-2 px-3 py-1 bg-charcoal-light rounded-full border border-teal-light/30">
            <motion.div
              className="w-2 h-2 rounded-full bg-teal-lighter"
              animate={{
                scale: [1, 1.3, 1],
                opacity: [1, 0.6, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
            <span className="text-xs font-medium text-gray-300">Live</span>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-3 max-h-[500px] overflow-y-auto overflow-x-hidden pr-2 custom-scrollbar">
          <AnimatePresence initial={false}>
            {events.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, height: 0, x: -20 }}
                animate={{ opacity: 1, height: 'auto', x: 0 }}
                exit={{ opacity: 0, height: 0, x: 20 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="flex items-start gap-3 p-3 rounded-xl bg-charcoal-light/50 border border-teal-light/10 hover:border-teal-light/30 hover:bg-charcoal-light transition-all duration-200"
              >
                {/* Icon */}
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center border flex-shrink-0 ${getIconColor(
                    event.icon
                  )}`}
                >
                  {getIcon(event.icon)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 max-w-full overflow-hidden">
                  <p className="text-sm font-medium text-white mb-1 truncate sm:whitespace-normal">{event.title}</p>
                  <p className="text-xs text-gray-400 truncate sm:whitespace-normal">{event.description}</p>
                  <span className="text-[10px] text-gray-600 mt-1 block">
                    {getTimeAgo(event.timestamp)}
                  </span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <motion.div
          className="mt-4 pt-4 border-t border-teal-light/10 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <button className="text-xs text-gray-400 hover:text-teal-lighter transition-colors duration-200">
            View All Activity →
          </button>
        </motion.div>
      </CardContent>
    </Card>
  );
}

{/* Custom scrollbar styles - add to globals.css */}
<style jsx global>{`
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
  }

  .custom-scrollbar::-webkit-scrollbar-track {
    background: #1a1a1d;
    border-radius: 10px;
  }

  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #145A5A;
    border-radius: 10px;
  }

  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #1A7070;
  }
`}</style>
