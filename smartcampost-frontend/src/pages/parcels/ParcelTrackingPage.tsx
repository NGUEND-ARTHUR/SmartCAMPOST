import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Search, Clock, CheckCircle2, Truck, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import apiClient from "@/lib/api";
import { normalizeApiBase } from "@/lib/axiosClient";
import QRCodeDisplay from "@/components/qrcode/QRCodeDisplay";
import TrackingMap from "@/components/maps/TrackingMap";

type ScanEventResponse = {
  id: string;
  eventType: string;
  timestamp: string;
  locationNote?: string;
  agencyName?: string;
  agentName?: string;
  latitude?: number;
  longitude?: number;
  locationSource?: string;
  parcelStatusAfter?: string;
};

interface ParcelTrackingData {
  parcelId?: string;
  trackingRef: string;
  trackingNumber?: string;
  status: string;
  lastLocationNote?: string;
  updatedAt?: string;
  expectedDeliveryAt?: string;
  timeline: ScanEventResponse[];
  currentLocation?: {
    latitude?: number;
    longitude?: number;
    locationSource?: string;
    eventType?: string;
    updatedAt?: string;
  };
}

export default function ParcelTrackingPage() {
  const { t } = useTranslation();
  const [trackingRef, setTrackingRef] = useState("");
  const [data, setData] = useState<ParcelTrackingData | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = () => {
    if (!trackingRef.trim()) {
      toast.error(t("tracking.enterRef"));
      return;
    }
    setLoading(true);
    apiClient
      .get<ParcelTrackingData>(
        `/track/parcel/${encodeURIComponent(trackingRef.trim())}`,
      )
      .then((res) => setData(res))
      .catch(() => toast.error(t("tracking.notFound")))
      .finally(() => setLoading(false));
  };

  // Listen for real-time tracking updates via public SSE stream
  useEffect(() => {
    if (!data) return;
    const ref = data.trackingRef || data.trackingNumber;
    if (!ref) return;

    const base = normalizeApiBase(import.meta.env.VITE_API_URL as string | undefined);
    const sseUrl = `${base}/stream/tracking/${encodeURIComponent(ref)}`;

    const es = new EventSource(sseUrl);

    // Backend emits event name "scan-event" with payload:
    // { type, parcelId, trackingRef, eventType, timestamp, latitude, longitude,
    //   locationNote, parcelStatusAfter }
    const handleScanEvent = (event: MessageEvent) => {
      try {
        const payload = JSON.parse(event.data);
        const matchesThis =
          payload.trackingRef === ref ||
          String(payload.parcelId) === String(data.parcelId);
        if (!matchesThis) return;

        setData((prev) => {
          if (!prev) return null;
          const newEvent: ScanEventResponse | null =
            payload.eventType && payload.timestamp
              ? {
                  id: String(payload.scanEventId || `sse-${payload.timestamp}`),
                  eventType: payload.eventType,
                  timestamp: payload.timestamp,
                  latitude: payload.latitude ?? undefined,
                  longitude: payload.longitude ?? undefined,
                  locationNote: payload.locationNote ?? undefined,
                  parcelStatusAfter: payload.parcelStatusAfter ?? undefined,
                }
              : null;
          const alreadyHas =
            newEvent != null &&
            prev.timeline.some((e) => e.id === newEvent.id);
          return {
            ...prev,
            status: payload.parcelStatusAfter || prev.status,
            currentLocation:
              payload.latitude && payload.longitude
                ? {
                    latitude: payload.latitude,
                    longitude: payload.longitude,
                    locationSource: "GPS",
                    eventType: "LIVE_UPDATE",
                    updatedAt: new Date().toISOString(),
                  }
                : prev.currentLocation,
            timeline:
              newEvent && !alreadyHas
                ? [...prev.timeline, newEvent]
                : prev.timeline,
          };
        });
      } catch (err) {
        console.warn("Failed to parse realtime tracking event", err);
      }
    };

    es.addEventListener("scan-event", handleScanEvent);

    return () => {
      es.close();
    };
  }, [data]);

  const liveActorsForMap = useMemo(() => {
    const actors = [];
    if (data?.currentLocation?.latitude && data?.currentLocation?.longitude) {
      actors.push({
        id: "parcel-live",
        type: "PARCEL" as const,
        name: t("trackingMap.live.parcel", "Parcel live position"),
        latitude: data.currentLocation.latitude,
        longitude: data.currentLocation.longitude,
        status: data.status || "IN_TRANSIT",
      });
    }
    return actors;
  }, [data, t]);

  return (
    <div className="max-w-xl mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>{t("tracking.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Input
              value={trackingRef}
              onChange={(e) => setTrackingRef(e.target.value)}
              placeholder={t("tracking.placeholder")}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <Button onClick={handleSearch} disabled={loading}>
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
            </Button>
          </div>
          {data && (
            <>
              {/* Status + ETA summary bar */}
              <div className="flex flex-wrap gap-3 mb-4 p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  {data.status === "DELIVERED" ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  ) : data.status === "IN_TRANSIT" || data.status === "OUT_FOR_DELIVERY" ? (
                    <Truck className="w-4 h-4 text-blue-500" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-500" />
                  )}
                  <span className="text-sm font-semibold">{data.status.replace(/_/g, " ")}</span>
                </div>
                {data.expectedDeliveryAt && data.status !== "DELIVERED" && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">
                      ETA:{" "}
                      <span className="font-semibold">
                        {new Date(data.expectedDeliveryAt).toLocaleDateString(undefined, {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </span>
                  </div>
                )}
                {data.lastLocationNote && (
                  <div className="text-sm text-muted-foreground">
                    Last seen: {data.lastLocationNote}
                  </div>
                )}
              </div>

              <QRCodeDisplay
                trackingRef={data.trackingRef}
                showLabel={true}
                showActions={true}
              />
              <div className="mt-4">
                <div className="font-semibold mb-2">
                  {t("tracking.timeline")}
                </div>
                {data.timeline.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-muted-foreground/30 p-4 text-center text-xs text-muted-foreground space-y-1">
                    <p className="font-medium text-sm">
                      {data.status === "CREATED"
                        ? "Awaiting agency pickup"
                        : "No scan checkpoints yet"}
                    </p>
                    <p>
                      {data.status === "CREATED"
                        ? "Your parcel has been registered. Tracking updates will appear here once an agency agent scans it at drop-off."
                        : "Tracking events will appear here as your parcel moves through the network."}
                    </p>
                  </div>
                ) : (
                  <ul className="text-xs space-y-1">
                    {data.timeline.map((item, idx) => (
                      <li key={idx}>
                        <span className="font-medium">{item.eventType}</span> -{" "}
                        {new Date(item.timestamp).toLocaleString()}
                        {item.locationNote ? ` — ${item.locationNote}` : ""}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="mt-6">
                <div className="font-semibold mb-2">
                  {t("tracking.mapTitle")}
                </div>
                {data.timeline.length === 0 && !data.currentLocation ? (
                  <div className="rounded-lg border border-dashed border-muted-foreground/30 p-6 text-center text-xs text-muted-foreground">
                    <p>Map tracking will appear here once your parcel is scanned at pickup.</p>
                  </div>
                ) : (
                  <TrackingMap
                    trackingId={data.trackingRef}
                    currentStatus={data.status}
                    scanEvents={data.timeline.map((e) => ({
                      id: e.id,
                      eventType: e.eventType,
                      timestamp: e.timestamp,
                      agencyName: e.agencyName,
                      latitude: e.latitude,
                      longitude: e.longitude,
                      location: e.locationNote,
                    }))}
                    showAnimation={true}
                    liveActors={liveActorsForMap}
                  />
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
