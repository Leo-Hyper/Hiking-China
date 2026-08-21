import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const r = (p: string) => path.resolve(process.cwd(), p);

export default defineConfig({
  root: '.',
  publicDir: 'client/public',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': r('client/src'),
      '@client': r('client'),
      '@shared': r('shared'),
    },
  },
  define: {
    // 原模板用 process.env.CLIENT_BASE_PATH（平台 Rspack 管线有 polyfill），Vite 下显式注入
    'process.env.CLIENT_BASE_PATH': JSON.stringify(process.env.CLIENT_BASE_PATH || '/'),
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});