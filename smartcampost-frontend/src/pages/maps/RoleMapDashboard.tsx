import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader2, MapPin, Navigation, RefreshCw, Filter, Route } from "lucide-react";
import LeafletMap from "@/components/maps/LeafletMap";
import TrackingMap from "@/components/maps/TrackingMap";
import { useAuthStore } from "@/store/authStore";
import { parcelService } from "@/services/parcels";
import { mapService, ParcelMapResponse, RouteOptimizationResult } from "@/services/maps";
import { geolocationService } from "@/services/common/geolocation.api";
import { agencyService } from "@/services/users/agencies.api";
import { normalizeApiBase } from "@/lib/axiosClient";

const CITY_GEOCODE_CACHE: Record<string, { lat: number; lng: number }> = {
  douala: { lat: 4.0511, lng: 9.7679 },
  yaounde: { lat: 3.8667, lng: 11.5167 },
  "yaoundé": { lat: 3.8667, lng: 11.5167 },
  bafoussam: { lat: 5.4767, lng: 10.4178 },
  garoua: { lat: 9.3, lng: 13.4 },
  maroua: { lat: 10.5908, lng: 14.3158 },
  bamenda: { lat: 5.9597, lng: 10.1494 },
  ngaoundere: { lat: 7.3167, lng: 13.5833 },
  "ngaoundéré": { lat: 7.3167, lng: 13.5833 },
  bertoua: { lat: 4.5767, lng: 13.6844 },
  limbe: { lat: 4.0167, lng: 9.2 },
  ebolowa: { lat: 2.9, lng: 11.15 },
  kribi: { lat: 2.9394, lng: 9.9089 },
  buea: { lat: 4.1561, lng: 9.2325 },
};

async function geocodeCity(
  city?: string,
  country = "Cameroon",
): Promise<{ lat: number; lng: number } | null> {
  if (!city) return null;
  const key = city.toLowerCase().trim();
  if (CITY_GEOCODE_CACHE[key]) return CITY_GEOCODE_CACHE[key];
  try {
    const result = await geolocationService.geocode({ address: "", city, country });
    const coords = { lat: result.latitude, lng: result.longitude };
    CITY_GEOCODE_CACHE[key] = coords;
    return coords;
  } catch {
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
  status?: string;
};

type TrackedParcelItem = {
  id: string;
  trackingRef: string;
  status?: string;
  senderCity?: string;
  recipientCity?: string;
};

const CLIENT_PARCEL_ROLES = new Set(["CLIENT"]);
const COURIER_MAP_ROLES = new Set(["COURIER", "AGENT"]);
const REFRESH_INTERVAL_MS = 30000;

const STATUS_FILTERS = ["ALL", "CREATED", "IN_TRANSIT", "OUT_FOR_DELIVERY", "ARRIVED_DEST_AGENCY", "DELIVERED"] as const;

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
  const [selectedParcelMap, setSelectedParcelMap] = useState<ParcelMapResponse | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [routeResult, setRouteResult] = useState<RouteOptimizationResult | null>(null);
  const [routeError, setRouteError] = useState<string | null>(null);

  const loadMapData = useCallback(
    async (opts?: { silent?: boolean }) => {
      const silent = opts?.silent ?? false;
      if (!silent) setLoading(true);
      setError(null);

      try {
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

        // ── CLIENT ──
        if (CLIENT_PARCEL_ROLES.has(role)) {
          const myParcels = await parcelService.listMyParcels(0, 50);
          const allItems = myParcels.content ?? [];
          const items = allItems.filter((p) => p.status !== "DELIVERED" && p.status !== "PICKED_UP_AT_AGENCY" && p.status !== "CANCELLED");

          const currentSelected = selectedParcelIdRef.current;
          const selectedInList = items.some((p) => p.id === currentSelected);
          const candidateParcelId = selectedInList ? currentSelected : (items[0]?.id ?? "");

          const parcelMarkers: MarkerItem[] = [];
          for (const p of items.slice(0, 30)) {
            const lat = p.currentLatitude;
            const lng = p.currentLongitude;
            if (typeof lat === "number" && typeof lng === "number") {
              parcelMarkers.push({
                id: p.id, position: [lat, lng],
                label: `📦 ${p.trackingRef} • ${p.status}`,
                type: "parcel", status: p.status,
              });
            } else if (p.senderCity) {
              const coords = await geocodeCity(p.senderCity);
              if (coords) {
                parcelMarkers.push({
                  id: p.id, position: [coords.lat, coords.lng],
                  label: `📦 ${p.trackingRef} • ${p.status} (${p.senderCity})`,
                  type: "parcel", status: p.status,
                });
              }
            } else {
              // Fallback: use creation GPS or default to Douala
              const fallbackLat = (p as any).creationLatitude ?? 4.0511;
              const fallbackLng = (p as any).creationLongitude ?? 9.7679;
              parcelMarkers.push({
                id: p.id, position: [fallbackLat, fallbackLng],
                label: `📦 ${p.trackingRef} • ${p.status} (awaiting GPS)`,
                type: "parcel", status: p.status,
              });
            }
          }

          setMarkers([...agencyMarkers, ...parcelMarkers]);
          setTrackedParcels(items.map((p) => ({
            id: p.id, trackingRef: p.trackingRef, status: p.status,
            senderCity: p.senderCity, recipientCity: p.recipientCity,
          })));
          let selectedMap: ParcelMapResponse | null = null;
          if (candidateParcelId) {
            try { selectedMap = await mapService.getParcelMap(candidateParcelId); } catch { /* optional */ }
          }
          setSelectedParcelId(candidateParcelId);
          setSelectedParcelMap(selectedMap);
          setLastUpdatedAt(new Date());
          return;
        }

        // ── COURIER / AGENT ──
        if (COURIER_MAP_ROLES.has(role)) {
          const courierData = await mapService.getCourierMap();

          const locationMarkers: MarkerItem[] = (courierData.locations ?? [])
            .filter((l) => typeof l.latitude === "number" && typeof l.longitude === "number")
            .slice(0, 50)
            .map((l, i) => ({
              id: `loc-${l.id ?? i}`,
              position: [l.latitude as number, l.longitude as number],
              label: `📍 ${l.address || t("roleMap.myLocation")}`,
              type: "location" as MarkerType,
              color: "#7c3aed",
            }));

          const parcelMarkers: MarkerItem[] = (courierData.activeParcels ?? [])
            .filter((p) => typeof p.currentLatitude === "number" && typeof p.currentLongitude === "number")
            .map((p) => ({
              id: `parcel-${p.id}`,
              position: [p.currentLatitude as number, p.currentLongitude as number],
              label: `📦 ${p.trackingRef ?? p.id} • ${p.status ?? "UNKNOWN"}`,
              type: "parcel" as MarkerType,
              status: p.status,
            }));

          // Also show parcels without GPS via city fallback
          const myParcels = await parcelService.listMyParcels(0, 50);
          const noGpsParcels = (myParcels.content ?? [])
            .filter((p) => !p.currentLatitude && p.senderCity && p.status !== "DELIVERED" && p.status !== "CANCELLED");
          for (const p of noGpsParcels.slice(0, 20)) {
            if (parcelMarkers.some((m) => m.id === `parcel-${p.id}`)) continue;
            const coords = await geocodeCity(p.senderCity);
            if (coords) {
              parcelMarkers.push({
                id: `parcel-${p.id}`,
                position: [coords.lat, coords.lng],
                label: `📦 ${p.trackingRef} • ${p.status} (${p.senderCity})`,
                type: "parcel", status: p.status,
              });
            }
          }

          // Pickup stops — where to collect parcels from sender
          const pickupMarkers: MarkerItem[] = [];
          for (const stop of (courierData.pickupStops ?? [])) {
            let lat = stop.latitude;
            let lng = stop.longitude;
            if (!lat || !lng) {
              const c = await geocodeCity(stop.city, stop.country);
              if (c) { lat = c.lat; lng = c.lng; }
            }
            if (lat && lng) {
              pickupMarkers.push({
                id: `pickup-${stop.parcelId}`,
                position: [lat, lng],
                label: `🏠 COLLECT: ${stop.trackingRef ?? stop.parcelId}${stop.address ? ` (${stop.address})` : ""}`,
                type: "pickup",
                color: "#10b981",
                status: stop.status,
              });
            }
          }

          // Delivery stops — where to deposit parcels
          const deliveryMarkers: MarkerItem[] = [];
          for (const stop of (courierData.deliveryStops ?? [])) {
            let lat = stop.latitude;
            let lng = stop.longitude;
            if (!lat || !lng) {
              const c = await geocodeCity(stop.city, stop.country);
              if (c) { lat = c.lat; lng = c.lng; }
            }
            if (lat && lng) {
              deliveryMarkers.push({
                id: `delivery-${stop.parcelId}`,
                position: [lat, lng],
                label: `📬 DELIVER: ${stop.trackingRef ?? stop.parcelId}${stop.address ? ` (${stop.address})` : ""}`,
                type: "delivery",
                color: "#f97316",
                status: stop.status,
              });
            }
          }

          setMarkers([...agencyMarkers, ...locationMarkers, ...parcelMarkers, ...pickupMarkers, ...deliveryMarkers]);
          setTrackedParcels((myParcels.content ?? [])
            .filter((p) => p.status !== "DELIVERED" && p.status !== "CANCELLED")
            .map((p) => ({
              id: p.id, trackingRef: p.trackingRef, status: p.status,
              senderCity: p.senderCity, recipientCity: p.recipientCity,
            })));
          setSelectedParcelMap(null);
          setSelectedParcelId("");
          setLastUpdatedAt(new Date());
          return;
        }

        // ── ADMIN / STAFF ──
        if (role === "ADMIN" || role === "STAFF") {
          const adminData = await mapService.getAdminOverview();

          const recentLocationMarkers: MarkerItem[] = (adminData.recentLocations ?? [])
            .filter((r) => typeof r.latitude === "number" && typeof r.longitude === "number")
            .slice(0, 150)
            .map((r) => ({
              id: `loc-${r.id}`,
              position: [r.latitude as number, r.longitude as number],
              label: `📍 ${r.address ?? "GPS point"}`,
              type: "location" as MarkerType,
              color: "#7c3aed",
            }));

          const parcelMarkers: MarkerItem[] = (adminData.activeParcels ?? [])
            .filter((p) =>
              (typeof p.currentLatitude === "number" && typeof p.currentLongitude === "number") ||
              (typeof p.creationLatitude === "number" && typeof p.creationLongitude === "number"),
            )
            .slice(0, 300)
            .map((p) => ({
              id: `parcel-${p.id}`,
              position:
                typeof p.currentLatitude === "number" && typeof p.currentLongitude === "number"
                  ? [p.currentLatitude, p.currentLongitude] as [number, number]
                  : [p.creationLatitude as number, p.creationLongitude as number] as [number, number],
              label: `📦 ${p.trackingRef ?? p.id} • ${p.status ?? "UNKNOWN"}`,
              type: "parcel" as MarkerType,
              status: p.status,
            }));

          setMarkers([...agencyMarkers, ...recentLocationMarkers, ...parcelMarkers]);
          setTrackedParcels([]);
          setSelectedParcelMap(null);
          setSelectedParcelId("");
          setLastUpdatedAt(new Date());
          return;
        }

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

  const handleOptimizeRoute = useCallback(async () => {
    setIsOptimizing(true);
    setRouteError(null);
    setRouteResult(null);

    const stopMarkers = markers.filter((m) => m.type === "pickup" || m.type === "delivery");
    if (stopMarkers.length === 0) {
      setRouteError("No pickup or delivery stops to optimize.");
      setIsOptimizing(false);
      return;
    }

    const getPosition = (): Promise<GeolocationPosition> =>
      new Promise((res, rej) =>
        navigator.geolocation.getCurrentPosition(res, rej, { timeout: 10000 })
      );

    try {
      let currentLat = 4.0511;
      let currentLng = 9.7679;
      try {
        const pos = await getPosition();
        currentLat = pos.coords.latitude;
        currentLng = pos.coords.longitude;
      } catch { /* use default Douala coords */ }

      const stops = stopMarkers.map((m) => ({
        id: m.id,
        type: m.type === "pickup" ? ("PICKUP" as const) : ("DELIVERY" as const),
        latitude: m.position[0],
        longitude: m.position[1],
        address: m.label,
      }));

      const result = await mapService.optimizeRoute({
        currentLatitude: currentLat,
        currentLongitude: currentLng,
        stops,
        optimizationStrategy: "BALANCED",
      });
      setRouteResult(result);
    } catch (e) {
      setRouteError(e instanceof Error ? e.message : "Route optimization failed.");
    } finally {
      setIsOptimizing(false);
    }
  }, [markers]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadMapData(); }, 0);
    return () => window.clearTimeout(timer);
  }, [loadMapData]);

  useEffect(() => {
    const timer = setInterval(() => { void loadMapData({ silent: true }); }, REFRESH_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [loadMapData]);

  // SSE: live GPS updates — all roles that have parcels
  const trackedIds = useMemo(
    () => trackedParcels.map((p) => p.id).sort().join(","),
    [trackedParcels],
  );

  useEffect(() => {
    if (trackedParcels.length === 0 && role !== "ADMIN" && role !== "STAFF") return;

    const normalizedBase = normalizeApiBase(import.meta.env.VITE_API_URL as string | undefined);
    const sseConnections: EventSource[] = [];

    // Client/courier/agent: subscribe to individual parcel tracking streams
    // Backend emits event name "scan-event" with flat payload:
    // { trackingRef, latitude, longitude, parcelStatusAfter, eventType, ... }
    if (trackedParcels.length > 0) {
      for (const parcel of trackedParcels.slice(0, 8)) {
        const url = `${normalizedBase}/stream/tracking/${encodeURIComponent(parcel.trackingRef)}`;
        const es = new EventSource(url);
        es.addEventListener("scan-event", (event: MessageEvent) => {
          try {
            const payload = JSON.parse(event.data);
            if (payload.trackingRef !== parcel.trackingRef) return;
            if (!payload.latitude || !payload.longitude) return;
            const newStatus: string = payload.parcelStatusAfter || parcel.status || "IN_TRANSIT";
            setMarkers((prev) =>
              prev.map((m) =>
                m.id === parcel.id || m.id === `parcel-${parcel.id}`
                  ? {
                      ...m,
                      position: [payload.latitude as number, payload.longitude as number],
                      label: `📦 ${parcel.trackingRef} • ${newStatus.replace(/_/g, " ")} (LIVE)`,
                      status: newStatus,
                    }
                  : m
              )
            );
          } catch { /* ignore */ }
        });
        sseConnections.push(es);
      }
    }

    // Admin/Staff map updates are handled by the 30-second polling interval.
    // The /stream/scans SSE endpoint requires authentication which EventSource
    // cannot provide (no header support); using it unauthenticated returns 401.

    return () => sseConnections.forEach((es) => es.close());
  }, [role, trackedIds]);

  // Load detailed tracking map when user selects a different parcel
  useEffect(() => {
    if (!selectedParcelId) return;
    let cancelled = false;
    mapService.getParcelMap(selectedParcelId)
      .then((data) => { if (!cancelled) setSelectedParcelMap(data); })
      .catch(() => { if (!cancelled) setSelectedParcelMap(null); });
    return () => { cancelled = true; };
  }, [selectedParcelId]);

  const title = useMemo(() => {
    if (role === "COURIER") return t("roleMap.title.courier");
    if (role === "AGENT") return t("roleMap.title.agent");
    if (role === "CLIENT") return t("roleMap.title.client");
    return t("roleMap.title.admin");
  }, [role, t]);

  // Filter markers by status and search
  const filteredMarkers = useMemo(() => {
    return markers.filter((m) => {
      if (statusFilter !== "ALL" && m.type === "parcel" && m.status && m.status !== statusFilter) return false;
      if (searchQuery.trim() && m.label && !m.label.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [markers, statusFilter, searchQuery]);

  const canTrackParcels = CLIENT_PARCEL_ROLES.has(role) || COURIER_MAP_ROLES.has(role);
  const showFilters = role === "ADMIN" || role === "STAFF" || COURIER_MAP_ROLES.has(role);
  const isCourierRole = COURIER_MAP_ROLES.has(role);
  const parcelCount = filteredMarkers.filter((m) => m.type === "parcel").length;
  const agencyCount = filteredMarkers.filter((m) => m.type === "agency").length;
  const locationCount = filteredMarkers.filter((m) => m.type === "location").length;
  const pickupCount = filteredMarkers.filter((m) => m.type === "pickup").length;
  const deliveryCount = filteredMarkers.filter((m) => m.type === "delivery").length;

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
          {isCourierRole && (
            <Button
              variant="default"
              onClick={() => void handleOptimizeRoute()}
              disabled={isOptimizing}
              className="gap-2"
            >
              {isOptimizing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Route className="h-4 w-4" />}
              Optimize Route
            </Button>
          )}
          <Button variant="outline" onClick={() => void loadMapData()} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            {t("common.refresh")}
          </Button>
          {role === "CLIENT" && (
            <Button variant="outline" onClick={() => navigate("/client/tracking")}>
              {t("nav.tracking")}
            </Button>
          )}
        </div>
      </div>

      <div className="text-xs text-muted-foreground">
        {t("roleMap.liveUpdates", { seconds: Math.round(REFRESH_INTERVAL_MS / 1000) })}
        {lastUpdatedAt ? ` • Last refresh ${lastUpdatedAt.toLocaleTimeString()}` : ""}
        {(role === "ADMIN" || role === "STAFF") && " • Live scan events via SSE"}
      </div>

      {/* Status filter + search for admin/staff/courier/agent */}
      {showFilters && (
        <Card>
          <CardContent className="pt-4">
            <div className="flex flex-wrap gap-3 items-center">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <div className="flex flex-wrap gap-1">
                {STATUS_FILTERS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatusFilter(s)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                      statusFilter === s
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {s === "ALL" ? "All" : s.replace(/_/g, " ")}
                  </button>
                ))}
              </div>
              <Input
                placeholder="Search by tracking ref..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 w-48"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Parcel selector for client / courier / agent */}
      {canTrackParcels && trackedParcels.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("roleMap.trackedParcels")}</CardTitle>
          </CardHeader>
          <CardContent>
            <label className="flex flex-col gap-2 text-sm">
              <span className="text-muted-foreground">{t("roleMap.selectParcel")}</span>
              <select
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={selectedParcelId}
                onChange={(e) => setSelectedParcelId(e.target.value)}
              >
                <option value="">— Select parcel —</option>
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
                <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                  {parcelCount > 0 && <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" />Parcels ({parcelCount})</span>}
                  {agencyCount > 0 && <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" />Agencies ({agencyCount})</span>}
                  {locationCount > 0 && <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-violet-500" />GPS ({locationCount})</span>}
                  {pickupCount > 0 && <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: "#10b981" }} />Collect ({pickupCount})</span>}
                  {deliveryCount > 0 && <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: "#f97316" }} />Deliver ({deliveryCount})</span>}
                </div>
                <Badge variant="secondary">{filteredMarkers.length} markers</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <LeafletMap markers={filteredMarkers} height="62vh" showSearch />
              {filteredMarkers.length === 0 && (
                <div className="text-sm text-muted-foreground text-center">
                  {statusFilter !== "ALL" || searchQuery
                    ? "No markers match your filter"
                    : t("roleMap.noGpsData")}
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

          {/* Route optimization result panel */}
          {isCourierRole && (routeResult || routeError) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Route className="h-5 w-5" />
                  Optimized Route
                  {routeResult && (
                    <span className="ml-auto text-sm font-normal text-muted-foreground">
                      {routeResult.totalDistanceKm.toFixed(1)} km · ~{routeResult.estimatedDurationMinutes} min · {routeResult.fuelSavingsPercent.toFixed(0)}% fuel saved
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {routeError && <p className="text-destructive text-sm">{routeError}</p>}
                {routeResult && (
                  <ol className="space-y-2">
                    {routeResult.optimizedRoute.map((stop) => (
                      <li key={stop.stopId} className="flex items-start gap-3 text-sm">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                          {stop.order}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge
                              variant="outline"
                              className="text-xs"
                              style={{ borderColor: stop.type === "PICKUP" ? "#10b981" : "#f97316", color: stop.type === "PICKUP" ? "#10b981" : "#f97316" }}
                            >
                              {stop.type === "PICKUP" ? "🏠 COLLECT" : "📬 DELIVER"}
                            </Badge>
                            {stop.arrivalTime && (
                              <span className="text-xs text-muted-foreground">ETA {stop.arrivalTime}</span>
                            )}
                            {stop.distanceFromPrevious != null && (
                              <span className="text-xs text-muted-foreground">+{stop.distanceFromPrevious.toFixed(1)} km</span>
                            )}
                          </div>
                          <p className="text-muted-foreground truncate mt-0.5">{stop.address ?? stop.stopId}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
