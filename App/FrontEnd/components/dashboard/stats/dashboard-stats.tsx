'use client';

import { useQuery } from '@tanstack/react-query';
import { useSocketListener } from '@/providers/socket-provider';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface Stats {
  totalBusinesses: number;
  enrichedBusinesses: number;
  pendingBusinesses: number;
  totalContacts: number;
}

// API client function
async function fetchStats(): Promise<Stats> {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/businesses/stats`);
  if (!response.ok) {
    throw new Error('Failed to fetch stats');
  }
  return response.json();
}

export function DashboardStats() {
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Fetch stats with React Query
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['stats'],
    queryFn: fetchStats,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Listen for stats update events
  useSocketListener('stats:updated', () => {
    setLastUpdate(new Date());
  });

  useEffect(() => {
    // Stats updated via WebSocket
    if (lastUpdate.getTime() > Date.now() - 1000) {
      // Stats refreshed
    }
  }, [lastUpdate]);

  if (isLoading) {
    return (
      <div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        role="region"
        aria-label="Loading dashboard statistics"
        aria-busy="true"
      >
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="bg-charcoal rounded-3xl shadow-xl border border-teal-light/5 p-6 animate-pulse"
            role="status"
            aria-label="Loading statistic"
          >
            <div className="h-4 bg-white/10 rounded w-3/4 mb-4"></div>
            <div className="h-8 bg-white/10 rounded w-1/2"></div>
            <span className="sr-only">Loading...</span>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="bg-red-500/10 border border-red-500/20 rounded-3xl px-6 py-4"
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
      >
        <div className="flex items-start gap-3">
          <svg
            className="w-5 h-5 text-red-400 mt-0.5"
            fill="currentColor"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <div>
            <h3 className="text-sm font-semibold text-red-300" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Failed to load stats
            </h3>
            <p className="mt-1 text-sm text-red-400" style={{ fontFamily: 'Inter, sans-serif' }}>
              {(error as Error).message}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      label: 'Total Businesses',
      value: stats?.totalBusinesses || 0,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      iconBg: 'bg-charcoal-light',
      iconColor: 'text-teal-lighter',
      description: 'Total number of businesses in the system',
    },
    {
      label: 'Enriched',
      value: stats?.enrichedBusinesses || 0,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      iconBg: 'bg-charcoal-light',
      iconColor: 'text-teal-lighter',
      description: 'Businesses with complete contact and firmographic data',
    },
    {
      label: 'Pending Enrichment',
      value: stats?.pendingBusinesses || 0,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      iconBg: 'bg-charcoal-light',
      iconColor: 'text-teal-lighter',
      description: 'Businesses awaiting enrichment processing',
    },
    {
      label: 'Total Contacts',
      value: stats?.totalContacts || 0,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      iconBg: 'bg-charcoal-light',
      iconColor: 'text-teal-lighter',
      description: 'Total number of business contacts discovered',
    },
  ];

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const cardVariants = {
    hidden: {
      opacity: 0,
      y: 20,
      scale: 0.95,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: 'spring' as const,
        stiffness: 100,
        damping: 15,
      },
    },
  };

  return (
    <section aria-labelledby="stats-heading" role="region">
      <motion.div
        className="flex items-center justify-between mb-6"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h2
          id="stats-heading"
          className="text-xl font-semibold text-white font-display"
        >
          Dashboard Statistics
        </h2>
        <motion.span
          className="text-sm text-gray-400 font-sans"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          role="status"
          aria-live="polite"
          aria-atomic="true"
          aria-label={`Statistics last updated at ${lastUpdate.toLocaleTimeString()}`}
        >
          Updated {lastUpdate.toLocaleTimeString()}
        </motion.span>
      </motion.div>

      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        role="region"
        aria-label="Business statistics overview"
      >
        {statCards.map((stat, index) => (
          <motion.article
            key={stat.label}
            variants={cardVariants}
            whileHover={{
              y: -8,
              scale: 1.02,
              transition: { duration: 0.3 }
            }}
            className="bg-charcoal rounded-3xl shadow-xl border border-teal-light/10 p-6 hover:border-teal-light/30 transition-all duration-300 cursor-pointer "
            tabIndex={0}
            role="article"
            aria-label={`${stat.label}: ${stat.value.toLocaleString()}`}
            aria-describedby={`stat-desc-${index}`}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                // Handle stat card interaction
              }
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <motion.div
                className={`${stat.iconBg} rounded-xl p-3`}
                whileHover={{ rotate: [0, -10, 10, -10, 0], transition: { duration: 0.5 } }}
                role="presentation"
                aria-hidden="true"
              >
                <div className={stat.iconColor}>
                  {stat.icon}
                </div>
              </motion.div>
            </div>
            <div>
              <p
                className="text-sm font-medium text-gray-400 mb-1 font-sans"
                id={`stat-label-${index}`}
              >
                {stat.label}
              </p>
              <motion.p
                className="text-3xl font-bold text-white font-display"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  delay: 0.5 + (index * 0.1),
                  type: 'spring',
                  stiffness: 200,
                }}
                aria-live="polite"
                aria-atomic="true"
              >
                {stat.value.toLocaleString()}
              </motion.p>
              <span
                id={`stat-desc-${index}`}
                className="sr-only"
              >
                {stat.description}
              </span>
            </div>
          </motion.article>
        ))}
      </motion.div>
    </section>
  );
}
