import { prelaunchVitePlugin } from './server/prelaunch-gate.mjs';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  root: fileURLToPath(new URL('./rehearsal', import.meta.url)),
  base: './',
  publicDir: false,
  envDir: false,
  plugins: [prelaunchVitePlugin(), react(), tailwindcss()],
  build: {
    manifest: true,
    outDir: fileURLToPath(new URL('./dist-rehearsal', import.meta.url)),
    emptyOutDir: false,
  },
  preview: { host: '127.0.0.1', port: 3012 },
});
