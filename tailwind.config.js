/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          navy: '#0F223A',
          navyDark: '#0A1829',
          navyLight: '#162B47',
          muted: '#2F466F',
          warm: '#EDEAE6',
          charcoal: '#1C1C1C',
        },
        status: {
          success: '#3E7C4F',
          successBg: '#E9F2EC',
          warning: '#B07A1F',
          warningBg: '#F7F0E0',
          danger: '#B3452F',
          dangerBg: '#F8E9E4',
          info: '#2F466F',
          infoBg: '#E8EDF5',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
        display: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          'sans-serif',
        ],
        mono: ['SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(15, 34, 58, 0.04), 0 4px 16px rgba(15, 34, 58, 0.06)',
        'card-hover': '0 2px 4px rgba(15, 34, 58, 0.06), 0 12px 28px rgba(15, 34, 58, 0.12)',
        panel: '0 1px 3px rgba(15, 34, 58, 0.08), 0 8px 24px rgba(15, 34, 58, 0.1)',
        glow: '0 0 0 1px rgba(47, 70, 111, 0.15), 0 0 0 4px rgba(47, 70, 111, 0.08)',
      },
      borderRadius: {
        xl: '0.875rem',
      },
      opacity: {
        2: '0.02',
        3: '0.03',
        4: '0.04',
        6: '0.06',
        7: '0.07',
        8: '0.08',
        9: '0.09',
        12: '0.12',
        15: '0.15',
        18: '0.18',
        35: '0.35',
        45: '0.45',
        55: '0.55',
        65: '0.65',
        85: '0.85',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in-scale': {
          from: { opacity: '0', transform: 'scale(0.98)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        'fade-in-up': {
          from: { opacity: '0', transform: 'translateY(12px) scale(0.98)' },
          to: { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'toast-in': {
          from: { opacity: '0', transform: 'translateX(16px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        'slide-in-left': {
          from: { opacity: '0', transform: 'translateX(48px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.25s ease-out both',
        'fade-in-scale': 'fade-in-scale 0.18s ease-out both',
        'fade-in-up': 'fade-in-up 0.22s ease-out both',
        'toast-in': 'toast-in 0.25s ease-out both',
        'slide-in-left': 'slide-in-left 0.22s ease-out both',
      },
    },
  },
  plugins: [],
};
