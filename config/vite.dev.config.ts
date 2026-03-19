import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  root: resolve(__dirname, '../demo'),
  server: {
    port: 3300,
    open: true,
  },
})
