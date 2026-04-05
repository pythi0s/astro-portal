import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [
    vue(),
  ],
  server: {
    host: '0.0.0.0', // Crucial for Docker
    port: 5173,
    watch: {
      usePolling: true // Ensures hot-reloading works across Windows/WSL/Docker boundaries
    }
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})
