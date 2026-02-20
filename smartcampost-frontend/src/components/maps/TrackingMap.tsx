/**
 * Interactive Tracking Map Component
 * Shows parcel journey with animated marker and route visualization
 */
import { useEffect, useMemo, useState } from "react";
import {
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Package, MapPin, Navigation, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/theme/theme";
import { CameroonMap } from "@/components/maps/core/CameroonMap";
import { SmoothMarker } from "@/components/maps/core/SmoothMarker";

// Fix Leaflet default marker icon issue
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })
  ._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// Custom icons
const createIcon = (color: string, emoji: string) =>
  L.divIcon({
    className: "custom-marker",
    html: `<div style="
      background: ${color};
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      border: 2px solid hsl(var(--background));
    ">${emoji}</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });

const originIcon = createIcon("hsl(var(--secondary))", "📍");
const destinationIcon = createIcon("hsl(var(--destructive))", "🏁");
const parcelIcon = createIcon("hsl(var(--primary))", "📦");
const transitIcon = createIcon("hsl(var(--accent))", "🚚");

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

// Component to animate the map view
function AnimatedView({
  center,
  zoom,
}: {
  center: [number, number];
  zoom: number;
}) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 1.5 });
  }, [center, zoom, map]);
  return null;
}

// Animated parcel marker that moves along the route
function FollowPosition({
  position,
  enabled,
}: {
  position: [number, number] | null;
  enabled: boolean;
}) {
  const map = useMap();
  useEffect(() => {
    if (!enabled || !position) return;
    map.panTo(position, { animate: true, duration: 0.9 });
  }, [enabled, map, position]);
  return null;
}

export default function TrackingMap({
  trackingId,
  scanEvents = [],
  currentStatus = "IN_TRANSIT",
  showAnimation = true,
}: TrackingMapProps) {
  const [isAnimating, setIsAnimating] = useState(showAnimation);
  const { t } = useTranslation();
  const { resolvedTheme } = useTheme();

  // Keep resolvedTheme referenced (map tiles are handled in CameroonMap)
  void resolvedTheme;

  // Convert scan events to positions
  const eventPositions: [number, number][] = useMemo(() => {
    return scanEvents
      .filter((e) => e.latitude && e.longitude)
      .map((e) => [e.latitude!, e.longitude!] as [number, number]);
  }, [scanEvents]);

  // Route MUST come only from ScanEvents GPS points
  const fullRoute: [number, number][] = useMemo(() => {
    return eventPositions;
  }, [eventPositions]);

  // Calculate map center
  const mapCenter: [number, number] = useMemo(() => {
    if (fullRoute.length > 0) {
      const lats = fullRoute.map((p) => p[0]);
      const lngs = fullRoute.map((p) => p[1]);
      return [
        (Math.min(...lats) + Math.max(...lats)) / 2,
        (Math.min(...lngs) + Math.max(...lngs)) / 2,
      ];
    }
    // Default to Cameroon center
    return [7.3697, 12.3547];
  }, [fullRoute]);

  // Calculate appropriate zoom level
  const mapZoom = useMemo(() => {
    if (fullRoute.length < 2) return 10;
    const lats = fullRoute.map((p) => p[0]);
    const lngs = fullRoute.map((p) => p[1]);
    const latDiff = Math.max(...lats) - Math.min(...lats);
    const lngDiff = Math.max(...lngs) - Math.min(...lngs);
    const maxDiff = Math.max(latDiff, lngDiff);
    if (maxDiff > 5) return 6;
    if (maxDiff > 2) return 7;
    if (maxDiff > 1) return 8;
    if (maxDiff > 0.5) return 10;
    return 12;
  }, [fullRoute]);

  // Get last known position for current parcel location
  const currentPosition: [number, number] | null = useMemo(() => {
    if (eventPositions.length > 0) {
      return eventPositions[eventPositions.length - 1];
    }
    return null;
  }, [eventPositions]);

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

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Navigation className="w-5 h-5" />
            {t("trackingMap.title")}
            {trackingId && ` - ${trackingId}`}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant={isAnimating ? "default" : "outline"}
              size="sm"
              onClick={() => setIsAnimating(!isAnimating)}
            >
              {isAnimating ? t("trackingMap.pause") : t("trackingMap.animate")}
            </Button>
            <Badge variant="secondary">
              {t("trackingMap.checkpoints", { count: scanEvents.length })}
            </Badge>
          </div>
        </div>
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
          >
            <AnimatedView center={mapCenter} zoom={mapZoom} />
            <FollowPosition position={currentPosition} enabled={isAnimating} />

            {/* Route line */}
            {fullRoute.length >= 2 && (
              <Polyline
                positions={fullRoute}
                color="hsl(var(--primary))"
                weight={4}
                opacity={0.7}
                dashArray="10, 10"
              />
            )}

            {/* Origin marker */}
            {fullRoute.length > 0 && (
              <Marker position={fullRoute[0]} icon={originIcon}>
                <Popup>
                  <div className="text-center">
                    <strong>📍 {t("trackingMap.origin", "Origin")}</strong>
                  </div>
                </Popup>
              </Marker>
            )}

            {/* Destination marker */}
            {fullRoute.length > 1 && (
              <Marker
                position={fullRoute[fullRoute.length - 1]}
                icon={destinationIcon}
              >
                <Popup>
                  <div className="text-center">
                    <strong>
                      🏁 {t("trackingMap.destination", "Destination")}
                    </strong>
                  </div>
                </Popup>
              </Marker>
            )}

            {/* Transit checkpoints */}
            {scanEvents
              .filter((e) => e.latitude && e.longitude)
              .map((event, index) => (
                <Marker
                  key={event.id}
                  position={[event.latitude!, event.longitude!]}
                  icon={transitIcon}
                >
                  <Popup>
                    <div className="min-w-37.5">
                      <strong className="flex items-center gap-1">
                        <Package className="w-4 h-4" />
                        {t("trackingMap.checkpointLabel", {
                          index: index + 1,
                        })}
                      </strong>
                      <div className="mt-1 text-sm">
                        <p>{event.eventType}</p>
                        {event.agencyName && <p>📍 {event.agencyName}</p>}
                        <p className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {new Date(event.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}

            {/* Smooth current parcel position (real-time) */}
            {currentPosition && (
              <SmoothMarker
                position={currentPosition}
                icon={parcelIcon}
                enabled={isAnimating}
                durationMs={900}
              >
                <Popup>
                  <div className="text-center">
                    <strong>📦 {t("trackingMap.currentLocation")}</strong>
                    <br />
                    <Badge>{currentStatus}</Badge>
                  </div>
                </Popup>
              </SmoothMarker>
            )}
          </CameroonMap>

          {/* Legend */}
          <div className="absolute bottom-4 left-4 bg-popover/90 text-popover-foreground backdrop-blur-sm rounded-lg p-3 shadow-lg z-1000 text-xs border border-border">
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
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
