import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  // Where the dev server forwards /api requests. Override with VITE_PROXY_TARGET
  // (e.g. http://backend:5000 inside Docker Compose).
  const proxyTarget = env.VITE_PROXY_TARGET || 'http://localhost:5000';

  return {
    plugins: [react(), tailwindcss()],
    server: {
      host: '0.0.0.0',
      port: 5173,
      proxy: { '/api': { target: proxyTarget, changeOrigin: true } },
    },
    preview: {
      host: '0.0.0.0',
      port: 4173,
      proxy: { '/api': { target: proxyTarget, changeOrigin: true } },
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      chunkSizeWarningLimit: 900,
      rollupOptions: {
        output: {
          // Function form (required by Vite 8 / Rolldown): split vendor code for better caching.
          manualChunks(id) {
            if (!id.includes('node_modules')) return undefined;
            if (/node_modules\/(recharts|d3-|victory-vendor|es-toolkit|immer|redux|@reduxjs)/.test(id)) return 'charts';
            if (/node_modules\/(react|react-dom|react-router|react-router-dom|scheduler)\//.test(id)) return 'react';
            return undefined;
          },
        },
      },
    },
  };
});
