import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig(({ mode }) => ({
  base: mode === 'production' ? '/cloudimage-carousel/' : '/',
  root: resolve(__dirname, '../demo'),
  build: {
    outDir: resolve(__dirname, '../dist-demo'),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, '../demo/index.html'),
      },
    },
  },
  resolve: {
    alias: {
      '@cloudimage/carousel': resolve(__dirname, '../src/index.ts'),
    },
  },
}))
