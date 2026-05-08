import path from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import { trueAdminMockPlugin } from './config/mock';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const enableMock = env.VITE_ENABLE_MSW === 'true';

  return {
    root: __dirname,
    plugins: [react(), tailwindcss(), trueAdminMockPlugin(enableMock)],
    build: {
      outDir: path.resolve(__dirname, 'dist'),
      emptyOutDir: true,
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
        '@config': path.resolve(__dirname, 'config'),
        '@core': path.resolve(__dirname, 'src/core'),
        '@modules': path.resolve(__dirname, 'src/modules'),
        '@plugins': path.resolve(__dirname, 'src/plugins'),
      },
    },
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: 'http://127.0.0.1:9501',
          changeOrigin: true,
        },
      },
    },
  };
});
