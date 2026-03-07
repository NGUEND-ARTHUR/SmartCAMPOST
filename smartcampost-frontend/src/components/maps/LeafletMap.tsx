import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Popup, Source, Layer, useMap } from "react-map-gl/maplibre";
import type { MapLayerMouseEvent } from "react-map-gl/maplibre";
import { LngLatBounds } from "maplibre-gl";

import { CameroonMap } from "@/components/maps/core/CameroonMap";
import { LAYER_COLORS } from "@/components/maps/core/mapStyles";

export type MapProps = {
  center?: [number, number];
  zoom?: number;
  height?: string;
  markers?: Array<{ id: string; position: [number, number]; label?: string }>;
  showCircle?: { center: [number, number]; radius: number } | null;
  showSearch?: boolean;
  showControls?: boolean;
};

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

/** Build a GeoJSON FeatureCollection from marker array */
function markersToGeoJSON(
  markers: NonNullable<MapProps["markers"]>,
): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: markers.map((m) => ({
      type: "Feature" as const,
      geometry: {
        type: "Point" as const,
        coordinates: [m.position[1], m.position[0]], // lng, lat
      },
      properties: { id: m.id, label: m.label ?? m.id },
    })),
  };
}

/** Approximate circle polygon (meters → degrees) */
function circleGeoJSON(
  center: [number, number],
  radiusM: number,
  points = 64,
): GeoJSON.Feature {
  const [lat, lon] = center;
  const km = radiusM / 1000;
  const coords: [number, number][] = [];
  for (let i = 0; i <= points; i++) {
    const angle = (i / points) * 2 * Math.PI;
    const dx = km / (111.32 * Math.cos((lat * Math.PI) / 180));
    const dy = km / 110.574;
    coords.push([lon + dx * Math.cos(angle), lat + dy * Math.sin(angle)]);
  }
  return {
    type: "Feature",
    geometry: { type: "Polygon", coordinates: [coords] },
    properties: {},
  };
}

/* ------------------------------------------------------------------ */
/* FitBounds — auto-zoom to markers                                   */
/* ------------------------------------------------------------------ */
function FitBounds({ markers }: { markers?: MapProps["markers"] }) {
  const { current: map } = useMap();
  useEffect(() => {
    if (!markers?.length || !map) return;
    const bounds = new LngLatBounds();
    markers.forEach((m) => bounds.extend([m.position[1], m.position[0]]));
    map.fitBounds(bounds, { padding: 50, duration: 1000 });
  }, [map, markers]);
  return null;
}

/* ------------------------------------------------------------------ */
/* LeafletMap — main reusable map with clustering                     */
/* ------------------------------------------------------------------ */
function LeafletMapInner({
  center = [3.848, 11.5021],
  zoom = 12,
  height = "400px",
  markers = [],
  showCircle = null,
  showSearch = false,
  showControls = true,
}: MapProps) {
  const [popupInfo, setPopupInfo] = useState<{
    longitude: number;
    latitude: number;
    label: string;
  } | null>(null);

  const geojson = useMemo(() => markersToGeoJSON(markers), [markers]);

  const circleData = useMemo(
    () =>
      showCircle ? circleGeoJSON(showCircle.center, showCircle.radius) : null,
    [showCircle],
  );

  const onClick = useCallback((e: MapLayerMouseEvent) => {
    const feature = e.features?.[0];
    if (!feature) return;

    if (feature.layer?.id === "clusters") {
      // Zoom into clicked cluster
      const coords = (feature.geometry as GeoJSON.Point).coordinates;
      const clusterId = feature.properties?.cluster_id;
      if (clusterId == null) return;
      // Access underlying map to get expansion zoom
      const rawMap = (
        e.target as unknown as { getSource: (id: string) => unknown }
      ).getSource?.("markers-source") as
        | {
            getClusterExpansionZoom: (id: number) => Promise<number>;
          }
        | undefined;
      rawMap?.getClusterExpansionZoom(clusterId).then((zoom: number) => {
        (e.target as unknown as { easeTo: (o: object) => void }).easeTo?.({
          center: coords as [number, number],
          zoom,
          duration: 500,
        });
      });
    } else if (feature.layer?.id === "unclustered-point") {
      const [lng, lat] = (feature.geometry as GeoJSON.Point).coordinates;
      setPopupInfo({
        longitude: lng,
        latitude: lat,
        label: (feature.properties?.label as string) || "",
      });
    }
  }, []);

  const interactiveLayerIds = useMemo(
    () => (markers.length > 0 ? ["clusters", "unclustered-point"] : undefined),
    [markers.length],
  );

  return (
    <CameroonMap
      center={center}
      zoom={zoom}
      height={height}
      showSearch={showSearch}
      showControls={showControls}
      onClick={onClick}
      interactiveLayerIds={interactiveLayerIds}
    >
      {/* GPU-powered clustering */}
      {markers.length > 0 && (
        <Source
          id="markers-source"
          type="geojson"
          data={geojson}
          cluster
          clusterMaxZoom={14}
          clusterRadius={50}
        >
          {/* Cluster circles */}
          <Layer
            id="clusters"
            type="circle"
            filter={["has", "point_count"]}
            paint={{
              "circle-color": LAYER_COLORS.primary,
              "circle-radius": [
                "step",
                ["get", "point_count"],
                18,
                10,
                24,
                50,
                30,
                100,
                38,
              ],
              "circle-stroke-width": 2,
              "circle-stroke-color": "#ffffff",
            }}
          />
          {/* Cluster count labels */}
          <Layer
            id="cluster-count"
            type="symbol"
            filter={["has", "point_count"]}
            layout={{
              "text-field": "{point_count_abbreviated}",
              "text-size": 12,
            }}
            paint={{
              "text-color": "#ffffff",
            }}
          />
          {/* Individual markers */}
          <Layer
            id="unclustered-point"
            type="circle"
            filter={["!", ["has", "point_count"]]}
            paint={{
              "circle-color": LAYER_COLORS.primary,
              "circle-radius": 7,
              "circle-stroke-width": 2,
              "circle-stroke-color": "#ffffff",
            }}
          />
        </Source>
      )}

      {/* Circle overlay */}
      {circleData && (
        <Source id="circle-source" type="geojson" data={circleData}>
          <Layer
            id="circle-fill"
            type="fill"
            paint={{
              "fill-color": LAYER_COLORS.primary,
              "fill-opacity": 0.15,
            }}
          />
          <Layer
            id="circle-stroke"
            type="line"
            paint={{
              "line-color": LAYER_COLORS.primary,
              "line-width": 2,
            }}
          />
        </Source>
      )}

      {/* Popup */}
      {popupInfo && (
        <Popup
          longitude={popupInfo.longitude}
          latitude={popupInfo.latitude}
          onClose={() => setPopupInfo(null)}
          closeOnClick={false}
          anchor="bottom"
          className="maplibre-popup-custom"
        >
          <div className="text-sm font-medium text-foreground">
            {popupInfo.label}
          </div>
        </Popup>
      )}

      <FitBounds markers={markers} />
    </CameroonMap>
  );
}

const LeafletMap = React.memo(LeafletMapInner);
export default LeafletMap;
