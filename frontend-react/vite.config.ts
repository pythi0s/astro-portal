import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const backendTarget = env.VITE_BACKEND_URL ?? 'http://localhost:8000';

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      host: '0.0.0.0',
      port: 5174,
      strictPort: true,
      proxy: {
        '/auth': { target: backendTarget, changeOrigin: true },
        '/customers': { target: backendTarget, changeOrigin: true },
        '/visits': { target: backendTarget, changeOrigin: true },
        '/solutions': { target: backendTarget, changeOrigin: true },
        '/templates': { target: backendTarget, changeOrigin: true },
        '/messages': { target: backendTarget, changeOrigin: true },
        '/timeline': { target: backendTarget, changeOrigin: true },
        '/dashboard': { target: backendTarget, changeOrigin: true },
        '/admin': { target: backendTarget, changeOrigin: true },
        '/health': { target: backendTarget, changeOrigin: true },
        '/uploads': { target: backendTarget, changeOrigin: true },
      },
    },
    build: {
      sourcemap: true,
      outDir: 'dist',
    },
  };
});
