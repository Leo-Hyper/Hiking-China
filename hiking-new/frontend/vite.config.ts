import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const r = (p: string) => path.resolve(process.cwd(), p);

export default defineConfig({
  root: '.',
  base: process.env.CLIENT_BASE_PATH || '/',
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
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/framer-motion')) return 'motion-vendor';
          if (id.includes('node_modules/@radix-ui')) return 'radix-vendor';
          if (id.includes('node_modules/lucide-react')) return 'icons-vendor';
          if (
            id.includes('node_modules/react/')
            || id.includes('node_modules/react-dom/')
            || id.includes('node_modules/react-router')
            || id.includes('node_modules/scheduler/')
          ) {
            return 'react-vendor';
          }
          return undefined;
        },
      },
    },
  },
});
