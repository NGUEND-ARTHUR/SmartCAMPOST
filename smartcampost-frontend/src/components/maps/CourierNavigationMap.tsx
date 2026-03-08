/**
 * Courier Navigation Map Component
 * Shows courier's current location and navigation to pickup/delivery points
 * with route optimization and turn-by-turn guidance.
 * Powered by MapLibre GL JS with vector tiles and 3D support.
 */
import { useEffect, useMemo, useState, useCallback } from "react";
import { Marker, Popup, Source, Layer, useMap } from "react-map-gl/maplibre";
import {
  Navigation,
  MapPin,
  Package,
  Clock,
  Phone,
  User,
  Loader2,
  LocateFixed,
  Route,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { CameroonMap } from "@/components/maps/core/CameroonMap";
import { LAYER_COLORS } from "@/components/maps/core/mapStyles";

/* Reusable marker icon (replaces L.divIcon) */
function NavMarkerIcon({
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
      className={`flex items-center justify-center w-10 h-10 text-xl rounded-full border-2 border-background shadow-lg cursor-pointer ${bgClass} ${pulse ? "animate-pulse" : ""}`}
    >
      {emoji}
    </div>
  );
}

interface Location {
  lat: number;
  lng: number;
  address?: string;
}

interface Stop {
  id: string;
  type: "PICKUP" | "DELIVERY";
  location: Location;
  parcelId: string;
  trackingCode: string;
  clientName: string;
  clientPhone: string;
  estimatedTime?: string;
  priority?: number;
}

interface CourierNavigationMapProps {
  stops: Stop[];
  courierLocation?: Location;
  onStopComplete?: (stopId: string) => void;
  onNavigate?: (stop: Stop) => void;
}

// Component to center map on courier
function CenterOnCourier({ position }: { position: [number, number] }) {
  const { current: map } = useMap();
  useEffect(() => {
    if (!map) return;
    map.easeTo({
      center: [position[1], position[0]],
      duration: 900,
    });
  }, [position, map]);
  return null;
}

/* GeoJSON circle helper (approximate, for radius in meters) */
function circleGeoJSON(
  center: [number, number],
  radiusMeters: number,
  points = 64,
): GeoJSON.Feature<GeoJSON.Polygon> {
  const [lat, lon] = center;
  const km = radiusMeters / 1000;
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

/* Route line helper */
function routeGeoJSON(
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

// Haversine distance calculation
function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Simple route optimization using nearest neighbor algorithm
function optimizeRoute(
  start: Location,
  stops: Stop[],
): { optimizedStops: Stop[]; totalDistance: number } {
  if (stops.length === 0) return { optimizedStops: [], totalDistance: 0 };

  const remaining = [...stops];
  const optimized: Stop[] = [];
  let current = start;
  let totalDistance = 0;

  while (remaining.length > 0) {
    // Find nearest stop
    let nearestIndex = 0;
    let nearestDistance = Infinity;

    remaining.forEach((stop, index) => {
      const distance = calculateDistance(
        current.lat,
        current.lng,
        stop.location.lat,
        stop.location.lng,
      );
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    });

    const nearest = remaining.splice(nearestIndex, 1)[0];
    optimized.push(nearest);
    totalDistance += nearestDistance;
    current = nearest.location;
  }

  return { optimizedStops: optimized, totalDistance };
}

export default function CourierNavigationMap({
  stops,
  courierLocation,
  onStopComplete,
  onNavigate,
}: CourierNavigationMapProps) {
  const { t } = useTranslation();
  const [currentLocation, setCurrentLocation] = useState<Location | null>(
    courierLocation || null,
  );
  const [isLocating, setIsLocating] = useState(false);
  const [selectedStop, setSelectedStop] = useState<Stop | null>(null);
  const [showOptimizedRoute, setShowOptimizedRoute] = useState(true);

  // Get current position using Geolocation API
  const getCurrentLocation = useCallback(() => {
    setIsLocating(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setIsLocating(false);
        },
        (error) => {
          console.error("Geolocation error:", error);
          setIsLocating(false);
          // Fallback to Douala center
          setCurrentLocation({ lat: 4.0511, lng: 9.7679 });
        },
        { enableHighAccuracy: true, timeout: 10000 },
      );
    } else {
      setIsLocating(false);
      setCurrentLocation({ lat: 4.0511, lng: 9.7679 });
    }
  }, []);

  // Get location on mount
  useEffect(() => {
    if (!currentLocation) {
      const id = window.setTimeout(() => getCurrentLocation(), 0);
      return () => window.clearTimeout(id);
    }
    return undefined;
  }, [currentLocation, getCurrentLocation]);

  // Optimize route
  const { optimizedStops, totalDistance } = useMemo(() => {
    if (!currentLocation || stops.length === 0) {
      return { optimizedStops: stops, totalDistance: 0 };
    }
    return optimizeRoute(currentLocation, stops);
  }, [currentLocation, stops]);

  // Build route polyline
  const routePositions: [number, number][] = useMemo(() => {
    const positions: [number, number][] = [];

    if (currentLocation) {
      positions.push([currentLocation.lat, currentLocation.lng]);
    }

    const stopsToUse = showOptimizedRoute ? optimizedStops : stops;
    stopsToUse.forEach((stop) => {
      positions.push([stop.location.lat, stop.location.lng]);
    });

    return positions;
  }, [currentLocation, optimizedStops, stops, showOptimizedRoute]);

  // Calculate map center and bounds
  const { mapCenter, mapZoom } = useMemo(() => {
    const allPositions = routePositions.length > 0 ? routePositions : [];

    if (allPositions.length === 0) {
      return { mapCenter: [4.0511, 9.7679] as [number, number], mapZoom: 12 };
    }

    const lats = allPositions.map((p) => p[0]);
    const lngs = allPositions.map((p) => p[1]);
    const center: [number, number] = [
      (Math.min(...lats) + Math.max(...lats)) / 2,
      (Math.min(...lngs) + Math.max(...lngs)) / 2,
    ];

    const latDiff = Math.max(...lats) - Math.min(...lats);
    const lngDiff = Math.max(...lngs) - Math.min(...lngs);
    const maxDiff = Math.max(latDiff, lngDiff);

    let zoom = 13;
    if (maxDiff > 0.5) zoom = 10;
    else if (maxDiff > 0.2) zoom = 11;
    else if (maxDiff > 0.1) zoom = 12;

    return { mapCenter: center, mapZoom: zoom };
  }, [routePositions]);

  // Calculate ETA (assuming 30 km/h average speed)
  const estimatedTime = useMemo(() => {
    const hours = totalDistance / 30;
    const minutes = Math.round(hours * 60);
    if (minutes < 60) return t("courierNavMap.etaMinutes", { count: minutes });
    return t("courierNavMap.etaHoursMinutes", {
      hours: Math.floor(hours),
      minutes: minutes % 60,
    });
  }, [totalDistance, t]);

  const stopTypeLabel = useCallback(
    (type: Stop["type"]) =>
      type === "PICKUP"
        ? t("courierNavMap.stopTypes.pickup")
        : t("courierNavMap.stopTypes.delivery"),
    [t],
  );

  return (
    <div className="space-y-4">
      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                {t("courierNavMap.stats.totalStops")}
              </p>
              <p className="text-xl font-bold">{stops.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <MapPin className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                {t("courierNavMap.stats.pickups")}
              </p>
              <p className="text-xl font-bold">
                {stops.filter((s) => s.type === "PICKUP").length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <Navigation className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                {t("courierNavMap.stats.deliveries")}
              </p>
              <p className="text-xl font-bold">
                {stops.filter((s) => s.type === "DELIVERY").length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                {t("courierNavMap.stats.estimatedTime")}
              </p>
              <p className="text-xl font-bold">{estimatedTime}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Map */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="flex items-center gap-2">
              <Route className="w-5 h-5" />
              {t("courierNavMap.title")}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={getCurrentLocation}
                disabled={isLocating}
              >
                {isLocating ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-1" />
                ) : (
                  <LocateFixed className="w-4 h-4 mr-1" />
                )}
                {t("courierNavMap.myLocation")}
              </Button>
              <Button
                variant={showOptimizedRoute ? "default" : "outline"}
                size="sm"
                onClick={() => setShowOptimizedRoute(!showOptimizedRoute)}
              >
                {showOptimizedRoute
                  ? t("courierNavMap.aiOptimized")
                  : t("courierNavMap.originalOrder")}
              </Button>
              <Badge variant="secondary">
                {t("courierNavMap.totalDistance", {
                  distance: totalDistance.toFixed(1),
                })}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="h-125 relative">
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
              {currentLocation && (
                <CenterOnCourier
                  position={[currentLocation.lat, currentLocation.lng]}
                />
              )}

              {/* Route polyline via GeoJSON */}
              {routePositions.length >= 2 && (
                <Source
                  id="courier-route"
                  type="geojson"
                  data={routeGeoJSON(routePositions)}
                >
                  <Layer
                    id="courier-route-line"
                    type="line"
                    paint={{
                      "line-color": showOptimizedRoute
                        ? LAYER_COLORS.secondary
                        : LAYER_COLORS.primary,
                      "line-width": 4,
                      "line-opacity": 0.8,
                    }}
                    layout={{ "line-cap": "round", "line-join": "round" }}
                  />
                </Source>
              )}

              {/* Courier location radius circle */}
              {currentLocation && (
                <Source
                  id="courier-radius"
                  type="geojson"
                  data={circleGeoJSON(
                    [currentLocation.lat, currentLocation.lng],
                    100,
                  )}
                >
                  <Layer
                    id="courier-radius-fill"
                    type="fill"
                    paint={{
                      "fill-color": LAYER_COLORS.primary,
                      "fill-opacity": 0.15,
                    }}
                  />
                  <Layer
                    id="courier-radius-stroke"
                    type="line"
                    paint={{
                      "line-color": LAYER_COLORS.primary,
                      "line-width": 2,
                      "line-opacity": 0.5,
                    }}
                  />
                </Source>
              )}

              {/* Courier marker */}
              {currentLocation && (
                <Marker
                  longitude={currentLocation.lng}
                  latitude={currentLocation.lat}
                  anchor="center"
                >
                  <NavMarkerIcon bgClass="bg-primary" emoji="🚴" pulse />
                </Marker>
              )}

              {/* Stop markers */}
              {(showOptimizedRoute ? optimizedStops : stops).map(
                (stop, index) => (
                  <Marker
                    key={stop.id}
                    longitude={stop.location.lng}
                    latitude={stop.location.lat}
                    anchor="center"
                    onClick={(e) => {
                      e.originalEvent.stopPropagation();
                      setSelectedStop(stop);
                    }}
                  >
                    <NavMarkerIcon
                      bgClass={
                        stop.type === "PICKUP"
                          ? "bg-secondary"
                          : "bg-destructive"
                      }
                      emoji={stop.type === "PICKUP" ? "📦" : "🏠"}
                    />
                  </Marker>
                ),
              )}

              {/* Selected stop popup */}
              {selectedStop && (
                <Popup
                  longitude={selectedStop.location.lng}
                  latitude={selectedStop.location.lat}
                  onClose={() => setSelectedStop(null)}
                  closeOnClick={false}
                  anchor="bottom"
                >
                  <div className="min-w-50">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge
                        variant="secondary"
                        className={
                          selectedStop.type === "PICKUP"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }
                      >
                        #
                        {(showOptimizedRoute ? optimizedStops : stops).indexOf(
                          selectedStop,
                        ) + 1}{" "}
                        - {stopTypeLabel(selectedStop.type)}
                      </Badge>
                    </div>
                    <p className="font-semibold">{selectedStop.trackingCode}</p>
                    <div className="mt-2 space-y-1 text-sm">
                      <p className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {selectedStop.clientName}
                      </p>
                      <p className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {selectedStop.clientPhone}
                      </p>
                      {selectedStop.location.address && (
                        <p className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {selectedStop.location.address}
                        </p>
                      )}
                    </div>
                    <div className="mt-3 flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => onNavigate?.(selectedStop)}
                      >
                        <Navigation className="w-3 h-3 mr-1" />
                        {t("courierNavMap.navigate")}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => onStopComplete?.(selectedStop.id)}
                      >
                        ✓ {t("courierNavMap.complete")}
                      </Button>
                    </div>
                  </div>
                </Popup>
              )}
            </CameroonMap>
          </div>
        </CardContent>
      </Card>

      {/* Stop List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {showOptimizedRoute
              ? t("courierNavMap.optimizedRouteOrder")
              : t("courierNavMap.stopsList")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {(showOptimizedRoute ? optimizedStops : stops).map(
              (stop, index) => (
                <div
                  key={stop.id}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    selectedStop?.id === stop.id
                      ? "border-primary bg-accent"
                      : "border-border hover:bg-accent"
                  } cursor-pointer transition-colors`}
                  onClick={() => setSelectedStop(stop)}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                        stop.type === "PICKUP" ? "bg-green-500" : "bg-red-500"
                      }`}
                    >
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{stop.trackingCode}</p>
                      <p className="text-sm text-muted-foreground">
                        {stop.clientName} • {stopTypeLabel(stop.type)}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      onNavigate?.(stop);
                    }}
                  >
                    <Navigation className="w-4 h-4" />
                  </Button>
                </div>
              ),
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
