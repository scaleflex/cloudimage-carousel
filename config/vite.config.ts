import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, '../src/index.ts'),
      name: 'CloudImageCarousel',
      formats: ['es', 'cjs', 'umd'],
      fileName: (format) => {
        if (format === 'es') return 'js-cloudimage-carousel.esm.js'
        if (format === 'cjs') return 'js-cloudimage-carousel.cjs.js'
        return 'js-cloudimage-carousel.min.js'
      },
    },
    outDir: resolve(__dirname, '../dist'),
    emptyOutDir: true,
    sourcemap: true,
    minify: 'esbuild',
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        exports: 'named',
        assetFileNames: 'js-cloudimage-carousel.min.[ext]',
      },
    },
  },
})
