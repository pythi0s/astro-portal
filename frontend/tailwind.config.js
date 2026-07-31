/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fff8f0',
          100: '#ffe8cc',
          200: '#ffd199',
          300: '#ffba66',
          400: '#ffa333',
          500: '#FF8C00',
          600: '#e67e00',
          700: '#cc7000',
          800: '#b36200',
          900: '#995400',
        },
        accent: { 50: '#fff3e0', 500: '#ff9800', 600: '#f57c00' },
        midnight: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
        // ── Mandala palette ────────────────────────────────────────────────
        saffron: {
          50:  '#fff8e7',
          100: '#ffefc4',
          400: '#FFB830',
          500: '#FF8C00',
          600: '#e67e00',
          700: '#b36200',
        },
        violet: {
          50:  '#f5f0ff',
          100: '#ede6ff',
          300: '#c4a8f5',
          400: '#a855f7',
          500: '#8B5CF6',
          600: '#7C3AED',
          700: '#6D28D9',
          800: '#4C1D95',
          900: '#2D1B69',
        },
        gold: {
          300: '#f5d87a',
          400: '#E8C14A',
          500: '#D4AF37',
          600: '#b89230',
        },
        crimson: {
          50:  '#fff0f3',
          400: '#f43f5e',
          500: '#BE123C',
          600: '#9f1239',
        },
        jade: {
          50:  '#ecfdf5',
          400: '#34d399',
          500: '#059669',
          600: '#047857',
        },
        deep: {
          900: '#1A0A2E',
          800: '#2d1555',
          700: '#3d1f70',
        },
        cream: {
          50:  '#FFFBF5',
          100: '#FFF5E6',
          200: '#FFE8CC',
        },
      },
      backgroundImage: {
        'mandala-gradient': 'radial-gradient(ellipse at 30% 20%, #f5f0ff 0%, #fff8e7 40%, #FFFBF5 70%, #ecfdf5 100%)',
        'topbar-gradient': 'linear-gradient(135deg, #1A0A2E 0%, #2d1555 50%, #3d1f70 100%)',
        'kpi-saffron': 'linear-gradient(135deg, #fff8e7 0%, #ffefc4 100%)',
        'kpi-crimson': 'linear-gradient(135deg, #fff0f3 0%, #ffe4ea 100%)',
        'kpi-violet': 'linear-gradient(135deg, #f5f0ff 0%, #ede6ff 100%)',
        'kpi-jade':   'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
        'kpi-gold':   'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
        'kpi-deep':   'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
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
  plugins: [],
};
