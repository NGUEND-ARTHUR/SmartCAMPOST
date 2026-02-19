import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, MapPin, Navigation, RefreshCw } from "lucide-react";
import LeafletMap from "@/components/maps/LeafletMap";
import TrackingMap from "@/components/maps/TrackingMap";
import { useAuthStore } from "@/store/authStore";
import { parcelService } from "@/services/parcels";
import { mapService, ParcelMapResponse } from "@/services/maps";
import { geolocationService } from "@/services/common/geolocation.api";

// Simple city geocoding cache to avoid repeated API calls
const CITY_GEOCODE_CACHE: Record<string, { lat: number; lng: number }> = {
  // Cameroon major cities
  douala: { lat: 4.0511, lng: 9.7679 },
  yaounde: { lat: 3.8667, lng: 11.5167 },
  yaoundé: { lat: 3.8667, lng: 11.5167 },
  bafoussam: { lat: 5.4767, lng: 10.4178 },
  garoua: { lat: 9.3, lng: 13.4 },
  maroua: { lat: 10.5908, lng: 14.3158 },
  bamenda: { lat: 5.9597, lng: 10.1494 },
  ngaoundere: { lat: 7.3167, lng: 13.5833 },
  ngaoundéré: { lat: 7.3167, lng: 13.5833 },
  bertoua: { lat: 4.5767, lng: 13.6844 },
  limbe: { lat: 4.0167, lng: 9.2 },
  ebolowa: { lat: 2.9, lng: 11.15 },
  kribi: { lat: 2.9394, lng: 9.9089 },
  buea: { lat: 4.1561, lng: 9.2325 },
};

async function geocodeCity(
  city?: string,
  country: string = "Cameroon",
): Promise<{ lat: number; lng: number } | null> {
  if (!city) return null;

  const key = city.toLowerCase().trim();
  if (CITY_GEOCODE_CACHE[key]) {
    return CITY_GEOCODE_CACHE[key];
  }

  try {
    const result = await geolocationService.geocode({
      address: "",
      city,
      country,
    });
    const coords = { lat: result.latitude, lng: result.longitude };
    CITY_GEOCODE_CACHE[key] = coords;
    return coords;
  } catch {
    // Fallback to Douala coordinates
    return { lat: 4.0511, lng: 9.7679 };
  }
}

type MarkerItem = {
  id: string;
  position: [number, number];
  label?: string;
};

type TrackedParcelItem = {
  id: string;
  trackingRef: string;
  status?: string;
  senderCity?: string;
  recipientCity?: string;
};

const TRACKING_ROLES = new Set(["CLIENT", "COURIER", "AGENT"]);
const REFRESH_INTERVAL_MS = 15000;

async function extractParcelMarker(
  parcelMap: ParcelMapResponse,
  fallbackData?: { senderCity?: string; recipientCity?: string },
): Promise<MarkerItem | null> {
  // 1. Try current location (most recent GPS data)
  const lat = parcelMap.currentLocation?.latitude;
  const lng = parcelMap.currentLocation?.longitude;
  if (typeof lat === "number" && typeof lng === "number") {
    return {
      id: parcelMap.parcelId,
      position: [lat, lng],
      label: `📦 ${parcelMap.trackingNumber ?? parcelMap.parcelId} • ${parcelMap.status ?? "UNKNOWN"}`,
    };
  }

  // 2. Try most recent scan event with GPS
  const timeline = parcelMap.timeline ?? [];
  const withGps = [...timeline]
    .reverse()
    .find(
      (e) => typeof e.latitude === "number" && typeof e.longitude === "number",
    );
  if (withGps) {
    return {
      id: parcelMap.parcelId,
      position: [withGps.latitude as number, withGps.longitude as number],
      label: `📍 ${parcelMap.trackingNumber ?? parcelMap.parcelId} • ${parcelMap.status ?? "UNKNOWN"}`,
    };
  }

  // 3. Fallback to geocoding sender city if available
  if (fallbackData?.senderCity) {
    const cityCoords = await geocodeCity(fallbackData.senderCity, "Cameroon");
    if (cityCoords) {
      return {
        id: parcelMap.parcelId,
        position: [cityCoords.lat, cityCoords.lng],
        label: `📦 ${parcelMap.trackingNumber ?? parcelMap.parcelId} • ${parcelMap.status ?? "UNKNOWN"} (${fallbackData.senderCity})`,
      };
    }
  }

  // 4. Default to Douala (major logistics hub) if no location data available
  return {
    id: parcelMap.parcelId,
    position: [4.0511, 9.7679], // Douala coordinates
    label: `📦 ${parcelMap.trackingNumber ?? parcelMap.parcelId} • ${parcelMap.status ?? "UNKNOWN"} (Pending GPS)`,
  };
}

export default function RoleMapDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const role = (user?.role ?? "").toUpperCase();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markers, setMarkers] = useState<MarkerItem[]>([]);
  const [trackedParcels, setTrackedParcels] = useState<TrackedParcelItem[]>([]);
  const [selectedParcelId, setSelectedParcelId] = useState<string>("");
  const [selectedParcelMap, setSelectedParcelMap] =
    useState<ParcelMapResponse | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);

  const loadMapData = useCallback(
    async (opts?: { silent?: boolean }) => {
      const silent = opts?.silent ?? false;
      if (!silent) setLoading(true);
      setError(null);

      try {
        if (TRACKING_ROLES.has(role)) {
          const myParcels = await parcelService.listMyParcels(0, 50);
          const items = myParcels.content ?? [];

          const activeStatuses = new Set([
            "ACCEPTED",
            "TAKEN_IN_CHARGE",
            "IN_TRANSIT",
            "ARRIVED_HUB",
            "ARRIVED_DEST_AGENCY",
            "OUT_FOR_DELIVERY",
            "RETURNED_TO_SENDER",
          ]);

          const filtered =
            role === "COURIER" || role === "AGENT"
              ? items.filter((p) =>
                  activeStatuses.has((p.status ?? "").toUpperCase()),
                )
              : items;

          const selectedInList = filtered.some(
            (p) => p.id === selectedParcelId,
          );
          const candidateParcelId = selectedInList
            ? selectedParcelId
            : (filtered[0]?.id ?? "");

          const mapResults = await Promise.allSettled(
            filtered.slice(0, 20).map((p) => mapService.getParcelMap(p.id)),
          );
          const resolved = mapResults
            .filter(
              (r): r is PromiseFulfilledResult<ParcelMapResponse> =>
                r.status === "fulfilled",
            )
            .map((r) => r.value);

          const mapMarkers = (
            await Promise.all(
              resolved.map(async (parcelMap) => {
                const parcel = filtered.find(
                  (p) => p.id === parcelMap.parcelId,
                );
                return await extractParcelMarker(parcelMap, {
                  senderCity: parcel?.senderCity,
                  recipientCity: parcel?.recipientCity,
                });
              }),
            )
          ).filter((m): m is MarkerItem => m !== null);

          setMarkers(mapMarkers);
          setTrackedParcels(
            filtered.map((p) => ({
              id: p.id,
              trackingRef: p.trackingRef,
              status: p.status,
              senderCity: p.senderCity,
              recipientCity: p.recipientCity,
            })),
          );

          const selectedMap = candidateParcelId
            ? (resolved.find((p) => p.parcelId === candidateParcelId) ?? null)
            : null;
          setSelectedParcelId(candidateParcelId);
          setSelectedParcelMap(selectedMap);
          setLastUpdatedAt(new Date());
          return;
        }

        const adminData = await mapService.getAdminOverview();
        const recentLocationMarkers: MarkerItem[] = (
          adminData.recentLocations ?? []
        )
          .filter(
            (r) =>
              typeof r.latitude === "number" && typeof r.longitude === "number",
          )
          .slice(0, 250)
          .map((r) => ({
            id: `loc-${r.id}`,
            position: [r.latitude as number, r.longitude as number],
            label: `${r.address ?? "Recent location"}`,
          }));

        const parcelMarkers: MarkerItem[] = (adminData.activeParcels ?? [])
          .filter(
            (p) =>
              (typeof p.currentLatitude === "number" &&
                typeof p.currentLongitude === "number") ||
              (typeof p.creationLatitude === "number" &&
                typeof p.creationLongitude === "number"),
          )
          .slice(0, 300)
          .map((p) => ({
            id: `parcel-${p.id}`,
            position:
              typeof p.currentLatitude === "number" &&
              typeof p.currentLongitude === "number"
                ? [p.currentLatitude, p.currentLongitude]
                : [p.creationLatitude as number, p.creationLongitude as number],
            label: `${p.trackingRef ?? p.id} • ${p.status ?? "UNKNOWN"}`,
          }));

        setMarkers([...recentLocationMarkers, ...parcelMarkers]);
        setTrackedParcels([]);
        setSelectedParcelMap(null);
        setSelectedParcelId("");
        setLastUpdatedAt(new Date());
      } catch (e: any) {
        setError(e?.message ?? "Failed to load map data");
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [role, selectedParcelId],
  );

  useEffect(() => {
    void loadMapData();
  }, [loadMapData]);

  useEffect(() => {
    const timer = setInterval(() => {
      void loadMapData({ silent: true });
    }, REFRESH_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [loadMapData]);

  const title = useMemo(() => {
    if (role === "COURIER") return "Courier Live Map";
    if (role === "AGENT") return "Agent Parcel Tracking";
    if (role === "CLIENT") return "My Parcel Locations";
    return "Operations Map Overview";
  }, [role]);

  const canTrackParcels = TRACKING_ROLES.has(role);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="text-sm text-muted-foreground">
            {role === "CLIENT"
              ? "Track your parcel locations from real scan GPS events."
              : role === "COURIER"
                ? "View active delivery parcel positions and tracking events."
                : role === "AGENT"
                  ? "Track accepted and in-transit parcels from live GPS scan updates."
                  : "Monitor fleet and parcel location activity across the platform."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => void loadMapData()}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          {role === "CLIENT" && (
            <Button
              variant="outline"
              onClick={() => navigate("/client/tracking")}
            >
              {t("nav.tracking")}
            </Button>
          )}
        </div>
      </div>

      <div className="text-xs text-muted-foreground">
        Live updates every {Math.round(REFRESH_INTERVAL_MS / 1000)}s
        {lastUpdatedAt
          ? ` • Last refresh ${lastUpdatedAt.toLocaleTimeString()}`
          : ""}
      </div>

      {canTrackParcels && trackedParcels.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tracked Parcels</CardTitle>
          </CardHeader>
          <CardContent>
            <label className="flex flex-col gap-2 text-sm">
              <span className="text-muted-foreground">Select parcel</span>
              <select
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={selectedParcelId}
                onChange={(e) => setSelectedParcelId(e.target.value)}
              >
                {trackedParcels.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.trackingRef} • {p.status ?? "UNKNOWN"}
                  </option>
                ))}
              </select>
            </label>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <Card>
          <CardContent className="pt-6 text-destructive">{error}</CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Location Map
              </CardTitle>
              <Badge variant="secondary">{markers.length} markers</Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              <LeafletMap markers={markers} height="62vh" />
              {markers.length === 0 && (
                <div className="text-sm text-muted-foreground text-center">
                  No GPS map data available yet. Scan events and geolocation
                  updates will appear here.
                </div>
              )}
            </CardContent>
          </Card>

          {selectedParcelMap && canTrackParcels && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Navigation className="h-5 w-5" />
                  Detailed Tracking Route
                </CardTitle>
              </CardHeader>
              <CardContent>
                <TrackingMap
                  trackingId={selectedParcelMap.trackingNumber}
                  currentStatus={selectedParcelMap.status}
                  scanEvents={(selectedParcelMap.timeline ?? []).map((e) => ({
                    id: e.id,
                    eventType: e.eventType,
                    timestamp: e.timestamp,
                    agencyName: e.agencyName,
                    location: e.locationNote,
                    latitude: e.latitude,
                    longitude: e.longitude,
                  }))}
                  showAnimation={false}
                />
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
