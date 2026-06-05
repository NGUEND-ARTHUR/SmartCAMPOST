import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

// ESM-safe __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vitejs.dev/config/

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  optimizeDeps: {
    // Exclude packages that cause esbuild pre-bundle resolution errors (e.g., raf/performance-now)
    exclude: ["raf", "performance-now"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // Use local shims for packages that cause esbuild resolution issues
      "performance-now": path.resolve(
        __dirname,
        "./src/shims/performance-now.js",
      ),
      raf: path.resolve(__dirname, "./src/shims/raf.js"),
    },
  },
  build: {
    // SECURITY: Never expose source maps in production
    sourcemap: mode === 'development',
    // Increase warning threshold and split large vendor chunks
    chunkSizeWarningLimit: 2200, // in KB
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (!id.includes("node_modules")) return;

          if (
            id.includes("/leaflet/") ||
            id.includes("react-leaflet") ||
            id.includes("@react-leaflet")
          ) {
            return "maps";
          }

          // Separate MapLibre GL into its own chunk (it's very large)
          if (
            id.includes("maplibre-gl") ||
            id.includes("mapbox-gl") ||
            id.includes("react-map-gl")
          ) {
            return "maplibre";
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
  // Prevent SSR build from trying to bundle problematic CJS packages
  ssr: {
    noExternal: ["raf", "performance-now"],
  },
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
    include: ["src/**/*.{test,spec}.{js,ts,jsx,tsx}"],
    exclude: ["node_modules/**", "tests/e2e.spec.ts"],
  },
}) as any);
