import React from "react";
import {
  Marker,
  Popup,
  useMap,
  Circle,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import { CameroonMap } from "@/components/maps/core/CameroonMap";

import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

export type MapProps = {
  center?: [number, number];
  zoom?: number;
  height?: string;
  markers?: Array<{ id: string; position: [number, number]; label?: string }>;
  showCircle?: { center: [number, number]; radius: number } | null;
  showSearch?: boolean;
  showControls?: boolean;
};

function FitBounds({ markers }: { markers?: MapProps["markers"] }) {
  const map = useMap();
  React.useEffect(() => {
    if (!markers || markers.length === 0) return;
    const bounds = L.latLngBounds(markers.map((m) => m.position));
    map.fitBounds(bounds.pad(0.5));
  }, [map, markers]);
  return null;
}

export default function LeafletMap({
  center = [3.848, 11.5021],
  zoom = 12,
  height = "400px",
  markers = [],
  showCircle = null,
  showSearch = false,
  showControls = true,
}: MapProps) {
  return (
    <CameroonMap
      center={center}
      zoom={zoom}
      height={height}
      showSearch={showSearch}
      showControls={showControls}
    >
      {markers.map((m) => (
        <Marker key={m.id} position={m.position}>
          <Popup>{m.label ?? m.id}</Popup>
        </Marker>
      ))}
      {showCircle && (
        <Circle center={showCircle.center} radius={showCircle.radius} />
      )}
      <FitBounds markers={markers} />
    </CameroonMap>
  );
}
