import React, { useCallback, useEffect, useRef, useState } from "react";
import Map, { Source, Layer, useMap } from "react-map-gl/maplibre";
import type { MapRef, MapLayerMouseEvent } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { cn } from "@/lib/utils";
import { useTheme } from "@/theme/theme";
import {
  CAMEROON_BOUNDS,
  CAMEROON_CENTER,
  CAMEROON_DEFAULT_ZOOM,
  CAMEROON_MAX_ZOOM,
  CAMEROON_MIN_ZOOM,
} from "./cameroon";
import { MAP_STYLES, TERRAIN_TILES_URL, LAYER_COLORS } from "./mapStyles";
import { MapControls } from "./MapControls";
import { MapSearch } from "./MapSearch";

/* ------------------------------------------------------------------ */
/* Cameroon mask GeoJSON — dims everything outside the bounding box   */
/* ------------------------------------------------------------------ */
const CAMEROON_MASK_GEOJSON: GeoJSON.Feature = {
  type: "Feature",
  geometry: {
    type: "Polygon",
    coordinates: [
      // outer ring (world)
      [
        [-180, -90],
        [180, -90],
        [180, 90],
        [-180, 90],
        [-180, -90],
      ],
      // inner ring (Cameroon cut-out)
      [
        [8.4, 1.65],
        [16.3, 1.65],
        [16.3, 13.1],
        [8.4, 13.1],
        [8.4, 1.65],
      ],
    ],
  },
  properties: {},
};

/* ------------------------------------------------------------------ */
/* Height class mapping (avoids inline styles)                        */
/* ------------------------------------------------------------------ */
function heightToClassName(height: string | undefined): string {
  switch (height) {
    case "100%":
      return "cameroon-map-h-full";
    case "600px":
      return "cameroon-map-h-600";
    case "62vh":
      return "cameroon-map-h-62vh";
    case "60vh":
      return "cameroon-map-h-60vh";
    case "400px":
    default:
      return "cameroon-map-h-400";
  }
}

/* ------------------------------------------------------------------ */
/* CameroonMap — core map wrapper with 3D support                     */
/* ------------------------------------------------------------------ */
export function CameroonMap({
  center = CAMEROON_CENTER,
  zoom = CAMEROON_DEFAULT_ZOOM,
  height = "400px",
  className,
  children,
  showControls = true,
  showSearch = false,
  pitch = 0,
  bearing = 0,
  show3DBuildings = true,
  showTerrain = false,
  onClick,
  interactiveLayerIds,
  cursor,
}: {
  center?: [number, number];
  zoom?: number;
  height?: string;
  className?: string;
  children?: React.ReactNode;
  showControls?: boolean;
  showSearch?: boolean;
  pitch?: number;
  bearing?: number;
  show3DBuildings?: boolean;
  showTerrain?: boolean;
  onClick?: (e: MapLayerMouseEvent) => void;
  interactiveLayerIds?: string[];
  cursor?: string;
}) {
  const { resolvedTheme } = useTheme();
  const heightClassName = heightToClassName(height);
  const mapRef = useRef<MapRef>(null);
  const [ready, setReady] = useState(false);

  // centre is [lat, lng] for compat; MapLibre wants lng, lat
  const longitude = center[1];
  const latitude = center[0];

  const mapStyle =
    resolvedTheme === "dark" ? MAP_STYLES.dark : MAP_STYLES.light;

  /* ---- 3D features setup (runs on initial load + style change) ---- */
  const setup3D = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (!map || !map.isStyleLoaded()) return;

    // 3D buildings
    if (show3DBuildings && !map.getLayer("3d-buildings")) {
      const style = map.getStyle();
      for (const [name, source] of Object.entries(style?.sources ?? {})) {
        if ((source as Record<string, unknown>).type === "vector") {
          try {
            map.addLayer({
              id: "3d-buildings",
              source: name,
              "source-layer": "building",
              type: "fill-extrusion",
              minzoom: 14,
              paint: {
                "fill-extrusion-color":
                  resolvedTheme === "dark"
                    ? LAYER_COLORS.buildingDark
                    : LAYER_COLORS.buildingLight,
                "fill-extrusion-height": [
                  "coalesce",
                  ["get", "render_height"],
                  5,
                ],
                "fill-extrusion-base": [
                  "coalesce",
                  ["get", "render_min_height"],
                  0,
                ],
                "fill-extrusion-opacity": 0.7,
              },
            });
          } catch {
            /* layer may already exist */
          }
          break;
        }
      }
    }

    // 3D terrain
    if (showTerrain) {
      try {
        if (!map.getSource("terrain-dem")) {
          map.addSource("terrain-dem", {
            type: "raster-dem",
            tiles: [TERRAIN_TILES_URL],
            tileSize: 256,
            encoding: "terrarium",
          });
        }
        map.setTerrain({ source: "terrain-dem", exaggeration: 1.3 });
      } catch {
        /* source may already exist */
      }
    }
  }, [show3DBuildings, showTerrain, resolvedTheme]);

  const onLoad = useCallback(() => {
    setReady(true);
    setup3D();
  }, [setup3D]);

  // Re-apply 3D features after theme (style) switches
  useEffect(() => {
    if (!ready) return;
    const map = mapRef.current?.getMap();
    if (!map) return;

    const handler = () => setup3D();
    map.on("styledata", handler);
    return () => {
      map.off("styledata", handler);
    };
  }, [ready, setup3D]);

  // Cursor for interactive layers
  const onMouseEnter = useCallback(
    (e: MapLayerMouseEvent) => {
      if (interactiveLayerIds?.length) {
        e.target.getCanvas().style.cursor = cursor ?? "pointer";
      }
    },
    [interactiveLayerIds, cursor],
  );
  const onMouseLeave = useCallback((e: MapLayerMouseEvent) => {
    e.target.getCanvas().style.cursor = "";
  }, []);

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-lg border border-border bg-card",
        heightClassName,
        className,
      )}
    >
      <Map
        ref={mapRef}
        initialViewState={{ longitude, latitude, zoom, pitch, bearing }}
        minZoom={CAMEROON_MIN_ZOOM}
        maxZoom={CAMEROON_MAX_ZOOM}
        maxBounds={CAMEROON_BOUNDS}
        mapStyle={mapStyle}
        style={{ width: "100%", height: "100%" }}
        onLoad={onLoad}
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        interactiveLayerIds={interactiveLayerIds}
        attributionControl={true}
        touchZoomRotate
        dragRotate
      >
        {/* Cameroon mask — dim outside area */}
        <Source id="cameroon-mask" type="geojson" data={CAMEROON_MASK_GEOJSON}>
          <Layer
            id="cameroon-mask-fill"
            type="fill"
            paint={{
              "fill-color":
                resolvedTheme === "dark"
                  ? LAYER_COLORS.maskDark
                  : LAYER_COLORS.maskLight,
              "fill-opacity": 0.7,
            }}
          />
        </Source>

        {showControls && <MapControls />}
        {showSearch && <MapSearch />}
        {children}
      </Map>
    </div>
  );
}
