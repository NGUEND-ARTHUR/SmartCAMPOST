import React from "react";
import { MapContainer, TileLayer } from "react-leaflet";
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
        <TileLayer url={tile.url} attribution={tile.attribution} />
        {showControls && <MapControls />}
        {showSearch && <MapSearch />}
        {children}
      </MapContainer>
    </div>
  );
}
