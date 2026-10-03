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
  // Local reference files are selected in memory; never bundled into the rehearsal.
  define: { 'import.meta.env.VITE_LOCAL_SOURCE_REGISTER': JSON.stringify('true') },
  plugins: [prelaunchVitePlugin(), react(), tailwindcss()],
  build: {
    manifest: true,
    outDir: fileURLToPath(new URL('./dist-rehearsal', import.meta.url)),
    emptyOutDir: false,
  },
  preview: { host: '127.0.0.1', port: 3012 },
});
