/**
 * Chart Configuration
 *
 * Centralized color scheme and chart styling following the 60/30/10 rule:
 * - 60% Charcoal (#1A1A1D): Backgrounds, chart backgrounds
 * - 30% Teal (#0D3B3B, #145A5A): Primary data series, surfaces
 * - 10% Orange (#FF5722): Accents, highlights, CTAs
 */

export const chartConfig = {
  colors: {
    // Primary colors
    primary: '#FF5722',      // Orange - 10% accent
    secondary: '#145A5A',    // Teal - 30% primary data
    tertiary: '#1A7070',     // Lighter teal - variation

    // Background colors (60% charcoal)
    background: '#1A1A1D',   // Charcoal - main background
    cardBg: '#2A2A2E',       // Charcoal light - card background

    // Grid and axis
    grid: '#2A2A2E',         // Subtle grid lines
    axis: '#4A4A4E',         // Axis lines

    // Text
    text: {
      primary: '#FFFFFF',
      secondary: '#9CA3AF',
      muted: '#6B7280',
    },

    // Status colors
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
  },

  gradients: {
    // Orange gradients for accents (10% rule)
    orange: {
      start: '#FF5722',
      end: '#E64A19',
      stops: [
        { offset: '0%', color: '#FF5722', opacity: 0.8 },
        { offset: '100%', color: '#E64A19', opacity: 0.2 },
      ],
    },

    // Teal gradients for primary data (30% rule)
    teal: {
      start: '#145A5A',
      end: '#0D3B3B',
      stops: [
        { offset: '0%', color: '#145A5A', opacity: 0.8 },
        { offset: '100%', color: '#0D3B3B', opacity: 0.2 },
      ],
    },

    // Light teal for secondary data
    tealLight: {
      start: '#1A7070',
      end: '#145A5A',
      stops: [
        { offset: '0%', color: '#1A7070', opacity: 0.6 },
        { offset: '100%', color: '#145A5A', opacity: 0.1 },
      ],
    },
  },

  // Chart-specific styling
  chart: {
    // Area chart
    area: {
      strokeWidth: 2,
      fillOpacity: 0.4,
      activeDot: { r: 6, fill: '#FF5722', stroke: '#FFFFFF', strokeWidth: 2 },
    },

    // Bar chart
    bar: {
      radius: [8, 8, 0, 0] as [number, number, number, number],
      maxBarSize: 60,
    },

    // Line chart
    line: {
      strokeWidth: 3,
      dot: { r: 4, strokeWidth: 2 },
      activeDot: { r: 6, fill: '#FF5722' },
    },

    // Sparkline (mini charts)
    sparkline: {
      strokeWidth: 2,
      dot: false,
    },

    // Tooltip styling
    tooltip: {
      contentStyle: {
        backgroundColor: '#1A1A1D',
        border: '1px solid rgba(255, 87, 34, 0.3)',
        borderRadius: '12px',
        padding: '12px',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
      },
      labelStyle: {
        color: '#9CA3AF',
        fontSize: '12px',
        fontWeight: 600,
        marginBottom: '4px',
      },
      itemStyle: {
        color: '#FFFFFF',
        fontSize: '14px',
        fontWeight: 500,
      },
      cursor: {
        stroke: 'rgba(255, 87, 34, 0.2)',
        strokeWidth: 2,
      },
    },

    // Grid styling
    grid: {
      stroke: '#2A2A2E',
      strokeDasharray: '3 3',
      strokeWidth: 1,
    },

    // Axis styling
    axis: {
      stroke: '#4A4A4E',
      tick: {
        fill: '#9CA3AF',
        fontSize: 12,
      },
    },
  },

  // Animation config
  animation: {
    duration: 800,
    easing: 'ease-in-out',
  },
} as const;

// Type exports for TypeScript
export type ChartColors = typeof chartConfig.colors;
export type ChartGradients = typeof chartConfig.gradients;

/**
 * Helper function to get gradient fill for area charts
 */
export const getGradientId = (type: 'orange' | 'teal' | 'tealLight') => {
  return `gradient-${type}`;
};

/**
 * Helper to create SVG gradient definitions
 */
export const createGradientDefs = () => {
  return (
    <defs>
      {/* Orange gradient (10% accent) */}
      <linearGradient id="gradient-orange" x1="0" y1="0" x2="0" y2="1">
        {chartConfig.gradients.orange.stops.map((stop, i) => (
          <stop
            key={i}
            offset={stop.offset}
            stopColor={stop.color}
            stopOpacity={stop.opacity}
          />
        ))}
      </linearGradient>

      {/* Teal gradient (30% primary) */}
      <linearGradient id="gradient-teal" x1="0" y1="0" x2="0" y2="1">
        {chartConfig.gradients.teal.stops.map((stop, i) => (
          <stop
            key={i}
            offset={stop.offset}
            stopColor={stop.color}
            stopOpacity={stop.opacity}
          />
        ))}
      </linearGradient>

      {/* Light teal gradient */}
      <linearGradient id="gradient-tealLight" x1="0" y1="0" x2="0" y2="1">
        {chartConfig.gradients.tealLight.stops.map((stop, i) => (
          <stop
            key={i}
            offset={stop.offset}
            stopColor={stop.color}
            stopOpacity={stop.opacity}
          />
        ))}
      </linearGradient>
    </defs>
  );
};
