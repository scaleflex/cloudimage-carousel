import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  root: resolve(__dirname, '../demo/react-demo'),
  server: {
    port: 3001,
    open: true,
  },
})
