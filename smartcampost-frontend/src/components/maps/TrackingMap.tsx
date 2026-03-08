/**
 * Interactive Tracking Map Component
 * Shows parcel journey with animated marker traversing the route in real-time.
 * Powered by MapLibre GL JS with vector tiles and 3D support.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { Marker, Popup, Source, Layer, useMap } from "react-map-gl/maplibre";
import {
  Package,
  MapPin,
  Navigation,
  Clock,
  Play,
  Pause,
  RotateCcw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { CameroonMap } from "@/components/maps/core/CameroonMap";
import {
  AnimatedRouteMarker,
  type RouteAnimationState,
} from "@/components/maps/core/SmoothMarker";
import { LAYER_COLORS } from "@/components/maps/core/mapStyles";

/* ------------------------------------------------------------------ */
/* Custom marker component                                            */
/* ------------------------------------------------------------------ */
function MapMarkerIcon({
  bgClass,
  emoji,
  pulse = false,
}: {
  bgClass: string;
  emoji: string;
  pulse?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-center w-10 h-10 text-xl rounded-full border-3 border-background shadow-lg cursor-pointer ${bgClass} ${pulse ? "animate-pulse" : ""}`}
    >
      {emoji}
    </div>
  );
}

interface ScanEvent {
  id: string;
  eventType: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  timestamp: string;
  agencyName?: string;
}

interface TrackingMapProps {
  trackingId?: string;
  scanEvents?: ScanEvent[];
  currentStatus?: string;
  showAnimation?: boolean;
}

/* ------------------------------------------------------------------ */
/* Animated view — fly to centre on mount / change                    */
/* ------------------------------------------------------------------ */
function AnimatedView({
  center,
  zoom,
}: {
  center: [number, number];
  zoom: number;
}) {
  const { current: map } = useMap();
  useEffect(() => {
    map?.flyTo({ center: [center[1], center[0]], zoom, duration: 1500 });
  }, [center, zoom, map]);
  return null;
}

/* ------------------------------------------------------------------ */
/* Follow the animated parcel position                                */
/* ------------------------------------------------------------------ */
function FollowPosition({
  position,
  enabled,
}: {
  position: [number, number] | null;
  enabled: boolean;
}) {
  const { current: map } = useMap();
  useEffect(() => {
    if (!enabled || !position || !map) return;
    map.panTo([position[1], position[0]], { duration: 600 });
  }, [enabled, map, position]);
  return null;
}

/* ------------------------------------------------------------------ */
/* GeoJSON helpers                                                    */
/* ------------------------------------------------------------------ */
function lineGeoJSON(
  positions: [number, number][],
): GeoJSON.Feature<GeoJSON.LineString> {
  return {
    type: "Feature",
    geometry: {
      type: "LineString",
      coordinates: positions.map(([lat, lng]) => [lng, lat]),
    },
    properties: {},
  };
}

/** Slice `positions` up to `progress` (0→1) for the "traveled" trail */
function sliceRoute(
  positions: [number, number][],
  progress: number,
  animatedPos: [number, number],
): [number, number][] {
  if (positions.length < 2 || progress <= 0) return [];
  const idx = Math.min(
    Math.floor(progress * (positions.length - 1)),
    positions.length - 2,
  );
  return [...positions.slice(0, idx + 1), animatedPos];
}

/* ------------------------------------------------------------------ */
/* TrackingMap                                                        */
/* ------------------------------------------------------------------ */
export default function TrackingMap({
  trackingId,
  scanEvents = [],
  currentStatus = "IN_TRANSIT",
  showAnimation = true,
}: TrackingMapProps) {
  const [isAnimating, setIsAnimating] = useState(showAnimation);
  const [selectedEvent, setSelectedEvent] = useState<ScanEvent | null>(null);
  const [animState, setAnimState] = useState<RouteAnimationState | null>(null);
  const { t } = useTranslation();

  const eventPositions: [number, number][] = useMemo(
    () =>
      scanEvents
        .filter((e) => e.latitude && e.longitude)
        .map((e) => [e.latitude!, e.longitude!] as [number, number]),
    [scanEvents],
  );

  const fullRoute = eventPositions;

  const mapCenter: [number, number] = useMemo(() => {
    if (fullRoute.length > 0) {
      const lats = fullRoute.map((p) => p[0]);
      const lngs = fullRoute.map((p) => p[1]);
      return [
        (Math.min(...lats) + Math.max(...lats)) / 2,
        (Math.min(...lngs) + Math.max(...lngs)) / 2,
      ];
    }
    return [7.3697, 12.3547];
  }, [fullRoute]);

  const mapZoom = useMemo(() => {
    if (fullRoute.length < 2) return 10;
    const lats = fullRoute.map((p) => p[0]);
    const lngs = fullRoute.map((p) => p[1]);
    const maxDiff = Math.max(
      Math.max(...lats) - Math.min(...lats),
      Math.max(...lngs) - Math.min(...lngs),
    );
    if (maxDiff > 5) return 6;
    if (maxDiff > 2) return 7;
    if (maxDiff > 1) return 8;
    if (maxDiff > 0.5) return 10;
    return 12;
  }, [fullRoute]);

  /** Duration scales with number of waypoints: ~3s per segment, minimum 6s */
  const animDuration = useMemo(
    () => Math.max(6000, (fullRoute.length - 1) * 3000),
    [fullRoute],
  );

  // Full route GeoJSON (line to be rendered)
  const routeData = useMemo(
    () => (fullRoute.length >= 2 ? lineGeoJSON(fullRoute) : null),
    [fullRoute],
  );

  // Traveled portion GeoJSON (green trail behind parcel)
  const traveledData = useMemo(() => {
    if (!animState || fullRoute.length < 2) return null;
    const sliced = sliceRoute(
      fullRoute,
      animState.progress,
      animState.position,
    );
    return sliced.length >= 2 ? lineGeoJSON(sliced) : null;
  }, [animState, fullRoute]);

  const onProgress = useCallback(
    (s: RouteAnimationState) => setAnimState(s),
    [],
  );

  const isDelivered = currentStatus === "DELIVERED";

  if (!trackingId && fullRoute.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center text-muted-foreground">
            <MapPin className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>{t("trackingMap.noData")}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const progressPct = animState ? Math.round(animState.progress * 100) : 0;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2">
            <Navigation className="w-5 h-5" />
            {t("trackingMap.title")}
            {trackingId && ` - ${trackingId}`}
          </CardTitle>
          <div className="flex items-center gap-2">
            {fullRoute.length >= 2 && (
              <Button
                variant={isAnimating ? "default" : "outline"}
                size="sm"
                onClick={() => setIsAnimating(!isAnimating)}
              >
                {isAnimating ? (
                  <>
                    <Pause className="w-4 h-4 mr-1" />
                    {t("trackingMap.pause")}
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-1" />
                    {t("trackingMap.animate")}
                  </>
                )}
              </Button>
            )}
            <Badge variant="secondary">
              {t("trackingMap.checkpoints", { count: scanEvents.length })}
            </Badge>
          </div>
        </div>

        {/* Progress bar */}
        {fullRoute.length >= 2 && (
          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                ref={(el) => {
                  if (el) el.style.width = `${progressPct}%`;
                }}
                className="h-full rounded-full bg-primary transition-[width] duration-300"
              />
            </div>
            <span className="text-xs text-muted-foreground tabular-nums w-9 text-right">
              {progressPct}%
            </span>
          </div>
        )}
      </CardHeader>

      <CardContent className="p-0">
        <div className="h-100 relative">
          <CameroonMap
            center={mapCenter}
            zoom={mapZoom}
            height="100%"
            showControls
            showSearch={false}
            className="rounded-none border-0"
            pitch={35}
            show3DBuildings
          >
            <AnimatedView center={mapCenter} zoom={mapZoom} />
            <FollowPosition
              position={animState?.position ?? null}
              enabled={isAnimating}
            />

            {/* Full route — dashed line (upcoming path) */}
            {routeData && (
              <Source id="tracking-route" type="geojson" data={routeData}>
                <Layer
                  id="route-glow"
                  type="line"
                  paint={{
                    "line-color": LAYER_COLORS.primaryGlow,
                    "line-width": 6,
                    "line-opacity": 0.2,
                  }}
                  layout={{ "line-cap": "round", "line-join": "round" }}
                />
                <Layer
                  id="route-dash"
                  type="line"
                  paint={{
                    "line-color": LAYER_COLORS.primary,
                    "line-width": 3,
                    "line-opacity": 0.5,
                    "line-dasharray": [3, 2],
                  }}
                  layout={{ "line-cap": "round", "line-join": "round" }}
                />
              </Source>
            )}

            {/* Traveled trail — solid bright line behind the parcel */}
            {traveledData && (
              <Source id="traveled-trail" type="geojson" data={traveledData}>
                <Layer
                  id="trail-glow"
                  type="line"
                  paint={{
                    "line-color": LAYER_COLORS.route,
                    "line-width": 7,
                    "line-opacity": 0.25,
                  }}
                  layout={{ "line-cap": "round", "line-join": "round" }}
                />
                <Layer
                  id="trail-solid"
                  type="line"
                  paint={{
                    "line-color": LAYER_COLORS.route,
                    "line-width": 4,
                    "line-opacity": 0.9,
                  }}
                  layout={{ "line-cap": "round", "line-join": "round" }}
                />
              </Source>
            )}

            {/* Origin marker */}
            {fullRoute.length > 0 && (
              <Marker
                longitude={fullRoute[0][1]}
                latitude={fullRoute[0][0]}
                anchor="center"
              >
                <MapMarkerIcon bgClass="bg-secondary" emoji="📍" />
              </Marker>
            )}

            {/* Destination marker */}
            {fullRoute.length > 1 && (
              <Marker
                longitude={fullRoute[fullRoute.length - 1][1]}
                latitude={fullRoute[fullRoute.length - 1][0]}
                anchor="center"
              >
                <MapMarkerIcon bgClass="bg-destructive" emoji="🏁" />
              </Marker>
            )}

            {/* Transit checkpoint markers */}
            {scanEvents
              .filter((e) => e.latitude && e.longitude)
              .map((event) => (
                <Marker
                  key={event.id}
                  longitude={event.longitude!}
                  latitude={event.latitude!}
                  anchor="center"
                  onClick={(e) => {
                    e.originalEvent.stopPropagation();
                    setSelectedEvent(event);
                  }}
                >
                  <MapMarkerIcon bgClass="bg-accent" emoji="🚚" />
                </Marker>
              ))}

            {/* Event popup */}
            {selectedEvent &&
              selectedEvent.latitude &&
              selectedEvent.longitude && (
                <Popup
                  longitude={selectedEvent.longitude}
                  latitude={selectedEvent.latitude}
                  onClose={() => setSelectedEvent(null)}
                  closeOnClick={false}
                  anchor="bottom"
                >
                  <div className="min-w-37.5">
                    <strong className="flex items-center gap-1">
                      <Package className="w-4 h-4" />
                      {t("trackingMap.checkpointLabel", {
                        index:
                          scanEvents
                            .filter((e) => e.latitude && e.longitude)
                            .indexOf(selectedEvent) + 1,
                      })}
                    </strong>
                    <div className="mt-1 text-sm">
                      <p>{selectedEvent.eventType}</p>
                      {selectedEvent.agencyName && (
                        <p>📍 {selectedEvent.agencyName}</p>
                      )}
                      <p className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {new Date(selectedEvent.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </Popup>
              )}

            {/* Animated parcel marker — moves along the full route */}
            {fullRoute.length >= 2 && (
              <AnimatedRouteMarker
                waypoints={fullRoute}
                enabled={isAnimating && !isDelivered}
                durationMs={animDuration}
                loop
                onProgress={onProgress}
              >
                <MapMarkerIcon
                  bgClass="bg-primary"
                  emoji="📦"
                  pulse={isAnimating}
                />
              </AnimatedRouteMarker>
            )}

            {/* Static parcel at destination when delivered */}
            {isDelivered && fullRoute.length > 0 && (
              <Marker
                longitude={fullRoute[fullRoute.length - 1][1]}
                latitude={fullRoute[fullRoute.length - 1][0]}
                anchor="center"
              >
                <MapMarkerIcon bgClass="bg-[hsl(142_76%_36%)]" emoji="✅" />
              </Marker>
            )}
          </CameroonMap>

          {/* Legend overlay */}
          <div className="absolute bottom-4 left-4 bg-popover/90 text-popover-foreground backdrop-blur-sm rounded-lg p-3 shadow-lg z-2 text-xs border border-border">
            <div className="font-semibold mb-2">
              {t("trackingMap.legend.title")}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span>📍</span> {t("trackingMap.legend.origin")}
              </div>
              <div className="flex items-center gap-2">
                <span>🚚</span> {t("trackingMap.legend.checkpoint")}
              </div>
              <div className="flex items-center gap-2">
                <span>📦</span> {t("trackingMap.legend.currentPosition")}
              </div>
              <div className="flex items-center gap-2">
                <span>🏁</span> {t("trackingMap.legend.destination")}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="inline-block w-4 h-0.5 rounded bg-[#3b82f6]" />
                {t("trackingMap.legend.traveled", { defaultValue: "Traveled" })}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
