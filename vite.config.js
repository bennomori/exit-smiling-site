import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: ["scarcity-living-reformer.ngrok-free.dev"],
    proxy: {
      "/store": {
        target: "http://localhost:9000",
        changeOrigin: true,
      },
      "/static": {
        target: "http://localhost:9000",
        changeOrigin: true,
      },
    },
  },
});
