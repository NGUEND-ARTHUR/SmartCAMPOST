/** Map style definitions for MapLibre GL JS */

/** CARTO vector basemap styles — free, no API key needed */
export const MAP_STYLES = {
  light: "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json",
  dark: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
} as const;

/** Free AWS terrain-RGB tiles (no API key) for 3D elevation */
export const TERRAIN_TILES_URL =
  "https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png";

/** Fixed colours for MapLibre paint properties (CSS vars aren't supported in GL layers) */
export const LAYER_COLORS = {
  primary: "#3b82f6",
  primaryGlow: "#93c5fd",
  secondary: "#64748b",
  destructive: "#dc2626",
  accent: "#f59e0b",
  buildingLight: "#d4c5a9",
  buildingDark: "#1a1a2e",
  maskLight: "#f5f5f5",
  maskDark: "#0a0a0a",
  route: "#3b82f6",
  routeDash: "#60a5fa",
} as const;
