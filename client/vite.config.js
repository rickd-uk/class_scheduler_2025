// client/vite.config.js
import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');

  // Determine the proxy target based on environment
  // In dev: use container name for Docker networking
  // In production: proxy is not used (Nginx handles routing)
  const proxyTarget = env.VITE_PROXY_TARGET || "http://scheduler-server-dev:3000";

  return {
    plugins: [vue()],
    server: {
      port: 5173,
      host: '0.0.0.0', // Listen on all interfaces
      proxy: {
        "/api": {
          target: proxyTarget,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});
