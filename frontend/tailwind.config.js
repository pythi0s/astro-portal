/** @type {import('tailwindcss').Config} */
export default {
    content: ['./index.html', './src/**/*.{vue,js,ts}'],
    theme: {
        extend: {
            colors: {
                primary: { 50: '#fef3e2', 100: '#fde4b9', 200: '#fbc76d', 300: '#f9a825', 400: '#f57f17', 500: '#e65100', 600: '#bf360c', 700: '#9e2e0c', 800: '#7e2810', 900: '#5f2012' },
                accent: { 50: '#fff3e0', 500: '#ff9800', 600: '#f57c00' },
                cosmic: { 50: '#f5f3ff', 100: '#ede9fe', 200: '#ddd6fe', 300: '#c4b5fd', 400: '#a78bfa', 500: '#7c3aed', 600: '#5b2d8e', 700: '#3f1a6e', 800: '#2d1052', 900: '#1a0536' },
                gold: { 50: '#fffbeb', 100: '#fef3c7', 200: '#fde68a', 300: '#fcd34d', 400: '#fbbf24', 500: '#f59e0b', 600: '#d97706', 700: '#b45309', 800: '#92400e', 900: '#78350f' },
                midnight: { 700: '#334155', 800: '#1e293b', 900: '#0f172a' },
            },
            boxShadow: {
                'btn': '0 1px 3px 0 rgba(0,0,0,0.08), 0 1px 2px -1px rgba(0,0,0,0.08)',
                'btn-hover': '0 4px 12px 0 rgba(0,0,0,0.12), 0 2px 4px -2px rgba(0,0,0,0.08)',
                'input-focus': '0 0 0 3px rgba(230, 81, 0, 0.15)',
                'cosmic-glow': '0 0 20px rgba(124,58,237,0.15)',
                'gold-glow': '0 0 20px rgba(245,158,11,0.2)',
                'card-cosmic': '0 4px 24px rgba(124,58,237,0.08)',
            },
            keyframes: {
                'btn-press': {
                    '0%, 100%': { transform: 'scale(1)' },
                    '50%': { transform: 'scale(0.97)' },
                },
                'fade-in': {
                    from: { opacity: '0', transform: 'translateY(-4px)' },
                    to: { opacity: '1', transform: 'translateY(0)' },
                },
                'shimmer': {
                    '0%': { backgroundPosition: '-200% 0' },
                    '100%': { backgroundPosition: '200% 0' },
                },
                'float': {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-6px)' },
                },
            },
            animation: {
                'btn-press': 'btn-press 0.15s ease-in-out',
                'fade-in': 'fade-in 0.2s ease-out',
                'shimmer': 'shimmer 2s infinite linear',
                'float': 'float 3s ease-in-out infinite',
            },
        },
    },
    plugins: [],
}
