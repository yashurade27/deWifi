import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

const apiProxyTarget = process.env.VITE_API_PROXY_TARGET ?? "http://localhost:3000";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: true,
    allowedHosts: true,
    proxy: {
      // Forward all /api calls to the local backend
      // This means the phone uses the same ngrok URL for everything
      '/api': {
        target: apiProxyTarget,
        changeOrigin: true,
        secure: false,
      },
    },
  },
})