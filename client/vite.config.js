// client/vite.config.js
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173, // Your client's dev port
    proxy: {
      // Requests to /api/... will be forwarded to http://localhost:3000/api/...
      "/api": {
        target: "http://localhost:3001", // Your backend server address
        changeOrigin: true, // Important for proper proxying
        secure: false, // Set to false if your backend is HTTP (not HTTPS)
        // ws: true,        // If you use WebSockets
        // rewrite: (path) => path.replace(/^\/api/, '/api') // Usually not needed if your backend also expects /api
        // The key is that the final request to the backend should be http://localhost:3000/api/your-endpoint
        // If your backend does NOT expect /api (e.g., it listens for /classes directly),
        // then you would use: rewrite: (path) => path.replace(/^\/api/, '')
      },
    },
  },
});
