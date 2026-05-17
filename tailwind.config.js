/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        display: ['Inter', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
      },
      colors: {
        brand: {
          dark: '#1a2b3c',
          raised: '#223548',
          card: '#2a4054',
          hover: '#314a60',
        },
        ink: {
          DEFAULT: '#f8fafc',
          muted: '#a8b8c8',
          faint: '#6b7f92',
          dark: '#1a2b3c',
        },
        paper: {
          DEFAULT: '#1a2b3c',
          raised: '#223548',
          card: '#2a4054',
          hover: '#314a60',
        },
        accent: {
          DEFAULT: '#e58e8e',
          bright: '#f0b4b4',
          dim: '#c97a7a',
          glow: 'rgba(229, 142, 142, 0.18)',
        },
        danger: {
          DEFAULT: '#EF4444',
          bright: '#F87171',
          dim: '#DC2626',
          glow: 'rgba(239, 68, 68, 0.15)',
        },
        warning: {
          DEFAULT: '#F59E0B',
          bright: '#FBBF24',
          dim: '#D97706',
          glow: 'rgba(245, 158, 11, 0.15)',
        },
        info: {
          DEFAULT: '#6b9eb8',
          bright: '#8eb8cc',
          dim: '#4a7a94',
          glow: 'rgba(107, 158, 184, 0.15)',
        },
        surface: {
          border: 'rgba(168, 184, 200, 0.14)',
          divider: 'rgba(168, 184, 200, 0.08)',
        },
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.25rem',
        '3xl': '1.5rem',
      },
      maxWidth: {
        prose: '68ch',
      },
      boxShadow: {
        glow: '0 0 24px rgba(229, 142, 142, 0.2)',
        'glow-danger': '0 0 20px rgba(239, 68, 68, 0.15)',
        'glow-warning': '0 0 20px rgba(245, 158, 11, 0.15)',
        'glow-info': '0 0 20px rgba(107, 158, 184, 0.15)',
        card: '0 4px 24px rgba(0, 0, 0, 0.25)',
        'card-hover': '0 8px 40px rgba(0, 0, 0, 0.35)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
        'scan-line': 'scanLine 3s linear infinite',
        float: 'float 6s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(229, 142, 142, 0.12)' },
          '50%': { boxShadow: '0 0 40px rgba(229, 142, 142, 0.28)' },
        },
        scanLine: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'grid-pattern':
          'linear-gradient(rgba(168, 184, 200, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(168, 184, 200, 0.05) 1px, transparent 1px)',
      },
      backgroundSize: {
        grid: '40px 40px',
      },
    },
  },
  plugins: [],
};
