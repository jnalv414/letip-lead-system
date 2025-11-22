/**
 * Calendar Widget
 *
 * Mini calendar with highlighted dates and goal tracker.
 * Design inspired by the reference HTML but using charcoal/teal/orange palette.
 */

'use client';

import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';

interface CalendarWidgetProps {
  highlightedDates?: number[];
  monthlyGoal?: number;
  currentProgress?: number;
}

export function CalendarWidget({
  highlightedDates = [14, 15, 16, 17, 18],
  monthlyGoal = 500,
  currentProgress = 342,
}: CalendarWidgetProps) {
  const currentDate = new Date();
  const currentMonth = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const currentDay = currentDate.getDate();

  // Get days in current month
  const daysInMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0
  ).getDate();

  const progressPercentage = ((currentProgress / monthlyGoal) * 100).toFixed(0);

  return (
    <Card variant="charcoal" hover animated role="region" aria-label="Calendar and monthly goal tracker">
      <CardContent className="p-6">
        {/* Month header with navigation (10% orange accent) */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-sm font-medium text-gray-300" id="calendar-month" aria-live="polite">
            {currentMonth}
          </h3>
          <motion.button
            className="w-8 h-8 rounded-lg bg-charcoal-light border border-orange/20 flex items-center justify-center hover:bg-orange/20 hover:border-orange/40 transition-all duration-200"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Next month"
            tabIndex={0}
          >
            <svg className="w-4 h-4 text-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </motion.button>
        </div>

        {/* Day labels */}
        <div
          className="grid grid-cols-7 gap-1 sm:gap-2 text-center text-[10px] sm:text-xs text-gray-500 mb-4 font-semibold"
          role="row"
          aria-label="Days of the week"
        >
          {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day, i) => (
            <span key={i} role="columnheader" aria-label={day}>
              {day.charAt(0)}
            </span>
          ))}
        </div>

        {/* Calendar grid */}
        <div
          className="grid grid-cols-7 gap-1 sm:gap-2 mb-6"
          role="grid"
          aria-label={`Calendar for ${currentMonth}`}
          aria-describedby="calendar-description"
        >
          <span id="calendar-description" className="sr-only">
            Navigate dates with arrow keys. Press Enter to select a date.
          </span>
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNumber = i + 1;
            const isHighlighted = highlightedDates.includes(dayNumber);
            const isToday = dayNumber === currentDay;
            const dateLabel = `${dayNumber}${isToday ? ', today' : ''}${isHighlighted ? ', highlighted' : ''}`;

            return (
              <motion.div
                key={i}
                className={`
                  h-8 w-8 sm:h-10 sm:w-10 flex items-center justify-center rounded-xl text-xs sm:text-sm font-medium
                  transition-all duration-200 cursor-pointer
                  ${
                    isHighlighted
                      ? 'bg-orange text-white shadow-[0_0_20px_rgba(255,87,34,0.4)] font-bold'
                      : isToday
                      ? 'bg-teal-light text-white border border-teal-lighter'
                      : 'hover:bg-charcoal-light text-gray-400 hover:text-white'
                  }
                `}
                role="gridcell"
                tabIndex={isToday ? 0 : -1}
                aria-label={dateLabel}
                aria-selected={isToday}
                aria-current={isToday ? 'date' : undefined}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.01 }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    // Handle date selection
                  } else if (e.key === 'ArrowRight' && dayNumber < daysInMonth) {
                    const nextDay = e.currentTarget.nextElementSibling as HTMLElement;
                    nextDay?.focus();
                  } else if (e.key === 'ArrowLeft' && dayNumber > 1) {
                    const prevDay = e.currentTarget.previousElementSibling as HTMLElement;
                    prevDay?.focus();
                  } else if (e.key === 'ArrowDown' && dayNumber + 7 <= daysInMonth) {
                    const weekLater = e.currentTarget.parentElement?.children[i + 7] as HTMLElement;
                    weekLater?.focus();
                  } else if (e.key === 'ArrowUp' && dayNumber - 7 >= 1) {
                    const weekEarlier = e.currentTarget.parentElement?.children[i - 7] as HTMLElement;
                    weekEarlier?.focus();
                  }
                }}
              >
                {dayNumber}
              </motion.div>
            );
          })}
        </div>

        {/* Monthly goal tracker (30% teal surface) */}
        <div
          className="bg-teal rounded-2xl p-4 border border-orange/20"
          role="region"
          aria-labelledby="goal-heading"
        >
          <div className="flex justify-between items-center mb-3">
            <div>
              <h4
                id="goal-heading"
                className="text-xs text-gray-400 uppercase tracking-wider font-bold mb-1"
              >
                Monthly Goal
              </h4>
              <p
                className="text-2xl font-light text-white"
                aria-live="polite"
                aria-atomic="true"
              >
                <span aria-label={`${currentProgress} completed`}>
                  {currentProgress.toLocaleString()}
                </span>
                <span className="text-sm text-gray-400 ml-1" aria-label={`out of ${monthlyGoal} goal`}>
                  / {monthlyGoal.toLocaleString()}
                </span>
              </p>
            </div>
            <div
              className="w-12 h-12 rounded-xl bg-orange/20 border border-orange/40 flex items-center justify-center"
              role="presentation"
              aria-hidden="true"
            >
              <svg className="w-6 h-6 text-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>

          {/* Progress bar */}
          <div
            className="relative w-full h-2 bg-charcoal rounded-full overflow-hidden"
            role="progressbar"
            aria-valuenow={Number(progressPercentage)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Goal progress: ${progressPercentage}% complete`}
          >
            <motion.div
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-orange to-orange-light rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </div>

          {/* Progress badge */}
          <div className="flex justify-between items-center mt-3">
            <Badge
              variant="success"
              size="sm"
              role="status"
              aria-live="polite"
            >
              {progressPercentage}% Complete
            </Badge>
            <span
              className="text-xs text-gray-400"
              aria-label={`${monthlyGoal - currentProgress} remaining to reach goal`}
            >
              {monthlyGoal - currentProgress} to go
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
