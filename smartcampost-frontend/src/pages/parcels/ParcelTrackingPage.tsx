import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Search } from "lucide-react";
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
        `/api/track/parcel/${encodeURIComponent(trackingRef.trim())}`,
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
    
    const handleGpsUpdate = (event: MessageEvent) => {
      try {
        const payload = JSON.parse(event.data);
        const parcels = payload.inheritedParcels || [];
        const match = parcels.find(
          (p: any) => p.trackingRef === ref || p.parcelId === data.parcelId
        );
        if (match && match.latitude && match.longitude) {
          setData((prev) => {
            if (!prev) return null;
            if (
              prev.currentLocation?.latitude === match.latitude &&
              prev.currentLocation?.longitude === match.longitude
            ) {
              return prev;
            }
            return {
              ...prev,
              currentLocation: {
                latitude: match.latitude,
                longitude: match.longitude,
                locationSource: match.source || "GPS",
                eventType: "LIVE_UPDATE",
                updatedAt: new Date().toISOString(),
              },
            };
          });
        }
      } catch (err) {
        console.warn("Failed to parse realtime tracking event", err);
      }
    };

    es.addEventListener("gps-update", handleGpsUpdate);

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
              <QRCodeDisplay
                trackingRef={data.trackingRef}
                showLabel={true}
                showActions={true}
              />
              <div className="mt-4">
                <div className="font-semibold mb-2">
                  {t("tracking.timeline")}
                </div>
                <ul className="text-xs space-y-1">
                  {data.timeline.map((item, idx) => (
                    <li key={idx}>
                      <span className="font-medium">{item.eventType}</span> -{" "}
                      {new Date(item.timestamp).toLocaleString()}
                      {item.locationNote ? ` — ${item.locationNote}` : ""}
                    </li>
                  ))}
                </ul>
              </div>
              {data.timeline?.length > 0 && (
                <div className="mt-6">
                  <div className="font-semibold mb-2">
                    {t("tracking.mapTitle")}
                  </div>
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
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
