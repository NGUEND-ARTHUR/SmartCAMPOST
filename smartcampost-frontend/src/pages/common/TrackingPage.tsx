import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { BellRing, Clock3, Loader2, MessageCircle, Phone, Send, ShieldCheck, Star, Truck, UserRound } from "lucide-react";
import QRCodeScanner from "@/components/qrcode/QRCodeScanner";
import TrackingMap from "@/components/maps/TrackingMap";
import AuditTrail from "@/components/delivery/AuditTrail";
import { useAuthStore } from "@/store/authStore";
import axiosInstance, { normalizeApiBase } from "@/lib/axiosClient";

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
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [searchParams] = useSearchParams();
  const [number, setNumber] = useState("");
  const [activeTab, setActiveTab] = useState<"number" | "qr">("number");
  const [result, setResult] = useState<TrackingResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [rating, setRating] = useState(0);
  const [ratingComment, setRatingComment] = useState("");

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

  const currentContact = useMemo(() => {
    const timeline = result?.timeline ?? [];
    const latestActor = [...timeline]
      .reverse()
      .find((event) => event.agentName || event.agencyName);
    return {
      name: latestActor?.agentName || latestActor?.agencyName || t("trackingPage.assignedContact", "Assigned contact"),
      role: latestActor?.agentName ? "AGENT" : "AGENCY",
      phone: "",
    };
  }, [result, t]);

  const brandedTrackingInsights = useMemo(() => {
    const events = result?.timeline ?? [];
    const delivered = (result?.status ?? "").toUpperCase().includes("DELIVERED");
    const moving = (result?.status ?? "").toUpperCase().includes("TRANSIT")
      || (result?.status ?? "").toUpperCase().includes("OUT");
    const lastUpdate = result?.updatedAt || events[events.length - 1]?.timestamp;
    const hoursSinceUpdate = lastUpdate
      ? Math.max(0, (Date.now() - new Date(lastUpdate).getTime()) / 36e5)
      : 0;
    const delayRisk = !delivered && hoursSinceUpdate > 24;
    const etaHours = delivered ? 0 : Math.max(2, 18 - events.length * 2 + (delayRisk ? 8 : 0));
    return {
      delivered,
      moving,
      delayRisk,
      etaLabel: delivered
        ? t("trackingPage.insights.delivered", "Delivered")
        : t("trackingPage.insights.etaHours", "{{count}}h estimated", { count: etaHours }),
      alertLabel: delayRisk
        ? t("trackingPage.insights.delayAlert", "Delay risk: proactive notification recommended")
        : t("trackingPage.insights.onTrack", "On track: customer visibility is healthy"),
    };
  }, [result, t]);

  const lookupByNumber = useCallback(
    async (tracking: string) => {
      const trimmed = tracking.trim();
      if (!trimmed) return;
      setLoading(true);
      setError(null);
      try {
        const res = await axiosInstance.get<TrackingResponse>(
          `/track/parcel/${encodeURIComponent(trimmed)}`,
        );
        if (res.data) {
          setResult(res.data);
        } else {
          setResult(null);
          setError(t("trackingPage.toasts.notFound", "Parcel not found"));
          toast.error(t("trackingPage.toasts.notFound", "Parcel not found"));
        }
      } catch (err) {
        setResult(null);
        const errorMsg = err instanceof Error ? err.message : "Error loading parcel";
        setError(errorMsg);
        toast.error(errorMsg);
      } finally {
        setLoading(false);
      }
    },
    [t],
  );

  const lookupByQrContent = useCallback(
    async (code: string) => {
      const trimmed = code.trim();
      if (!trimmed) return;
      setLoading(true);
      setError(null);
      try {
        const res = await axiosInstance.post<TrackingResponse>(`/track/qr`, {
          code: trimmed,
        });
        if (res.data) {
          setResult(res.data);
        } else {
          setResult(null);
          setError(t("trackingPage.toasts.invalidQr", "Invalid QR code"));
          toast.error(t("trackingPage.toasts.invalidQr", "Invalid QR code"));
        }
      } catch (err) {
        setResult(null);
        const errorMsg = err instanceof Error ? err.message : "Error scanning QR";
        setError(errorMsg);
        toast.error(errorMsg);
      } finally {
        setLoading(false);
      }
    },
    [t],
  );

  const startConversation = async () => {
    const message = chatMessage.trim();
    if (!message) return;
    try {
      await axiosInstance.post("/conversations", {
        channel: "WEB",
        message,
        contextData: JSON.stringify({
          trackingRef: result?.trackingRef || result?.trackingNumber,
          contact: currentContact,
        }),
      });
      toast.success(t("trackingPage.chat.sent", "Message sent"));
      setChatMessage("");
      setChatOpen(false);
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : t("trackingPage.chat.failed", "Unable to send message"),
      );
    }
  };

  const submitRating = async () => {
    if (rating < 1) return;
    try {
      await axiosInstance.post("/ratings", {
        score: rating,
        comment: ratingComment,
        trackingRef: result?.trackingRef || result?.trackingNumber,
        ratedRole: currentContact.role,
      });
      toast.success(t("trackingPage.rating.thanks", "Thanks for your feedback"));
      setRatingComment("");
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : t("trackingPage.rating.failed", "Unable to save rating"),
      );
    }
  };

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (!ref) return;
    const trimmed = ref.trim();
    if (!trimmed) return;
    const timer = window.setTimeout(() => {
      void lookupByNumber(trimmed);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [lookupByNumber, searchParams]);

  // SSE: subscribe to live tracking events for the current parcel.
  // Depends ONLY on the tracking ref — not on the full result object —
  // so updating result state (e.g. appending a scan event) does not
  // close and reopen the connection every time.
  const activeTrackingRef = result?.trackingRef || result?.trackingNumber || null;
  useEffect(() => {
    if (!activeTrackingRef) return;
    const ref = activeTrackingRef;

    const base = normalizeApiBase(import.meta.env.VITE_API_URL as string | undefined);
    const sseUrl = `${base}/stream/tracking/${encodeURIComponent(ref)}`;

    const es = new EventSource(sseUrl);

    es.addEventListener("gps-update", (event: MessageEvent) => {
      try {
        const payload = JSON.parse(event.data);
        const parcels = payload.inheritedParcels || [];
        const match = parcels.find(
          (p: any) => p.trackingRef === ref || p.parcelId === resultRef.current?.parcelId,
        );
        if (match?.latitude && match?.longitude) {
          setResult((prev) => {
            if (!prev) return null;
            if (
              prev.currentLocation?.latitude === match.latitude &&
              prev.currentLocation?.longitude === match.longitude
            ) return prev;
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
    });

    es.addEventListener("scan-event", (event: MessageEvent) => {
      try {
        const scan = JSON.parse(event.data);
        if (!scan.eventType) return;
        setResult((prev) => {
          if (!prev) return null;
          const existing = prev.timeline ?? [];
          if (existing.some((e) => e.id === scan.id)) return prev;
          const newEvent: ScanEventResponse = {
            id: scan.id || `live-${Date.now()}`,
            eventType: scan.eventType,
            timestamp: scan.timestamp || new Date().toISOString(),
            locationNote: scan.locationNote,
            latitude: scan.latitude,
            longitude: scan.longitude,
            parcelStatusAfter: scan.parcelStatusAfter,
          };
          return {
            ...prev,
            status: scan.parcelStatusAfter || prev.status,
            timeline: [...existing, newEvent],
            ...(scan.latitude && scan.longitude
              ? {
                  currentLocation: {
                    latitude: scan.latitude,
                    longitude: scan.longitude,
                    locationSource: "SCAN",
                    eventType: scan.eventType,
                    updatedAt: scan.timestamp || new Date().toISOString(),
                  },
                }
              : {}),
          };
        });
      } catch { /* ignore */ }
    });

    return () => es.close();
  }, [activeTrackingRef]);

  // Keep a stable ref to the current result so SSE callbacks can read it
  // without being listed as effect dependencies (avoids infinite reconnects).
  const resultRef = useRef<TrackingResponse | null>(null);
  useEffect(() => { resultRef.current = result; }, [result]);

  const liveActorsForMap = useMemo(() => {
    const actors = [];
    if (result?.currentLocation?.latitude && result?.currentLocation?.longitude) {
      actors.push({
        id: "parcel-live",
        type: "PARCEL" as const,
        name: t("trackingMap.live.parcel", "Parcel live position"),
        latitude: result.currentLocation.latitude,
        longitude: result.currentLocation.longitude,
        status: result.status || "IN_TRANSIT",
      });
    }
    return actors;
  }, [result, t]);

  return (
    <div className="mx-auto max-w-6xl p-4">
      <Card>
        <CardHeader>
          <CardTitle>{t("trackingPage.title", "Track Your Parcel")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="bg-destructive/10 border border-destructive text-destructive rounded-lg p-4">
              <p className="font-medium">{t("common.error", "Error")}</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
          )}
          
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v === "qr" ? "qr" : "number")}
          >
            <TabsList>
              <TabsTrigger
                value="number"
                className={
                  activeTab === "number"
                    ? "bg-blue-50 text-blue-700"
                    : undefined
                }
              >
                {t("trackingPage.tabs.number", "By Number")}
              </TabsTrigger>
              <TabsTrigger
                value="qr"
                className={
                  activeTab === "qr" ? "bg-blue-50 text-blue-700" : undefined
                }
              >
                {t("trackingPage.tabs.qr", "By QR")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="number" className="space-y-3">
              <div className="flex gap-2">
                <Input
                  value={number}
                  onChange={(e) => setNumber(e.target.value)}
                  placeholder={t("trackingPage.numberPlaceholder", "Enter tracking number...")}
                  onKeyDown={(e) => e.key === "Enter" && lookupByNumber(number)}
                  disabled={loading}
                />
                <Button
                  onClick={() => lookupByNumber(number)}
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    t("trackingPage.lookup", "Search")
                  )}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="qr" className="space-y-3">
              <QRCodeScanner
                continuous={false}
                onScan={(res) => {
                  if (!res?.success) return;
                  lookupByQrContent(res.rawText);
                }}
                onError={(err) => {
                  setError(err);
                  toast.error(err);
                }}
              />
            </TabsContent>
          </Tabs>

          {result && (
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
              <div className="space-y-3">
              <div className="text-sm">
                <div>
                  <span className="font-semibold">
                    {t("trackingPage.tracking", "Tracking")}:
                  </span>{" "}
                  {(result.trackingRef || result.trackingNumber) ?? "—"}
                </div>
                <div>
                  <span className="font-semibold">
                    {t("trackingPage.status", "Status")}:
                  </span>{" "}
                  {result.status ?? "—"}
                </div>
                <div>
                  <span className="font-semibold">
                    {t("trackingPage.lastNote", "Last Note")}:
                  </span>{" "}
                  {result.lastLocationNote ?? "—"}
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-lg border bg-primary/5 p-4">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Truck className="h-4 w-4 text-primary" />
                    {t("trackingPage.insights.branded", "Branded live tracking")}
                  </div>
                  <p className="mt-2 text-2xl font-semibold">
                    {brandedTrackingInsights.moving
                      ? t("trackingPage.insights.inMotion", "In motion")
                      : result.status ?? t("common.status", "Status")}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    SmartCAMPOST branded journey page with live parcel context.
                  </p>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Clock3 className="h-4 w-4 text-amber-600" />
                    {t("trackingPage.insights.dynamicEta", "Dynamic ETA")}
                  </div>
                  <p className="mt-2 text-2xl font-semibold">
                    {brandedTrackingInsights.etaLabel}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    ETA adapts from scan history and delay risk.
                  </p>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    {brandedTrackingInsights.delivered ? (
                      <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <BellRing className="h-4 w-4 text-blue-600" />
                    )}
                    {brandedTrackingInsights.delivered
                      ? t("trackingPage.insights.proof", "Proof of delivery")
                      : t("trackingPage.insights.alerts", "Proactive alerts")}
                  </div>
                  <p className="mt-2 text-sm font-semibold">
                    {brandedTrackingInsights.delivered
                      ? t("trackingPage.insights.proofReady", "Delivery proof available after confirmation")
                      : brandedTrackingInsights.alertLabel}
                  </p>
                </div>
              </div>

              <div>
                <div className="font-semibold mb-2">
                  {t("trackingPage.timeline", "Timeline")}
                </div>
                <ul className="text-sm space-y-1">
                  {(result.timeline ?? []).length > 0 ? (
                    (result.timeline ?? []).map((e, i) => (
                      <li key={e.id || i} className="border rounded p-2">
                        <div className="font-medium">{e.eventType}</div>
                        <div className="text-muted-foreground">
                          {new Date(e.timestamp).toLocaleString()}
                          {e.locationNote ? ` — ${e.locationNote}` : ""}
                        </div>
                      </li>
                    ))
                  ) : (
                    <li className="text-muted-foreground italic">
                      {t("trackingPage.noEvents", "No scan events yet")}
                    </li>
                  )}
                </ul>
              </div>

              {(result.timeline ?? []).length > 0 && (
                <div>
                  <div className="font-semibold mb-2">
                    {t("trackingPage.map", "Map")}
                  </div>
                  <TrackingMap
                    trackingId={
                      (result.trackingRef || result.trackingNumber) ?? undefined
                    }
                    currentStatus={result.status}
                    scanEvents={scanEventsForMap}
                    showAnimation
                    liveActors={liveActorsForMap}
                  />
                </div>
              )}

              {canSeeAudit && result.parcelId && (
                <div>
                  <div className="font-semibold mb-2">
                    {t("trackingPage.audit", "Audit Trail")}
                  </div>
                  <AuditTrail parcelId={result.parcelId} showFull={true} />
                </div>
              )}
              </div>

              <aside className="space-y-4">
                <Card className="sc-animate-fade-up">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <UserRound className="h-5 w-5" />
                      {t("trackingPage.contact.title", "Delivery contact")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <UserRound className="h-6 w-6" />
                      </div>
                      <div>
                        <div className="font-semibold">{currentContact.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {currentContact.role}
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        className="gap-2"
                        onClick={() => setChatOpen((open) => !open)}
                      >
                        <MessageCircle className="h-4 w-4" />
                        {t("trackingPage.contact.chat", "Chat")}
                      </Button>
                      <Button
                        variant="outline"
                        className="gap-2"
                        onClick={() => toast.info(t("trackingPage.contact.callSoon", "Calling will use the assigned phone number when available."))}
                      >
                        <Phone className="h-4 w-4" />
                        {t("trackingPage.contact.call", "Call")}
                      </Button>
                    </div>
                    {chatOpen && (
                      <div className="space-y-2">
                        <textarea
                          className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm"
                          value={chatMessage}
                          placeholder={t("trackingPage.chat.placeholder", "Write a message about this parcel...")}
                          onChange={(event) => setChatMessage(event.target.value)}
                        />
                        <Button className="w-full gap-2" onClick={startConversation}>
                          <Send className="h-4 w-4" />
                          {t("trackingPage.chat.send", "Send message")}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="sc-animate-fade-up sc-delay-1">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Star className="h-5 w-5" />
                      {t("trackingPage.rating.title", "Rate this service")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((score) => (
                        <button
                          key={score}
                          type="button"
                          className="rounded p-1 text-amber-500 transition hover:scale-110"
                          aria-label={`${score} stars`}
                          onClick={() => setRating(score)}
                        >
                          <Star
                            className="h-6 w-6"
                            fill={score <= rating ? "currentColor" : "none"}
                          />
                        </button>
                      ))}
                    </div>
                    <textarea
                      className="min-h-20 w-full rounded-md border bg-background px-3 py-2 text-sm"
                      value={ratingComment}
                      placeholder={t("trackingPage.rating.placeholder", "Share delivery feedback...")}
                      onChange={(event) => setRatingComment(event.target.value)}
                    />
                    <Button
                      className="w-full"
                      disabled={rating < 1}
                      onClick={submitRating}
                    >
                      {t("trackingPage.rating.submit", "Submit rating")}
                    </Button>
                  </CardContent>
                </Card>
              </aside>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
