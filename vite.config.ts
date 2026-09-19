import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import {retiredPortraitMiddleware} from './config/retiredPortraits';

export default defineConfig(() => {
  return {
    plugins: [
      react(), tailwindcss(),
      {
        name: 'retired-portrait-responses',
        configureServer(server) { server.middlewares.use(retiredPortraitMiddleware); },
        configurePreviewServer(server) { server.middlewares.use(retiredPortraitMiddleware); },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
