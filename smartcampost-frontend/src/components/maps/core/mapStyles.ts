/** Map style definitions for MapLibre GL JS */

/** Basemap styles for MapLibre GL JS — using fast raster tiles */
export const MAP_STYLES = {
  light: {
    version: 8,
    sources: {
      "osm-tiles": {
        type: "raster",
        tiles: [
          "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png",
          "https://b.tile.openstreetmap.org/{z}/{x}/{y}.png",
          "https://c.tile.openstreetmap.org/{z}/{x}/{y}.png",
        ],
        tileSize: 256,
        attribution: "© OpenStreetMap contributors",
        maxzoom: 19,
      },
    },
    layers: [
      {
        id: "osm-layer",
        type: "raster",
        source: "osm-tiles",
        minzoom: 0,
        maxzoom: 19,
      },
    ],
  },
  dark: {
    version: 8,
    sources: {
      "carto-dark-tiles": {
        type: "raster",
        tiles: [
          "https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
          "https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
          "https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
        ],
        tileSize: 256,
        attribution: "© CARTO © OpenStreetMap contributors",
        maxzoom: 19,
      },
    },
    layers: [
      {
        id: "carto-dark-layer",
        type: "raster",
        source: "carto-dark-tiles",
        minzoom: 0,
        maxzoom: 19,
      },
    ],
  },
} as any;

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
