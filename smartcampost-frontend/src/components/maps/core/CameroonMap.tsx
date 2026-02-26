import React, { useEffect, useMemo } from "react";
import { MapContainer, Polygon, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { cn } from "@/lib/utils";
import { useTheme } from "@/theme/theme";
import {
  CAMEROON_BOUNDS,
  CAMEROON_CENTER,
  CAMEROON_DEFAULT_ZOOM,
  CAMEROON_MAX_ZOOM,
  CAMEROON_MIN_ZOOM,
} from "./cameroon";
import { MapControls } from "./MapControls";
import { MapSearch } from "./MapSearch";

type LatLngTuple = [number, number];

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

function CameroonBoundsEnforcer() {
  const map = useMap();

  useEffect(() => {
    const z = map.getBoundsZoom(CAMEROON_BOUNDS, true);
    const nextMin = Math.max(CAMEROON_MIN_ZOOM, z);
    map.setMinZoom(nextMin);

    const onMoveEnd = () => {
      const center = map.getCenter();
      if (!CAMEROON_BOUNDS.contains(center)) {
        map.panTo(CAMEROON_BOUNDS.getCenter(), { animate: false });
      }
    };

    const onZoomEnd = () => {
      const currentZoom = map.getZoom();
      if (currentZoom < nextMin) {
        map.setZoom(nextMin, { animate: false });
      }
    };

    map.on("moveend", onMoveEnd);
    map.on("zoomend", onZoomEnd);
    return () => {
      map.off("moveend", onMoveEnd);
      map.off("zoomend", onZoomEnd);
    };
  }, [map]);

  return null;
}

function CameroonMask() {
  const outerRing: LatLngTuple[] = useMemo(
    () => [
      [90, -180],
      [90, 180],
      [-90, 180],
      [-90, -180],
    ],
    [],
  );

  const sw = CAMEROON_BOUNDS.getSouthWest();
  const ne = CAMEROON_BOUNDS.getNorthEast();
  const innerRing: LatLngTuple[] = useMemo(
    () => [
      [sw.lat, sw.lng],
      [ne.lat, sw.lng],
      [ne.lat, ne.lng],
      [sw.lat, ne.lng],
    ],
    [ne.lat, ne.lng, sw.lat, sw.lng],
  );

  return (
    <Polygon
      positions={[outerRing, innerRing] as any}
      pathOptions={{
        stroke: false,
        fillColor: "hsl(var(--background))",
        fillOpacity: 0.7,
      }}
      interactive={false}
    />
  );
}

export function CameroonMap({
  center = CAMEROON_CENTER,
  zoom = CAMEROON_DEFAULT_ZOOM,
  height = "400px",
  className,
  children,
  showControls = true,
  showSearch = false,
}: {
  center?: LatLngTuple;
  zoom?: number;
  height?: string;
  className?: string;
  children?: React.ReactNode;
  showControls?: boolean;
  showSearch?: boolean;
}) {
  const { resolvedTheme } = useTheme();
  const heightClassName = heightToClassName(height);

  const tile =
    resolvedTheme === "dark"
      ? {
          url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
        }
      : {
          url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        };

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-lg border border-border bg-card",
        heightClassName,
        className,
      )}
    >
      <MapContainer
        center={center}
        zoom={zoom}
        minZoom={CAMEROON_MIN_ZOOM}
        maxZoom={CAMEROON_MAX_ZOOM}
        maxBounds={CAMEROON_BOUNDS}
        maxBoundsViscosity={1.0}
        preferCanvas
        zoomControl={false}
        className="h-full w-full"
      >
        <TileLayer
          url={tile.url}
          attribution={tile.attribution}
          bounds={CAMEROON_BOUNDS}
          noWrap
          maxNativeZoom={19}
        />
        <CameroonBoundsEnforcer />
        <CameroonMask />
        {showControls && <MapControls />}
        {showSearch && <MapSearch />}
        {children}
      </MapContainer>
    </div>
  );
}
