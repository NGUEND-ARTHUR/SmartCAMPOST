import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { agencyService } from "@/services/users/agencies.api";

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

type MarkerType = "parcel" | "courier" | "agency" | "location" | "pickup" | "delivery";

type MarkerItem = {
  id: string;
  position: [number, number];
  label?: string;
  type?: MarkerType;
  color?: string;
};

type TrackedParcelItem = {
  id: string;
  trackingRef: string;
  status?: string;
  senderCity?: string;
  recipientCity?: string;
};

// CLIENT uses /parcels/me; COURIER and AGENT use /map/couriers/me (which allows both roles)
const CLIENT_PARCEL_ROLES = new Set(["CLIENT"]);
const COURIER_MAP_ROLES = new Set(["COURIER", "AGENT"]);
const TRACKING_ROLES = new Set(["CLIENT", "COURIER", "AGENT"]);
const REFRESH_INTERVAL_MS = 30000;

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
  const selectedParcelIdRef = useRef(selectedParcelId);
  useEffect(() => { selectedParcelIdRef.current = selectedParcelId; }, [selectedParcelId]);
  const [selectedParcelMap, setSelectedParcelMap] =
    useState<ParcelMapResponse | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);

  const loadMapData = useCallback(
    async (opts?: { silent?: boolean }) => {
      const silent = opts?.silent ?? false;
      if (!silent) setLoading(true);
      setError(null);

      try {
        // ── Load agencies for all roles ──────────────────────────────────────
        let agencyMarkers: MarkerItem[] = [];
        try {
          const agencies = await agencyService.listAll();
          const agencyList = Array.isArray(agencies) ? agencies : [];
          for (const a of agencyList) {
            const coords = await geocodeCity(a.city, a.country || "Cameroon");
            if (coords) {
              agencyMarkers.push({
                id: `agency-${a.id}`,
                position: [coords.lat, coords.lng],
                label: `🏢 ${a.agencyName} (${a.city || ""})`,
                type: "agency",
                color: "#059669",
              });
            }
          }
        } catch { /* agencies optional */ }

        // ── CLIENT: list own parcels, show on map with GPS or city fallback ──
        if (CLIENT_PARCEL_ROLES.has(role)) {
          const myParcels = await parcelService.listMyParcels(0, 50);
          const allItems = myParcels.content ?? [];
          const items = allItems.filter((p) => p.status !== "DELIVERED" && p.status !== "PICKED_UP_AT_AGENCY" && p.status !== "CANCELLED");

          const currentSelected = selectedParcelIdRef.current;
          const selectedInList = items.some((p) => p.id === currentSelected);
          const candidateParcelId = selectedInList
            ? currentSelected
            : (items[0]?.id ?? "");

          // Build markers directly from parcel data (fast — no extra API calls)
          const parcelMarkers: MarkerItem[] = [];
          for (const p of items.slice(0, 20)) {
            const lat = p.currentLatitude;
            const lng = p.currentLongitude;
            if (typeof lat === "number" && typeof lng === "number") {
              parcelMarkers.push({
                id: p.id,
                position: [lat, lng],
                label: `📦 ${p.trackingRef} • ${p.status}`,
                type: "parcel",
              });
            } else if (p.senderCity) {
              const coords = await geocodeCity(p.senderCity);
              if (coords) {
                parcelMarkers.push({
                  id: p.id,
                  position: [coords.lat, coords.lng],
                  label: `📦 ${p.trackingRef} • ${p.status} (${p.senderCity})`,
                  type: "parcel",
                });
              }
            }
          }

          setMarkers([...agencyMarkers, ...parcelMarkers]);
          setTrackedParcels(
            items.map((p) => ({
              id: p.id,
              trackingRef: p.trackingRef,
              status: p.status,
              senderCity: p.senderCity,
              recipientCity: p.recipientCity,
            })),
          );

          // Load detailed map for selected parcel
          let selectedMap: ParcelMapResponse | null = null;
          if (candidateParcelId) {
            try {
              selectedMap = await mapService.getParcelMap(candidateParcelId);
            } catch { /* detail map optional */ }
          }
          setSelectedParcelId(candidateParcelId);
          setSelectedParcelMap(selectedMap);
          setLastUpdatedAt(new Date());
          return;
        }

        // ── COURIER / AGENT: use dedicated /map/couriers/me endpoint ─────────
        if (COURIER_MAP_ROLES.has(role)) {
          const courierData = await mapService.getCourierMap();

          const locationMarkers: MarkerItem[] = (courierData.locations ?? [])
            .filter(
              (l) =>
                typeof l.latitude === "number" &&
                typeof l.longitude === "number",
            )
            .slice(0, 100)
            .map((l, i) => ({
              id: `loc-${l.id ?? i}`,
              position: [l.latitude as number, l.longitude as number],
              label: l.address ?? t("roleMap.myLocation"),
            }));

          const parcelMarkers: MarkerItem[] = (
            courierData.activeParcels ?? []
          )
            .filter(
              (p) =>
                typeof p.currentLatitude === "number" &&
                typeof p.currentLongitude === "number",
            )
            .map((p) => ({
              id: `parcel-${p.id}`,
              position: [
                p.currentLatitude as number,
                p.currentLongitude as number,
              ],
              label: `📦 ${p.trackingRef ?? p.id} • ${p.status ?? "UNKNOWN"}`,
            }));

          setMarkers([...agencyMarkers, ...locationMarkers, ...parcelMarkers]);
          setTrackedParcels([]);
          setSelectedParcelMap(null);
          setSelectedParcelId("");
          setLastUpdatedAt(new Date());
          return;
        }

        // ── ADMIN / STAFF: full overview map ─────────────────────────────────
        if (role === "ADMIN" || role === "STAFF") {
          const adminData = await mapService.getAdminOverview();
          const recentLocationMarkers: MarkerItem[] = (
            adminData.recentLocations ?? []
          )
            .filter(
              (r) =>
                typeof r.latitude === "number" &&
                typeof r.longitude === "number",
            )
            .slice(0, 150)
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
            .slice(0, 200)
            .map((p) => ({
              id: `parcel-${p.id}`,
              position:
                typeof p.currentLatitude === "number" &&
                typeof p.currentLongitude === "number"
                  ? [p.currentLatitude, p.currentLongitude]
                  : [
                      p.creationLatitude as number,
                      p.creationLongitude as number,
                    ],
              label: `${p.trackingRef ?? p.id} • ${p.status ?? "UNKNOWN"}`,
            }));

          setMarkers([...agencyMarkers, ...recentLocationMarkers, ...parcelMarkers]);
          setTrackedParcels([]);
          setSelectedParcelMap(null);
          setSelectedParcelId("");
          setLastUpdatedAt(new Date());
          return;
        }

        // ── FINANCE / RISK / other: show empty map (no tracking data access) ──
        setMarkers([]);
        setTrackedParcels([]);
        setSelectedParcelMap(null);
        setSelectedParcelId("");
        setLastUpdatedAt(new Date());
      } catch (e) {
        setError(e instanceof Error ? e.message : t("roleMap.loadFailed"));
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [role, t],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadMapData();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadMapData]);

  useEffect(() => {
    const timer = setInterval(() => {
      void loadMapData({ silent: true });
    }, REFRESH_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [loadMapData]);

  // SSE: live GPS updates for client's parcels
  // Use a stable key (comma-joined IDs) so SSE only reconnects when the actual parcel set changes
  const trackedIds = useMemo(
    () => trackedParcels.map((p) => p.id).sort().join(","),
    [trackedParcels],
  );

  useEffect(() => {
    if (role !== "CLIENT" || trackedParcels.length === 0) return;

    const sseConnections: EventSource[] = [];
    const base = (import.meta.env.VITE_API_URL as string | undefined) || "http://localhost:8082/api";
    const normalizedBase = base.replace(/\/+$/, "");

    for (const parcel of trackedParcels.slice(0, 5)) {
      const url = `${normalizedBase}/stream/tracking/${encodeURIComponent(parcel.trackingRef)}`;
      const es = new EventSource(url);

      es.addEventListener("gps-update", (event: MessageEvent) => {
        try {
          const payload = JSON.parse(event.data);
          const inherited = payload.inheritedParcels || [];
          const match = inherited.find((p: any) => p.trackingRef === parcel.trackingRef);
          if (match?.latitude && match?.longitude) {
            setMarkers((prev) =>
              prev.map((m) =>
                m.id === parcel.id
                  ? { ...m, position: [match.latitude, match.longitude], label: `📦 ${parcel.trackingRef} • LIVE` }
                  : m
              )
            );
          }
        } catch { /* ignore parse errors */ }
      });

      sseConnections.push(es);
    }

    return () => sseConnections.forEach((es) => es.close());
  }, [role, trackedIds]);

  // Load detailed tracking map when user selects a different parcel
  useEffect(() => {
    if (!selectedParcelId || role !== "CLIENT") return;
    let cancelled = false;
    mapService.getParcelMap(selectedParcelId)
      .then((data) => { if (!cancelled) setSelectedParcelMap(data); })
      .catch(() => { if (!cancelled) setSelectedParcelMap(null); });
    return () => { cancelled = true; };
  }, [selectedParcelId, role]);

  const title = useMemo(() => {
    if (role === "COURIER") return t("roleMap.title.courier");
    if (role === "AGENT") return t("roleMap.title.agent");
    if (role === "CLIENT") return t("roleMap.title.client");
    return t("roleMap.title.admin");
  }, [role, t]);

  const canTrackParcels = CLIENT_PARCEL_ROLES.has(role);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="text-sm text-muted-foreground">
            {role === "CLIENT"
              ? t("roleMap.subtitle.client")
              : role === "COURIER"
                ? t("roleMap.subtitle.courier")
                : role === "AGENT"
                  ? t("roleMap.subtitle.agent")
                  : t("roleMap.subtitle.admin")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => void loadMapData()}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            {t("common.refresh")}
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
        {t("roleMap.liveUpdates", {
          seconds: Math.round(REFRESH_INTERVAL_MS / 1000),
        })}
        {lastUpdatedAt
          ? ` • Last refresh ${lastUpdatedAt.toLocaleTimeString()}`
          : ""}
      </div>

      {canTrackParcels && trackedParcels.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {t("roleMap.trackedParcels")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <label className="flex flex-col gap-2 text-sm">
              <span className="text-muted-foreground">
                {t("roleMap.selectParcel")}
              </span>
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
                {t("roleMap.locationMap")}
              </CardTitle>
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" />Parcels</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" />Agencies</span>
                  {(role === "ADMIN" || role === "STAFF" || role === "COURIER") && (
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-violet-500" />Couriers</span>
                  )}
                </div>
                <Badge variant="secondary">{markers.length} markers</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <LeafletMap markers={markers} height="62vh" showSearch />
              {markers.length === 0 && (
                <div className="text-sm text-muted-foreground text-center">
                  {t("roleMap.noGpsData")}
                </div>
              )}
            </CardContent>
          </Card>

          {selectedParcelMap && canTrackParcels && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Navigation className="h-5 w-5" />
                  {t("roleMap.detailedRoute")}
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
