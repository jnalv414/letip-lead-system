/**
 * LeTip Lead System - Analytics Dashboard
 *
 * Sophisticated analytics platform with 12-column grid layout.
 * Follows 60/30/10 color rule:
 * - 60% Charcoal (#1A1A1D): Backgrounds, page base
 * - 30% Teal (#0D3B3B, #145A5A): Headers, cards, primary surfaces
 * - 10% Orange (#FF5722): CTAs, accents, highlights
 */

'use client';

import { useSocketStatus } from '@/providers/socket-provider';
import {
  ConnectionStatus,
  DashboardStats,
  BusinessGrowthChart,
  LeadSourcesChart,
  CalendarWidget,
  TopBusinessesList,
  PipelineBubbles,
  GeographicStats,
  ActivityFeed,
} from '@/components/dashboard';
import { motion } from 'framer-motion';

export default function HomePage() {
  const { isConnected } = useSocketStatus();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen bg-charcoal selection:bg-orange selection:text-white">
      {/* Skip Links for Keyboard Navigation */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-orange focus:text-white focus:rounded-lg focus:shadow-lg"
      >
        Skip to main content
      </a>
      <a
        href="#dashboard-stats"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-48 focus:z-50 focus:px-4 focus:py-2 focus:bg-orange focus:text-white focus:rounded-lg focus:shadow-lg"
      >
        Skip to statistics
      </a>
      <a
        href="#navigation"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-96 focus:z-50 focus:px-4 focus:py-2 focus:bg-orange focus:text-white focus:rounded-lg focus:shadow-lg"
      >
        Skip to navigation
      </a>

      {/* Header (30% Teal surface) */}
      <motion.header
        className="bg-teal border-b border-orange/10 sticky top-0 z-50 backdrop-blur-sm"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, type: 'spring', stiffness: 100 }}
        role="banner"
      >
        <div className="max-w-[1600px] mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <h1 className="text-3xl font-bold text-white tracking-tight font-display">
                LeTip Lead System
              </h1>
              <p className="mt-2 text-sm text-gray-300">
                Western Monmouth County Analytics Dashboard
              </p>
            </motion.div>

            {/* Connection status and navigation */}
            <motion.div
              className="flex items-center gap-4"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              {/* Quick nav */}
              <nav
                id="navigation"
                className="hidden md:flex gap-6 text-sm font-medium mr-4"
                role="navigation"
                aria-label="Main navigation"
              >
                <button
                  className="text-white bg-charcoal-light px-4 py-2 rounded-full hover:bg-orange transition-colors duration-200"
                  aria-current="page"
                  aria-label="Overview - current page"
                >
                  Overview
                </button>
                <button
                  className="text-gray-300 hover:text-white py-2 transition-colors duration-200"
                  aria-label="View businesses"
                >
                  Businesses
                </button>
                <button
                  className="text-gray-300 hover:text-white py-2 transition-colors duration-200"
                  aria-label="View analytics"
                >
                  Analytics
                </button>
              </nav>

              <ConnectionStatus />
            </motion.div>
          </div>
        </div>
      </motion.header>

      {/* Main Content (60% Charcoal background) */}
      <motion.main
        id="main-content"
        className="max-w-[1600px] mx-auto px-8 py-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        role="main"
        aria-label="Dashboard main content"
      >
        {/* Stats Overview */}
        <motion.div
          id="dashboard-stats"
          variants={itemVariants}
          className="mb-8"
          role="region"
          aria-label="Dashboard statistics section"
        >
          <DashboardStats />
        </motion.div>

        {/* 12-Column Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
          {/* Row 1: Business Growth (5 cols) + Calendar (3 cols) + Lead Sources (4 cols) */}
          <motion.div
            variants={itemVariants}
            className="col-span-1 lg:col-span-5"
          >
            <BusinessGrowthChart />
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="col-span-1 lg:col-span-3"
          >
            <CalendarWidget />
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="col-span-1 lg:col-span-4"
          >
            <LeadSourcesChart />
          </motion.div>
        </div>

        {/* Row 2: Top Businesses (4 cols) + Pipeline Bubbles (4 cols) + Geographic Stats (4 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
          <motion.div
            variants={itemVariants}
            className="col-span-1 lg:col-span-4"
          >
            <TopBusinessesList />
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="col-span-1 lg:col-span-4"
          >
            <PipelineBubbles />
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="col-span-1 lg:col-span-4"
          >
            <GeographicStats />
          </motion.div>
        </div>

        {/* Row 3: Activity Feed (full width) */}
        <motion.div variants={itemVariants} className="mb-8">
          <ActivityFeed />
        </motion.div>

        {/* Real-Time Status Indicator (10% Orange accent) */}
        <motion.div
          variants={itemVariants}
          className="bg-teal-light rounded-3xl border border-orange/10 shadow-xl p-6 overflow-hidden"
          role="region"
          aria-label="System status information"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white mb-2">
                System Status
              </h2>
              <p className="text-sm text-gray-400">
                Real-time WebSocket connection, TanStack Query caching, and automatic updates
              </p>
            </div>

            <div
              className="flex items-center gap-3 px-6 py-3 bg-charcoal-light rounded-2xl border border-orange/20"
              role="status"
              aria-live="polite"
              aria-atomic="true"
            >
              <motion.div
                className={`w-3 h-3 rounded-full ${isConnected ? 'bg-orange' : 'bg-red-400'}`}
                animate={{
                  scale: isConnected ? [1, 1.3, 1] : [1, 1.2, 1],
                  opacity: [1, 0.6, 1],
                  boxShadow: isConnected
                    ? [
                        '0 0 0 0 rgba(255, 87, 34, 0.4)',
                        '0 0 0 8px rgba(255, 87, 34, 0)',
                        '0 0 0 0 rgba(255, 87, 34, 0)',
                      ]
                    : '0 0 0 0 rgba(239, 68, 68, 0)',
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                aria-hidden="true"
              />
              <span className="text-base font-semibold text-white">
                <span className="sr-only">
                  System status: {isConnected ? 'Connected, live updates active' : 'Disconnected, attempting to reconnect'}
                </span>
                <span aria-hidden="true">
                  {isConnected ? 'Live Updates Active' : 'Reconnecting...'}
                </span>
              </span>
            </div>
          </div>
        </motion.div>
      </motion.main>

      {/* Footer */}
      <footer
        className="border-t border-orange/10 mt-16"
        role="contentinfo"
        aria-label="Site footer"
      >
        <div className="max-w-[1600px] mx-auto px-8 py-6">
          <div className="flex justify-between items-center text-sm text-gray-500">
            <p>&copy; 2025 LeTip of Western Monmouth County. All rights reserved.</p>
            <nav
              className="flex gap-4"
              role="navigation"
              aria-label="Footer navigation"
            >
              <a
                href="#"
                className="hover:text-orange cursor-pointer transition-colors duration-200 focus:outline-none  rounded px-1"
                aria-label="View documentation"
              >
                Documentation
              </a>
              <a
                href="#"
                className="hover:text-orange cursor-pointer transition-colors duration-200 focus:outline-none  rounded px-1"
                aria-label="Get support"
              >
                Support
              </a>
              <a
                href="#"
                className="hover:text-orange cursor-pointer transition-colors duration-200 focus:outline-none  rounded px-1"
                aria-label="Change settings"
              >
                Settings
              </a>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}
