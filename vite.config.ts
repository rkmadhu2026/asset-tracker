import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    optimizeDeps: {
      include: ['framer-motion', 'motion-dom'],
    },
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.AUTH_BYPASS': JSON.stringify(env.AUTH_BYPASS),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      // Always this Argus app on 3000 — if something else uses 3000, fail loudly instead of
      // silently jumping to 3001 (which feels like a “different app”).
      port: 3000,
      strictPort: true,
      host: true,
      hmr: process.env.DISABLE_HMR !== 'true',
      proxy: {
        '/api': {
          target: `http://localhost:${env.API_PORT || '4000'}`,
          changeOrigin: true,
        },
      },
    },
    preview: {
      port: 8080,
      host: true,
      proxy: {
        '/api': {
          target: `http://localhost:${env.API_PORT || '4000'}`,
          changeOrigin: true,
        },
      },
    },
  };
});
