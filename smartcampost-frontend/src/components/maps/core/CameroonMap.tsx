import React, { useEffect, useMemo, useState } from "react";
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

function CameroonBoundsEnforcer() {
  const map = useMap();
  const [computedMinZoom, setComputedMinZoom] = useState<number | null>(null);

  useEffect(() => {
    const z = map.getBoundsZoom(CAMEROON_BOUNDS, true);
    const nextMin = Math.max(CAMEROON_MIN_ZOOM, z);
    map.setMinZoom(nextMin);
    setComputedMinZoom(nextMin);

    const onMoveEnd = () => {
      const center = map.getCenter();
      if (!CAMEROON_BOUNDS.contains(center)) {
        map.panTo(CAMEROON_BOUNDS.getCenter(), { animate: false });
      }
    };

    map.on("moveend", onMoveEnd);
    return () => {
      map.off("moveend", onMoveEnd);
    };
  }, [map]);

  useEffect(() => {
    if (computedMinZoom == null) return;
    const onZoomEnd = () => {
      const z = map.getZoom();
      if (z < computedMinZoom) {
        map.setZoom(computedMinZoom, { animate: false });
      }
    };
    map.on("zoomend", onZoomEnd);
    return () => {
      map.off("zoomend", onZoomEnd);
    };
  }, [computedMinZoom, map]);

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
        className,
      )}
      style={{ height }}
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
