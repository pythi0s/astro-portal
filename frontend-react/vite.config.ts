import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const backendTarget = env.VITE_BACKEND_URL ?? 'http://localhost:8000';

  // `VITE_BASE` lets an operator move the React app under a subpath when
  // reverse-proxying via nginx (e.g. /app/). Leave unset (defaults to '/')
  // for the direct-port compose workflow. Always ends with a slash.
  const rawBase = env.VITE_BASE ?? '/';
  const base = rawBase.endsWith('/') ? rawBase : `${rawBase}/`;

  return {
    plugins: [react()],
    base,
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      host: '0.0.0.0',
      port: 5174,
      strictPort: true,
      // Vite 5 derives HMR websocket path from `base` automatically. When
      // operators proxy behind nginx they must set VITE_BASE=/app/ and
      // configure the nginx /app/ location block for websocket upgrades
      // (see nginx/default.conf).
      proxy: {
        // auth, health, uploads, timeline – not SPA routes, safe as-is
        '/auth': { target: backendTarget, changeOrigin: true },
        '/health': { target: backendTarget, changeOrigin: true },
        '/uploads': { target: backendTarget, changeOrigin: true },
        '/timeline': { target: backendTarget, changeOrigin: true },

        // Resource API calls always use a trailing slash (FastAPI style).
        // Bare paths like /customers (without /) are SPA routes and must
        // NOT be proxied — Vite will serve index.html for them automatically.
        '/customers/': { target: backendTarget, changeOrigin: true },
        '/visits/': { target: backendTarget, changeOrigin: true },
        '/solutions/': { target: backendTarget, changeOrigin: true },
        '/templates/': { target: backendTarget, changeOrigin: true },
        '/messages/': { target: backendTarget, changeOrigin: true },

        // /admin has real API routes (/admin/users, /admin/stats) that also
        // contain a path segment – use trailing-slash form so bare /admin/users
        // (SPA page) doesn't get proxied while /admin/ API calls do.
        '/admin/': { target: backendTarget, changeOrigin: true },

        // Dashboard API routes (/dashboard/earnings etc) – bare /dashboard is SPA
        '/dashboard/': { target: backendTarget, changeOrigin: true },
      },
    },
    build: {
      sourcemap: true,
      outDir: 'dist',
    },
  };
});
