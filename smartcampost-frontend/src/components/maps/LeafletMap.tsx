import React from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  Circle,
} from "react-leaflet";
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

// Cameroon bounding box (approx.)
const CAMEROON_BOUNDS: L.LatLngBoundsExpression = [
  [1.6, 8.4], // south-west
  [13.2, 16.2], // north-east
];

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
  center = [7.3697, 12.3547],
  zoom = 12,
  height = "400px",
  markers = [],
  showCircle = null,
}: MapProps) {
  return (
    <div className="w-full rounded overflow-hidden">
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height, width: "100%" }}
        maxBounds={CAMEROON_BOUNDS}
        maxBoundsViscosity={1.0}
      >
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
