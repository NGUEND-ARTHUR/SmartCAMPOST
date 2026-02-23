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

type MarkerItem = { id: string; position: [number, number]; label?: string };

function createClusterIcon(count: number): L.DivIcon {
  const size = count < 10 ? 34 : count < 100 ? 38 : 44;
  const fontSize = count < 100 ? 12 : 11;
  const html = `
    <div style="
      width:${size}px;
      height:${size}px;
      border-radius:${size}px;
      display:flex;
      align-items:center;
      justify-content:center;
      background:hsl(var(--primary));
      color:hsl(var(--primary-foreground));
      border:2px solid hsl(var(--background));
      box-shadow:0 1px 2px rgba(0,0,0,0.18);
      font-weight:600;
      font-size:${fontSize}px;">
      ${count}
    </div>`;
  return L.divIcon({
    html,
    className: "smartcampost-cluster",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

function ClusteredMarkers({ markers }: { markers: MarkerItem[] }) {
  const map = useMap();
  const [zoom, setZoom] = React.useState(() => map.getZoom());

  React.useEffect(() => {
    const onZoomEnd = () => setZoom(map.getZoom());
    map.on("zoomend", onZoomEnd);
    return () => {
      map.off("zoomend", onZoomEnd);
    };
  }, [map]);

  const { singles, clusters } = React.useMemo(() => {
    if (markers.length <= 80) {
      return {
        singles: markers,
        clusters: [] as Array<{ key: string; position: [number, number]; count: number }>,
      };
    }

    const gridSizePx = 64;
    const groups = new Map<string, { count: number; sumLat: number; sumLng: number }>();

    for (const m of markers) {
      const p = map.project(L.latLng(m.position[0], m.position[1]), zoom);
      const key = `${Math.floor(p.x / gridSizePx)}:${Math.floor(p.y / gridSizePx)}`;
      const g = groups.get(key);
      if (!g) {
        groups.set(key, { count: 1, sumLat: m.position[0], sumLng: m.position[1] });
      } else {
        g.count += 1;
        g.sumLat += m.position[0];
        g.sumLng += m.position[1];
      }
    }

    const clusteredCells = new Set<string>();
    const nextClusters: Array<{ key: string; position: [number, number]; count: number }> = [];
    for (const [key, g] of groups.entries()) {
      if (g.count > 1) {
        clusteredCells.add(key);
        nextClusters.push({
          key,
          position: [g.sumLat / g.count, g.sumLng / g.count],
          count: g.count,
        });
      }
    }

    if (nextClusters.length === 0) {
      return { singles: markers, clusters: [] };
    }

    const nextSingles: MarkerItem[] = [];
    for (const m of markers) {
      const p = map.project(L.latLng(m.position[0], m.position[1]), zoom);
      const key = `${Math.floor(p.x / gridSizePx)}:${Math.floor(p.y / gridSizePx)}`;
      if (!clusteredCells.has(key)) nextSingles.push(m);
    }

    return { singles: nextSingles, clusters: nextClusters };
  }, [map, markers, zoom]);

  return (
    <>
      {clusters.map((c) => (
        <Marker
          key={`cluster-${c.key}`}
          position={c.position}
          icon={createClusterIcon(c.count)}
          eventHandlers={{
            click: () => {
              const nextZoom = Math.min(map.getMaxZoom() ?? 19, zoom + 2);
              map.flyTo(c.position, nextZoom, { duration: 0.5 });
            },
          }}
        >
          <Popup>{c.count} locations</Popup>
        </Marker>
      ))}
      {singles.map((m) => (
        <Marker key={m.id} position={m.position}>
          <Popup>{m.label ?? m.id}</Popup>
        </Marker>
      ))}
    </>
  );
}

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
      <ClusteredMarkers markers={markers} />
      {showCircle && (
        <Circle center={showCircle.center} radius={showCircle.radius} />
      )}
      <FitBounds markers={markers} />
    </CameroonMap>
  );
}
