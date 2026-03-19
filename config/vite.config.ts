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
        // Unwrap UMD so window.CloudImageCarousel is the class, not a namespace object.
        // After the UMD assigns CloudImageCarousel = { CloudImageCarousel, default }, this
        // collapses it to just the class while preserving autoInit as a static method.
        footer: `if (typeof window !== 'undefined' && window.CloudImageCarousel && window.CloudImageCarousel.default) { window.CloudImageCarousel = window.CloudImageCarousel.default; }`,
      },
    },
  },
})
