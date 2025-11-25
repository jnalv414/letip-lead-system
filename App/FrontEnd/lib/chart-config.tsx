/**
 * Chart Configuration
 *
 * Centralized color scheme and chart styling following the 60/30/10 rule:
 * - 60% Deep Navy (#0a0a0f, #111118, #1a1a24): Backgrounds, chart backgrounds
 * - 30% Purple/Blue (#8B5CF6, #3B82F6): Primary data series, surfaces
 * - 10% Cyan/Pink (#06B6D4, #EC4899): Accents, highlights, CTAs
 */

export const chartConfig = {
  colors: {
    // Primary colors
    primary: '#8B5CF6',      // Purple - 30% accent
    secondary: '#3B82F6',    // Blue - 30% primary data
    tertiary: '#06B6D4',     // Cyan - 10% variation

    // Background colors (60% deep navy)
    background: '#0a0a0f',   // Deep navy - main background
    cardBg: '#1a1a24',       // Navy - card background

    // Grid and axis
    grid: '#2e2e3a',         // Subtle grid lines
    axis: '#3e3e4a',         // Axis lines

    // Text
    text: {
      primary: '#FFFFFF',
      secondary: '#A1A1AA',
      muted: '#71717A',
    },

    // Status colors
    success: '#22C55E',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
  },

  gradients: {
    // Purple gradients for primary data (30% rule)
    purple: {
      start: '#8B5CF6',
      end: '#7C3AED',
      stops: [
        { offset: '0%', color: '#8B5CF6', opacity: 0.8 },
        { offset: '100%', color: '#7C3AED', opacity: 0.2 },
      ],
    },

    // Blue gradients for secondary data (30% rule)
    blue: {
      start: '#3B82F6',
      end: '#2563EB',
      stops: [
        { offset: '0%', color: '#3B82F6', opacity: 0.8 },
        { offset: '100%', color: '#2563EB', opacity: 0.2 },
      ],
    },

    // Cyan for accent highlights (10% rule)
    cyan: {
      start: '#06B6D4',
      end: '#0891B2',
      stops: [
        { offset: '0%', color: '#06B6D4', opacity: 0.6 },
        { offset: '100%', color: '#0891B2', opacity: 0.1 },
      ],
    },
  },

  // Chart-specific styling
  chart: {
    // Area chart
    area: {
      strokeWidth: 2,
      fillOpacity: 0.4,
      activeDot: { r: 6, fill: '#8B5CF6', stroke: '#FFFFFF', strokeWidth: 2 },
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
      activeDot: { r: 6, fill: '#8B5CF6' },
    },

    // Sparkline (mini charts)
    sparkline: {
      strokeWidth: 2,
      dot: false,
    },

    // Tooltip styling
    tooltip: {
      contentStyle: {
        backgroundColor: '#0a0a0f',
        border: '1px solid rgba(139, 92, 246, 0.3)',
        borderRadius: '12px',
        padding: '12px',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
      },
      labelStyle: {
        color: '#A1A1AA',
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
        stroke: 'rgba(139, 92, 246, 0.2)',
        strokeWidth: 2,
      },
    },

    // Grid styling
    grid: {
      stroke: '#2e2e3a',
      strokeDasharray: '3 3',
      strokeWidth: 1,
    },

    // Axis styling
    axis: {
      stroke: '#3e3e4a',
      tick: {
        fill: '#A1A1AA',
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
export const getGradientId = (type: 'purple' | 'blue' | 'cyan') => {
  return `gradient-${type}`;
};

/**
 * Helper to create SVG gradient definitions
 */
export const createGradientDefs = () => {
  return (
    <defs>
      {/* Purple gradient (30% primary) */}
      <linearGradient id="gradient-purple" x1="0" y1="0" x2="0" y2="1">
        {chartConfig.gradients.purple.stops.map((stop, i) => (
          <stop
            key={i}
            offset={stop.offset}
            stopColor={stop.color}
            stopOpacity={stop.opacity}
          />
        ))}
      </linearGradient>

      {/* Blue gradient (30% secondary) */}
      <linearGradient id="gradient-blue" x1="0" y1="0" x2="0" y2="1">
        {chartConfig.gradients.blue.stops.map((stop, i) => (
          <stop
            key={i}
            offset={stop.offset}
            stopColor={stop.color}
            stopOpacity={stop.opacity}
          />
        ))}
      </linearGradient>

      {/* Cyan gradient (10% accent) */}
      <linearGradient id="gradient-cyan" x1="0" y1="0" x2="0" y2="1">
        {chartConfig.gradients.cyan.stops.map((stop, i) => (
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
