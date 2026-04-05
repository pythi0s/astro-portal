/** @type {import('tailwindcss').Config} */
export default {
    content: ['./index.html', './src/**/*.{vue,js,ts}'],
    theme: {
        extend: {
            colors: {
                primary: { 50: '#fef3e2', 100: '#fde4b9', 200: '#fbc76d', 300: '#f9a825', 400: '#f57f17', 500: '#e65100', 600: '#bf360c', 700: '#9e2e0c', 800: '#7e2810', 900: '#5f2012' },
                accent: { 50: '#fff3e0', 500: '#ff9800', 600: '#f57c00' },
            },
            boxShadow: {
                'btn': '0 1px 3px 0 rgba(0,0,0,0.08), 0 1px 2px -1px rgba(0,0,0,0.08)',
                'btn-hover': '0 4px 12px 0 rgba(0,0,0,0.12), 0 2px 4px -2px rgba(0,0,0,0.08)',
                'input-focus': '0 0 0 3px rgba(230, 81, 0, 0.15)',
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
            },
            animation: {
                'btn-press': 'btn-press 0.15s ease-in-out',
                'fade-in': 'fade-in 0.2s ease-out',
            },
        },
    },
    plugins: [],
}
