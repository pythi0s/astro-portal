import { themeBackgroundImages, themeColors, themeVariablesPlugin } from './tailwind.theme.js';

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: themeColors,
      backgroundImage: {
        'mandala-gradient': 'radial-gradient(ellipse at 30% 20%, #f5f0ff 0%, #fff8e7 40%, #FFFBF5 70%, #ecfdf5 100%)',
        'topbar-gradient': 'linear-gradient(135deg, #1A0A2E 0%, #2d1555 50%, #3d1f70 100%)',
        ...themeBackgroundImages,
      },
      keyframes: {
        'mandala-spin': {
          from: { transform: 'rotate(0deg)' },
          to:   { transform: 'rotate(360deg)' },
        },
        'fade-in-up': {
          '0%':   { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'kpi-pop': {
          '0%':   { opacity: '0', transform: 'scale(0.92) translateY(8px)' },
          '70%':  { transform: 'scale(1.02) translateY(-2px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-400px 0' },
          '100%': { backgroundPosition: '400px 0' },
        },
      },
      animation: {
        'mandala-spin': 'mandala-spin 80s linear infinite',
        'fade-in-up':   'fade-in-up 0.4s ease-out both',
        'kpi-pop':      'kpi-pop 0.5s cubic-bezier(0.34,1.56,0.64,1) both',
        shimmer:        'shimmer 1.6s infinite linear',
      },
    },
  },
  plugins: [themeVariablesPlugin],
};
