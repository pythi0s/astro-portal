import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

// Kept separate from vite.config.ts so the production build bundle is not
// contaminated with jsdom/MSW scaffolding. `npm run test` picks this up
// automatically (vitest resolves vitest.config.ts before vite.config.ts).
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: false,
    setupFiles: ['./src/test/setup.ts'],
    css: true,
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    // localStorage + sessionStorage isolation between tests is important
    // because the auth store persists tokens there.
    clearMocks: true,
    restoreMocks: true,
  },
});
