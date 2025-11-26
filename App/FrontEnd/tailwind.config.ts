import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './hooks/**/*.{js,ts,jsx,tsx}',
    './providers/**/*.{js,ts,jsx,tsx}',
    './core/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Design Guide: Base gray palette
        gray: {
          50: '#F9FAFB',
          100: '#F3F4F6',
          200: '#E5E7EB',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280',
          600: '#4B5563',
          700: '#374151',
          800: '#1F2937',
          900: '#111827',
          950: '#0F172A',
        },
        // NEW: Deep Navy Backgrounds (60%)
        navy: {
          950: '#0a0a0f',
          900: '#111118',
          800: '#1a1a24',
          700: '#242430',
          600: '#2e2e3a',
        },
        // Keep slate for backwards compatibility
        slate: {
          900: '#0F172A',
          800: '#1E293B',
          700: '#334155',
          600: '#475569',
        },
        // NEW: Purple/Blue Accent (30%)
        violet: {
          500: '#8B5CF6',
          400: '#A78BFA',
          600: '#7C3AED',
        },
        // Update accent to purple
        accent: {
          DEFAULT: '#8B5CF6',
          purple: '#9b6dff',
          'purple-light': '#b794ff',
          'purple-dark': '#7c3aed',
          blue: '#3b9eff',
          'blue-light': '#60b0ff',
          cyan: '#06B6D4',
        },
        // Highlight colors (10% - tertiary)
        highlight: {
          cyan: '#06d6f4',
          pink: '#ff4d9d',
          emerald: '#10d980',
        },
        // Status colors
        success: '#22C55E',
        warning: '#F59E0B',
        error: '#EF4444',
        // Background colors
        'bg-primary': '#0a0a0f',
        'bg-secondary': '#111118',
        'bg-tertiary': '#1a1a24',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
        display: ['var(--font-space-grotesk)', 'Space Grotesk', 'system-ui', 'sans-serif'],
      },
      // Design Guide: 8px spacing grid
      spacing: {
        '18': '4.5rem', // 72px
        '22': '5.5rem', // 88px
      },
      // Design Guide: Subtle shadows
      boxShadow: {
        'subtle': '0 1px 3px rgba(0, 0, 0, 0.1)',
        'medium': '0 4px 6px rgba(0, 0, 0, 0.1)',
        'card': '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)',
        'card-hover': '0 4px 6px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.12)',
      },
      // Design Guide: Border radius
      borderRadius: {
        'card': '8px',
        'button': '6px',
        'input': '6px',
        'container': '12px',
        'badge': '4px',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'shine': 'shine 2s linear infinite',
        'shimmer-slide': 'shimmer-slide 8s infinite',
        'spin-around': 'spin-around 4s linear infinite',
        'border-beam': 'border-beam 4s linear infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        shine: {
          '0%': { backgroundPosition: '0% 0%' },
          '50%': { backgroundPosition: '100% 100%' },
          '100%': { backgroundPosition: '0% 0%' },
        },
        'shimmer-slide': {
          to: { transform: 'translate(calc(100cqw - 100%), 0)' },
        },
        'spin-around': {
          '0%': { transform: 'translateZ(0) rotate(0)' },
          '100%': { transform: 'translateZ(0) rotate(360deg)' },
        },
        'border-beam': {
          '0%': { offsetDistance: '0%' },
          '100%': { offsetDistance: '100%' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.8', transform: 'scale(1.05)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
