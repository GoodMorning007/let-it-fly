import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  publicDir: 'assets',
  server: {
    host: true,
    port: 3000,
  },
  build: {
    outDir: 'dist',
    assetsInlineLimit: 0,
  },
});
