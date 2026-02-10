import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import apiClient from "@/lib/api";
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
                    showAnimation={false}
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
