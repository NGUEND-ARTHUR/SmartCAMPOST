import React from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

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
  center = [3.8480, 11.5021],
  zoom = 12,
  height = "400px",
  markers = [],
  showCircle = null,
}: MapProps) {
  return (
    <div className="w-full rounded overflow-hidden">
      <MapContainer center={center} zoom={zoom} style={{ height, width: "100%" }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {markers.map((m) => (
          <Marker key={m.id} position={m.position}>
            <Popup>{m.label ?? m.id}</Popup>
          </Marker>
        ))}
        {showCircle && (
          <Circle center={showCircle.center} radius={showCircle.radius} />
        )}
        <FitBounds markers={markers} />
      </MapContainer>
    </div>
  );
}
