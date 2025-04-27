import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path' // Import path module

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      // Optional: Setup alias for easier imports
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    // Optional: configure server port if needed
    // port: 8080,
    // Optional: proxy API requests (useful if frontend/backend are on different ports during dev)
    // proxy: {
    //   '/api': {
    //     target: 'http://localhost:3000', // Your backend API URL
    //     changeOrigin: true,
    //     rewrite: (path) => path.replace(/^\/api/, '') // Optional: remove /api prefix if backend doesn't expect it
    //   }
    // }
  },
})

