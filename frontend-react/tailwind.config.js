/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fef3e2',
          100: '#fde4b9',
          200: '#fbc76d',
          300: '#f9a825',
          400: '#f57f17',
          500: '#e65100',
          600: '#bf360c',
          700: '#9e2e0c',
          800: '#7e2810',
          900: '#5f2012',
        },
        accent: { 50: '#fff3e0', 500: '#ff9800', 600: '#f57c00' },
        midnight: { 700: '#334155', 800: '#1e293b', 900: '#0f172a' },
      },
    },
  },
  plugins: [],
};
