import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

// ESM-safe __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vitejs.dev/config/

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Increase warning threshold and split large vendor chunks
    chunkSizeWarningLimit: 2200, // in KB
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;

          if (
            id.includes("/leaflet/") ||
            id.includes("react-leaflet") ||
            id.includes("@react-leaflet")
          ) {
            return "maps";
          }

          if (id.includes("recharts")) {
            return "charts";
          }

          if (
            id.includes("lucide-react") ||
            id.includes("sonner") ||
            id.includes("clsx") ||
            id.includes("class-variance-authority") ||
            id.includes("tailwind-merge") ||
            id.includes("@radix-ui")
          ) {
            return "ui";
          }

          return "vendor";
        },
      },
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
    include: ["src/**/*.{test,spec}.{js,ts,jsx,tsx}"],
    exclude: ["node_modules/**", "tests/e2e.spec.ts"],
  },
} as any);
