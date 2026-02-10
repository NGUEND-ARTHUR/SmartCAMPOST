import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import QRCodeScanner from "@/components/qrcode/QRCodeScanner";
import TrackingMap from "@/components/maps/TrackingMap";
import AuditTrail from "@/components/delivery/AuditTrail";
import { useAuthStore } from "@/store/authStore";

type ScanEventResponse = {
  id: string;
  eventType: string;
  timestamp: string;
  locationNote?: string;
  agencyName?: string;
  agentName?: string;
  latitude?: number;
  longitude?: number;
  parcelStatusAfter?: string;
  locationSource?: string;
};

type TrackingResponse = {
  parcelId?: string;
  trackingRef?: string;
  trackingNumber?: string;
  status?: string;
  lastLocationNote?: string;
  updatedAt?: string;
  timeline?: ScanEventResponse[];
  currentLocation?: {
    latitude?: number;
    longitude?: number;
    locationSource?: string;
    eventType?: string;
    updatedAt?: string;
  };
};

export default function TrackingPage() {
  const { user } = useAuthStore();
  const [searchParams] = useSearchParams();
  const [number, setNumber] = useState("");
  const [activeTab, setActiveTab] = useState<"number" | "qr">("number");
  const [result, setResult] = useState<TrackingResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const roleUpper = (user?.role ?? "").toUpperCase();
  const canSeeAudit = roleUpper === "ADMIN" || roleUpper === "STAFF";

  const scanEventsForMap = useMemo(() => {
    const timeline = result?.timeline ?? [];
    return timeline.map((e) => ({
      id: e.id,
      eventType: e.eventType,
      timestamp: e.timestamp,
      agencyName: e.agencyName,
      latitude: e.latitude,
      longitude: e.longitude,
      location: e.locationNote,
    }));
  }, [result]);

  const lookupByNumber = useCallback(async (tracking: string) => {
    const trimmed = tracking.trim();
    if (!trimmed) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/track/parcel/${encodeURIComponent(trimmed)}`,
      );
      if (res.ok) setResult(await res.json());
      else {
        setResult(null);
        toast.error("Tracking not found");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const lookupByQrContent = useCallback(async (code: string) => {
    const trimmed = code.trim();
    if (!trimmed) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/track/qr`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: trimmed }),
      });
      if (res.ok) {
        setResult(await res.json());
      } else {
        setResult(null);
        toast.error("Unable to track with this QR");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (!ref) return;
    const trimmed = ref.trim();
    if (!trimmed) return;
    setActiveTab("number");
    setNumber(trimmed);
    lookupByNumber(trimmed);
  }, [lookupByNumber, searchParams]);

  return (
    <div className="max-w-3xl mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Track Parcel</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs>
            <TabsList>
              <TabsTrigger
                value="number"
                onClick={() => setActiveTab("number")}
                className={
                  activeTab === "number"
                    ? "bg-blue-50 text-blue-700"
                    : undefined
                }
              >
                Tracking number
              </TabsTrigger>
              <TabsTrigger
                value="qr"
                onClick={() => setActiveTab("qr")}
                className={
                  activeTab === "qr" ? "bg-blue-50 text-blue-700" : undefined
                }
              >
                Scan QR
              </TabsTrigger>
            </TabsList>

            {activeTab === "number" && (
              <TabsContent value="number" className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    value={number}
                    onChange={(e) => setNumber(e.target.value)}
                    placeholder="Enter tracking number"
                    onKeyDown={(e) =>
                      e.key === "Enter" && lookupByNumber(number)
                    }
                  />
                  <Button
                    onClick={() => lookupByNumber(number)}
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Lookup"
                    )}
                  </Button>
                </div>
              </TabsContent>
            )}

            {activeTab === "qr" && (
              <TabsContent value="qr" className="space-y-3">
                <QRCodeScanner
                  continuous={false}
                  onScan={(res) => {
                    if (!res?.success) return;
                    lookupByQrContent(res.rawText);
                  }}
                  onError={(err) => toast.error(err)}
                />
              </TabsContent>
            )}
          </Tabs>

          {result && (
            <div className="space-y-3">
              <div className="text-sm">
                <div>
                  <span className="font-semibold">Tracking:</span>{" "}
                  {(result.trackingRef || result.trackingNumber) ?? "—"}
                </div>
                <div>
                  <span className="font-semibold">Status:</span>{" "}
                  {result.status ?? "—"}
                </div>
                <div>
                  <span className="font-semibold">Last note:</span>{" "}
                  {result.lastLocationNote ?? "—"}
                </div>
              </div>

              <div>
                <div className="font-semibold mb-2">Timeline</div>
                <ul className="text-sm space-y-1">
                  {(result.timeline ?? []).map((e, i) => (
                    <li key={e.id || i} className="border rounded p-2">
                      <div className="font-medium">{e.eventType}</div>
                      <div className="text-muted-foreground">
                        {new Date(e.timestamp).toLocaleString()}
                        {e.locationNote ? ` — ${e.locationNote}` : ""}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <div className="font-semibold mb-2">Map</div>
                <TrackingMap
                  trackingId={
                    (result.trackingRef || result.trackingNumber) ?? undefined
                  }
                  currentStatus={result.status}
                  scanEvents={scanEventsForMap}
                  showAnimation={false}
                />
              </div>

              {canSeeAudit && result.parcelId && (
                <div>
                  <div className="font-semibold mb-2">Audit</div>
                  <AuditTrail parcelId={result.parcelId} showFull={true} />
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
