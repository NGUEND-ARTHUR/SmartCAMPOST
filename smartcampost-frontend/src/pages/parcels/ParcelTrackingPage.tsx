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

interface ParcelTrackingData {
  trackingRef: string;
  status: string;
  timeline: Array<{ status: string; date: string }>;
  senderCity?: string;
  recipientCity?: string;
  lastLocation?: { lat: number; lng: number };
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
      .get<ParcelTrackingData>(`/api/qr/tracking/${trackingRef}`)
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
                senderCity={data.senderCity}
                recipientCity={data.recipientCity}
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
                      <span className="font-medium">
                        {t(`tracking.status.${item.status}`)}
                      </span>{" "}
                      - {new Date(item.date).toLocaleString()}
                    </li>
                  ))}
                </ul>
              </div>
              {data.lastLocation && (
                <div className="mt-6">
                  <div className="font-semibold mb-2">
                    {t("tracking.mapTitle")}
                  </div>
                  <TrackingMap
                    lat={data.lastLocation.lat}
                    lng={data.lastLocation.lng}
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
