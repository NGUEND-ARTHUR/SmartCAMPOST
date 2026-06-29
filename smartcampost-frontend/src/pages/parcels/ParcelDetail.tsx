import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  Package,
  MapPin,
  Clock,
  CheckCircle,
  Truck,
  AlertCircle,
  Camera,
  Loader2,
  User,
  Globe,
  ImageIcon,
  MessageSquare,
  QrCode,
  Users,
} from "lucide-react";
import { useEffect, useState, type ComponentType } from "react";
import type { ParcelStatus as TransitionParcelStatus } from "@/lib/transitions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/StatusBadge";
import { TrackingMap } from "@/components/maps";
import { QRCodeDisplay, QRCodeViewerDialog } from "@/components/qrcode";
import { canTransition } from "@/lib/transitions";
import { ActionButton } from "@/components/transitions/ActionButton";
import { EmptyState } from "@/components/EmptyState";
// invoiceService removed — receipts are generated client-side
import {
  useParcel,
  useScanEventsForParcel,
  usePricingQuote,
  usePricingHistoryForParcel,
  usePaymentsForParcel,
  useMarkCodAsPaid,
  useConfirmCashPayment,
  useUpdateParcelStatus,
  useValidateAndAccept,
  useValidateAndLockParcel,
  useCanCorrectParcel,
  useCorrectParcel,
} from "@/hooks";
import { toast } from "sonner";
import { httpClient } from "@/services/apiClient";
import { useAuthStore } from "@/store/authStore";

const eventIcons: Record<string, ComponentType<any>> = {
  CREATED: Package,
  AT_ORIGIN_AGENCY: MapPin,
  IN_TRANSIT: Truck,
  ARRIVED_HUB: MapPin,
  DEPARTED_HUB: Truck,
  ARRIVED_DESTINATION: MapPin,
  OUT_FOR_DELIVERY: Truck,
  DELIVERED: CheckCircle,
  RETURNED: AlertCircle,
};

export default function ParcelDetail() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const [isQrDialogOpen, setIsQrDialogOpen] = useState(false);

  const authUser = useAuthStore((s) => s.user);
  const role = String(authUser?.role || "CLIENT").toUpperCase();
  const normalizedRole = (() => {
    const raw = String(authUser?.role || "CLIENT");
    const upper = raw.toUpperCase();
    if (upper === "USER") return "CLIENT";
    if (upper === "ADMIN") return "ADMIN";
    return upper;
  })();

  const listPath =
    normalizedRole === "ADMIN"
      ? "/admin/parcels"
      : normalizedRole === "STAFF"
        ? "/staff/parcels"
        : normalizedRole === "AGENT"
          ? "/agent/parcels"
          : normalizedRole === "COURIER"
            ? "/courier/parcels"
            : "/client/parcels";

  const canValidate = ["AGENT", "COURIER", "STAFF", "ADMIN"].includes(
    normalizedRole,
  );

  // mutation hooks must be declared at top-level to respect rules of hooks
  const updateStatus = useUpdateParcelStatus();
  const useValidate = useValidateAndAccept();
  const useValidateAndLock = useValidateAndLockParcel();

  const getGpsOrThrow = async () => {
    const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      });
    });
    return {
      latitude: pos.coords.latitude,
      longitude: pos.coords.longitude,
    };
  };

  const {
    data: parcel,
    isLoading: parcelLoading,
    error: parcelError,
  } = useParcel(id || "");
  const { data: scanEvents = [], isLoading: eventsLoading } =
    useScanEventsForParcel(id || "");
  const quote = usePricingQuote(id || "");
  const pricingHistory = usePricingHistoryForParcel(id || "");
  const paymentsForParcel = usePaymentsForParcel(id || "");
  const markCodPaid = useMarkCodAsPaid();
  const confirmCash = useConfirmCashPayment();
  const correctParcel = useCorrectParcel();
  const canCorrectQuery = useCanCorrectParcel(id || "");
  // mutation hooks must be called unconditionally

  // Real-time location tracking via SSE
  const [liveLocation, setLiveLocation] = useState<{ latitude: number; longitude: number; updatedAt?: string } | null>(null);

  useEffect(() => {
    const ref = parcel?.trackingRef;
    if (!ref) return;

    const base = import.meta.env.VITE_API_URL || "http://localhost:8082/api";
    const sseUrl = `${base.replace(/\/+$/, "")}/stream/tracking/${encodeURIComponent(ref)}`;
    const es = new EventSource(sseUrl);

    es.addEventListener("gps-update", (event: MessageEvent) => {
      try {
        const payload = JSON.parse(event.data);
        const parcels = payload.inheritedParcels || [];
        const match = parcels.find((p: any) => p.trackingRef === ref);
        if (match?.latitude && match?.longitude) {
          setLiveLocation({
            latitude: match.latitude,
            longitude: match.longitude,
            updatedAt: match.timestamp || new Date().toISOString(),
          });
        }
      } catch { /* ignore parse errors */ }
    });

    es.onerror = () => {
      es.close();
    };

    return () => es.close();
  }, [parcel?.trackingRef]);

  const isLoading = parcelLoading || eventsLoading;

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (parcelError || !parcel) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate(listPath)}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t("parcels.detail.backToParcels")}
        </Button>
        <EmptyState
          icon={Package}
          title={t("parcels.detail.notFoundTitle")}
          description={
            parcelError instanceof Error
              ? parcelError.message
              : t("parcels.detail.notFoundDescription")
          }
        />
      </div>
    );
  }

  const cancelDecision = canTransition(
    { kind: "parcel", status: parcel.status as TransitionParcelStatus },
    { type: "PARCEL_SET_STATUS", to: "CANCELLED" },
  );
  const canCancel = cancelDecision.allowed;

  const isCod = String(parcel.paymentOption || "").toUpperCase() === "COD";
  const hasSuccessfulPayment = (paymentsForParcel.data || []).some(
    (p) => String(p.status || "").toUpperCase() === "SUCCESS",
  );

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => navigate(listPath)}>
        <ArrowLeft className="w-4 h-4 mr-2" />
        {t("parcels.detail.backToParcels")}
      </Button>

      <div>
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold">{parcel.trackingRef}</h1>
          <StatusBadge status={parcel.status} />
        </div>
        <p className="text-muted-foreground">
          {t("parcels.detail.createdOn", {
            date: new Date(parcel.createdAt).toLocaleDateString(),
          })}
        </p>
      </div>

      {/* Tracking Map - Moved to top for better visibility */}
      <Card>
        <CardHeader>
          <CardTitle>{t("parcels.detail.trackingMap")}</CardTitle>
          <CardDescription>
            {t("parcels.detail.trackingMapDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <TrackingMap
            trackingId={parcel.trackingRef}
            scanEvents={scanEvents.map((e) => ({
              id: e.id,
              eventType: e.eventType,
              timestamp: e.timestamp,
              agencyName: e.agencyName,
              latitude: e.latitude,
              longitude: e.longitude,
              location: e.locationNote,
            }))}
            currentStatus={parcel.status}
            showAnimation={true}
            liveActors={liveLocation ? [{
              id: "live-parcel",
              type: "PARCEL",
              name: parcel.trackingRef,
              latitude: liveLocation.latitude,
              longitude: liveLocation.longitude,
              status: "LIVE",
            }] : undefined}
          />
          {liveLocation && (
            <div className="px-4 pb-3 flex items-center gap-2 text-sm text-green-500">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
              </span>
              Live tracking active
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("parcels.detail.detailsTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("parcels.detail.weight")}
                </p>
                <p className="font-medium">{parcel.weight} kg</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("parcels.detail.dimensions")}
                </p>
                <p className="font-medium">
                  {parcel.dimensions || t("parcels.detail.na")} cm
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("parcels.detail.declaredValue")}
                </p>
                <p className="font-medium">
                  {parcel.declaredValue?.toLocaleString() ||
                    t("parcels.detail.na")}{" "}
                  XAF
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("parcels.detail.fragile")}
                </p>
                <p className="font-medium">
                  {parcel.fragile ? t("common.yes") : t("common.no")}
                </p>
              </div>
            </div>
            <Separator />
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  {t("parcels.detail.serviceType")}
                </span>
                <Badge variant="secondary">{parcel.serviceType}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  {t("parcels.detail.deliveryOption")}
                </span>
                <Badge variant="secondary">{parcel.deliveryOption}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  {t("parcels.detail.paymentOption")}
                </span>
                <Badge variant="secondary">{parcel.paymentOption}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  {t("parcels.detail.quote")}
                </span>
                <span className="font-medium">
                  {quote.isLoading
                    ? "—"
                    : quote.data
                      ? `${quote.data.amount.toLocaleString()} ${quote.data.currency || "XAF"}`
                      : "—"}
                </span>
              </div>
            </div>

            {parcel.descriptionComment && (
              <>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    {t("parcels.detail.description")}
                  </p>
                  <p className="text-sm">{parcel.descriptionComment}</p>
                </div>
              </>
            )}

            {parcel.expectedDeliveryAt && (
              <>
                <Separator />
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <span className="text-muted-foreground">
                      {t("parcels.detail.expectedDelivery")}{" "}
                    </span>
                    <span className="font-medium">
                      {new Date(parcel.expectedDeliveryAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("parcels.detail.addresses")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-blue-600" />
                </div>
                <p className="font-medium">{t("parcels.detail.sender")}</p>
              </div>
              <div className="ml-10 text-sm text-muted-foreground">
                <p>{parcel.senderLabel || parcel.clientName || "—"}</p>
                <p>
                  {parcel.senderCity}
                  {parcel.senderRegion ? `, ${parcel.senderRegion}` : ""}
                </p>
                <p>{parcel.senderCountry || ""}</p>
              </div>
            </div>
            <Separator />
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-green-600" />
                </div>
                <p className="font-medium">{t("parcels.detail.recipient")}</p>
              </div>
              <div className="ml-10 text-sm text-muted-foreground">
                <p>{parcel.recipientLabel || "—"}</p>
                <p>
                  {parcel.recipientCity}
                  {parcel.recipientRegion ? `, ${parcel.recipientRegion}` : ""}
                </p>
                <p>{parcel.recipientCountry || ""}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* QR Code for Printing */}
        <Card>
          <CardContent className="py-4 flex flex-col items-center gap-3">
            <Button
              variant="outline"
              size="lg"
              className="w-full"
              onClick={() => setIsQrDialogOpen(true)}
            >
              <QrCode className="w-5 h-5 mr-2" />
              View QR Code
            </Button>
            {parcel.qrStatus !== "FINAL" && (
              <p className="text-xs text-muted-foreground text-center">
                The final QR code will be available after staff approval.
              </p>
            )}
          </CardContent>
        </Card>

        <QRCodeViewerDialog
          open={isQrDialogOpen}
          onOpenChange={setIsQrDialogOpen}
          trackingRef={parcel.trackingRef}
          parcelId={parcel.id}
          qrContent={
            parcel.locked && parcel.qrStatus === "FINAL"
              ? (parcel.finalQrCode as string | undefined)
              : undefined
          }
          qrStatus={parcel.qrStatus}
          senderCity={parcel.senderCity}
          recipientCity={parcel.recipientCity}
          serviceType={parcel.serviceType}
          createdAt={parcel.createdAt}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("parcels.detail.trackingTimeline")}</CardTitle>
          <CardDescription>
            {t("parcels.detail.trackingTimelineDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            {scanEvents.map((event, index) => {
              const Icon = eventIcons[event.eventType] || Package;
              const isLast = index === scanEvents.length - 1;
              const ts = new Date(event.timestamp);
              return (
                <div key={event.id} className="relative pb-8">
                  {!isLast && (
                    <div className="absolute left-4 top-10 bottom-0 w-0.5 bg-muted" />
                  )}
                  <div className="flex gap-4">
                    <div
                      className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${index === 0 ? "bg-blue-600 text-white" : "bg-muted text-muted-foreground"}`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 pt-0.5 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="font-medium">
                          {t(`scan.status.${event.eventType}`, event.eventType)}
                        </p>
                        <time className="text-xs text-muted-foreground whitespace-nowrap">
                          {ts.toLocaleDateString()}{" "}
                          {ts.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </time>
                      </div>

                      {/* WHO scanned */}
                      {(event.agentName || event.actorRole) && (
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-0.5">
                          <User className="w-3.5 h-3.5 shrink-0" />
                          <span>
                            {event.agentName ||
                              t("parcels.detail.timeline.unknownAgent")}
                          </span>
                          {event.actorRole && (
                            <Badge
                              variant="outline"
                              className="text-[10px] px-1.5 py-0 leading-4"
                            >
                              {event.actorRole}
                            </Badge>
                          )}
                        </div>
                      )}

                      {/* WHERE — agency + GPS */}
                      {(event.agencyName ||
                        event.locationNote ||
                        (event.latitude != null &&
                          event.longitude != null)) && (
                        <div className="flex items-start gap-1.5 text-sm text-muted-foreground mb-0.5">
                          <Globe className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                          <div className="min-w-0">
                            {event.agencyName && (
                              <span className="font-medium text-foreground">
                                {event.agencyName}
                              </span>
                            )}
                            {event.agencyName && event.locationNote && (
                              <span> — </span>
                            )}
                            {event.locationNote && (
                              <span>{event.locationNote}</span>
                            )}
                            {event.latitude != null &&
                              event.longitude != null &&
                              canValidate && (
                                <p className="text-xs text-muted-foreground/70">
                                  GPS: {event.latitude.toFixed(5)},{" "}
                                  {event.longitude.toFixed(5)}
                                  {event.locationSource &&
                                    ` (${event.locationSource})`}
                                </p>
                              )}
                          </div>
                        </div>
                      )}

                      {/* Proof photo */}
                      {event.proofUrl && (
                        <div className="flex items-center gap-1.5 text-sm mb-0.5">
                          <ImageIcon className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                          <a
                            href={event.proofUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline truncate"
                          >
                            {t("parcels.detail.timeline.viewProof")}
                          </a>
                        </div>
                      )}

                      {/* Comment */}
                      {event.comment && (
                        <div className="flex items-start gap-1.5 text-sm text-muted-foreground">
                          <MessageSquare className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                          <p className="italic">{event.comment}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              onClick={() => {
                if (parcel.proofUrl) {
                  window.open(String(parcel.proofUrl), "_blank");
                } else {
                  toast.info(t("parcels.detail.actions.noPhotoAvailable"));
                }
              }}
            >
              <Camera className="w-4 h-4 mr-2" />
              {t("parcels.detail.actions.viewPhoto")}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                const w = window.open("", "_blank");
                if (!w) { toast.error("Could not open print window"); return; }
                const price = quote.data?.totalPrice ?? quote.data?.basePrice ?? "N/A";
                const html = `<html><head><title>Receipt - ${parcel.trackingRef}</title>
                  <style>body{font-family:Arial,sans-serif;padding:24px;max-width:600px;margin:0 auto}
                  h2{color:#1a1a2e}table{width:100%;border-collapse:collapse;margin:16px 0}
                  td{padding:8px;border-bottom:1px solid #eee}td:first-child{color:#666;width:40%}
                  .footer{margin-top:24px;padding-top:16px;border-top:2px solid #333;font-size:12px;color:#888}</style>
                  </head><body>
                  <h2>SmartCAMPOST - Receipt</h2>
                  <table>
                  <tr><td>Tracking Ref</td><td><strong>${parcel.trackingRef}</strong></td></tr>
                  <tr><td>Status</td><td>${parcel.status}</td></tr>
                  <tr><td>Weight</td><td>${parcel.weight} kg</td></tr>
                  <tr><td>Service</td><td>${parcel.serviceType}</td></tr>
                  <tr><td>Delivery</td><td>${parcel.deliveryOption}</td></tr>
                  <tr><td>Payment</td><td>${parcel.paymentOption || "N/A"}</td></tr>
                  <tr><td>From</td><td>${parcel.senderCity || ""}, ${parcel.senderCountry || ""}</td></tr>
                  <tr><td>To</td><td>${parcel.recipientCity || ""}, ${parcel.recipientCountry || ""}</td></tr>
                  <tr><td>Amount</td><td><strong>${price} XAF</strong></td></tr>
                  <tr><td>Created</td><td>${new Date(parcel.createdAt).toLocaleDateString()}</td></tr>
                  </table>
                  <div class="footer">Generated on ${new Date().toLocaleString()} — SmartCAMPOST</div>
                  </body></html>`;
                w.document.open();
                w.document.write(html);
                w.document.close();
                w.focus();
                setTimeout(() => { try { w.print(); } catch {} }, 300);
              }}
            >
              {t("parcels.detail.actions.downloadReceipt")}
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate(`/${normalizedRole.toLowerCase()}/support?parcelId=${parcel.id}`)}
            >
              {t("parcels.detail.actions.reportIssue")}
            </Button>

            {canValidate && (
              <>
                <Button
                  variant="secondary"
                  onClick={async () => {
                    try {
                      const gps = await getGpsOrThrow();
                      await useValidate.mutateAsync({
                        id: parcel.id,
                        data: {
                          descriptionConfirmed: true,
                          latitude: gps.latitude,
                          longitude: gps.longitude,
                          locationSource: "DEVICE_GPS",
                          deviceTimestamp: new Date().toISOString(),
                          locationNote: "Quick accept",
                        },
                      });
                      toast.success(t("parcels.toasts.accepted"));
                    } catch {
                      toast.error(t("parcels.toasts.acceptFailed"));
                    }
                  }}
                >
                  {t("parcels.detail.actions.accept")}
                </Button>
                <Button
                  variant="outline"
                  onClick={async () => {
                    if (!window.confirm("Confirm that the parcel description and contents are correct?")) return;
                    try {
                      const gps = await getGpsOrThrow();
                      await useValidate.mutateAsync({
                        id: parcel.id,
                        data: {
                          descriptionConfirmed: true,
                          latitude: gps.latitude,
                          longitude: gps.longitude,
                          locationSource: "DEVICE_GPS",
                          deviceTimestamp: new Date().toISOString(),
                          locationNote: "Validated at counter",
                        },
                      });
                      toast.success(t("parcels.toasts.validatedAccepted"));
                    } catch {
                      toast.error(t("parcels.toasts.validationFailed"));
                    }
                  }}
                >
                  {t("parcels.detail.actions.validateAccept")}
                </Button>
                {canCorrectQuery.data?.canCorrect && (
                  <Button
                    variant="outline"
                    disabled={correctParcel.isPending}
                    onClick={async () => {
                      const weightInput = window.prompt(
                        t("parcels.prompts.correctWeight"),
                        String(parcel.weight ?? ""),
                      );
                      if (weightInput === null) return;
                      const declaredValueInput = window.prompt(
                        t("parcels.prompts.correctDeclaredValue"),
                        String(parcel.declaredValue ?? ""),
                      );
                      if (declaredValueInput === null) return;
                      const reason = window.prompt(
                        t("parcels.prompts.correctionReason"),
                      );
                      const weight = weightInput.trim()
                        ? Number(weightInput)
                        : undefined;
                      const declaredValue = declaredValueInput.trim()
                        ? Number(declaredValueInput)
                        : undefined;
                      try {
                        await correctParcel.mutateAsync({
                          id: parcel.id,
                          data: {
                            weight,
                            declaredValue,
                            correctionReason: reason || undefined,
                          },
                        });
                        toast.success(t("parcels.toasts.corrected"));
                      } catch (e) {
                        toast.error(
                          e instanceof Error
                            ? e.message
                            : t("parcels.toasts.correctionFailed"),
                        );
                      }
                    }}
                  >
                    {t("parcels.detail.actions.correct")}
                  </Button>
                )}
                <Button
                  variant="default"
                  disabled={
                    parcel.locked ||
                    parcel.status !== "ACCEPTED" ||
                    useValidateAndLock.isPending
                  }
                  onClick={async () => {
                    try {
                      const gps = await getGpsOrThrow();
                      await useValidateAndLock.mutateAsync({
                        id: parcel.id,
                        latitude: gps.latitude,
                        longitude: gps.longitude,
                      });
                      toast.success(t("parcels.toasts.lockedFinalQr"));
                    } catch {
                      toast.error(t("parcels.toasts.validateLockFailed"));
                    }
                  }}
                >
                  {t("parcels.detail.actions.validateLock")}
                </Button>
              </>
            )}
            <ActionButton
              variant="destructive"
              disabled={!canCancel || updateStatus.isPending}
              tooltip={
                !canCancel && "reason" in cancelDecision
                  ? cancelDecision.reason
                  : undefined
              }
              onClick={async () => {
                if (!canCancel) return;
                try {
                  const gps = await getGpsOrThrow();
                  await updateStatus.mutateAsync({
                    id: parcel.id,
                    data: {
                      status: "CANCELLED",
                      latitude: gps.latitude,
                      longitude: gps.longitude,
                      locationSource: "DEVICE_GPS",
                      deviceTimestamp: new Date().toISOString(),
                      comment: "Cancelled by client",
                    },
                  });
                  toast.success(t("parcels.toasts.cancelled"), {
                    description: t("parcels.toasts.cancelledDescription", {
                      trackingRef: parcel.trackingRef,
                    }),
                  });
                } catch (e) {
                  toast.error(t("parcels.toasts.cancelFailed"));
                }
              }}
            >
              {t("parcels.detail.actions.cancel")}
            </ActionButton>
          </div>
        </CardContent>
      </Card>

      {normalizedRole === "CLIENT" && !isCod && !hasSuccessfulPayment && (
        <Card>
          <CardHeader>
            <CardTitle>{t("parcels.detail.mobileMoneyPayment")}</CardTitle>
            <CardDescription>
              {t("parcels.detail.mobileMoneyPaymentDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              className="w-full"
              onClick={() => navigate(`/${normalizedRole.toLowerCase()}/parcels/${parcel.id}/pay-momo`)}
            >
              {t("parcels.detail.actions.payWithMomo")}
            </Button>
          </CardContent>
        </Card>
      )}

      {canValidate && !isCod && !hasSuccessfulPayment && (
        <Card>
          <CardHeader>
            <CardTitle>{t("parcels.detail.cashPayment", "Cash Payment")}</CardTitle>
            <CardDescription>
              {t("parcels.detail.cashPaymentDescription", "Confirm that the client has paid cash at the agency")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t("parcels.detail.amountDue")}</span>
              <span className="font-medium">
                {quote.isLoading ? "—" : quote.data ? `${quote.data.amount.toLocaleString()} ${quote.data.currency || "XAF"}` : "—"}
              </span>
            </div>
            <Button
              className="w-full"
              disabled={confirmCash.isPending || hasSuccessfulPayment}
              onClick={async () => {
                if (!parcel.id) return;
                try {
                  await confirmCash.mutateAsync(parcel.id);
                  toast.success(t("parcels.toasts.cashConfirmed", "Cash payment confirmed — receipt generated"));
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : t("parcels.toasts.cashConfirmFailed", "Cash confirmation failed"));
                }
              }}
            >
              {hasSuccessfulPayment
                ? t("parcels.detail.alreadyPaid")
                : confirmCash.isPending
                  ? t("common.processing")
                  : t("parcels.detail.confirmCashReceived", "Confirm Cash Received")}
            </Button>
          </CardContent>
        </Card>
      )}

      {canValidate && isCod && (
        <Card>
          <CardHeader>
            <CardTitle>{t("parcels.detail.codPayment")}</CardTitle>
            <CardDescription>
              {t("parcels.detail.codPaymentDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {t("parcels.detail.amountDue")}
              </span>
              <span className="font-medium">
                {quote.isLoading
                  ? "—"
                  : quote.data
                    ? `${quote.data.amount.toLocaleString()} ${quote.data.currency || "XAF"}`
                    : "—"}
              </span>
            </div>

            <Button
              className="w-full"
              disabled={markCodPaid.isPending || hasSuccessfulPayment}
              onClick={async () => {
                if (!parcel.id) return;
                try {
                  await markCodPaid.mutateAsync(parcel.id);
                  toast.success(t("parcels.toasts.codMarkedPaid"));

                  // COD payment marked — no PDF to download
                } catch (e) {
                  toast.error(
                    e instanceof Error
                      ? e.message
                      : t("parcels.toasts.codPaymentFailed"),
                  );
                }
              }}
            >
              {hasSuccessfulPayment
                ? t("parcels.detail.alreadyPaid")
                : markCodPaid.isPending
                  ? t("common.processing")
                  : t("parcels.detail.markCodAsPaid")}
            </Button>
          </CardContent>
        </Card>
      )}

      {!!pricingHistory.data?.length && (
        <Card>
          <CardHeader>
            <CardTitle>{t("parcels.detail.pricingHistory")}</CardTitle>
            <CardDescription>
              {t("parcels.detail.pricingHistoryDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {pricingHistory.data.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between border-b pb-2 text-sm last:border-0 last:pb-0"
              >
                <div className="space-y-0.5">
                  <p className="font-medium">
                    {entry.serviceType} · {entry.originZone} →{" "}
                    {entry.destinationZone} ({entry.weightBracket})
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(entry.appliedAt).toLocaleString()}
                  </p>
                </div>
                <span className="font-medium">
                  {entry.appliedPrice.toLocaleString()} XAF
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
      {/* ── Authorize someone else to collect ── */}
      {role === "CLIENT" && parcel.status !== "DELIVERED" && parcel.status !== "CANCELLED" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4" />
              Authorize Someone to Collect
            </CardTitle>
            <CardDescription>
              If you cannot collect this parcel yourself, authorize someone else. They will receive a PIN code via SMS.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DelegateForm parcelId={parcel.id} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function DelegateForm({ parcelId }: { parcelId: string }) {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [relationship, setRelationship] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ pinCode?: string; delegateName?: string } | null>(null);

  const submit = async () => {
    if (!name.trim() || !phone.trim()) return;
    setBusy(true);
    try {
      const res = await httpClient.post(`/parcels/${parcelId}/delegates`, {
        delegateName: name,
        delegatePhone: phone,
        delegateIdNumber: idNumber || undefined,
        relationship: relationship || undefined,
      });
      setResult(res as any);
      toast.success(t("parcels.detail.delegateSuccess", "Delegate authorized! PIN sent via SMS."));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to authorize delegate");
    } finally {
      setBusy(false);
    }
  };

  if (result) {
    return (
      <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 p-4 space-y-2">
        <p className="font-semibold text-emerald-700 dark:text-emerald-300">
          {t("parcels.detail.delegateAuthorized", "Delegate authorized")}
        </p>
        <p className="text-sm">{result.delegateName} — PIN: <span className="font-mono font-bold text-lg">{result.pinCode}</span></p>
        <p className="text-xs text-muted-foreground">{t("parcels.detail.delegatePinSent", "This PIN was also sent via SMS to the delegate's phone.")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="text-sm font-medium">Full Name <span className="text-destructive">*</span></label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Jean Dupont" />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Phone Number <span className="text-destructive">*</span></label>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+237 6XX XXX XXX" type="tel" />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="text-sm font-medium">ID Card Number <span className="text-muted-foreground">(Optional)</span></label>
          <Input value={idNumber} onChange={(e) => setIdNumber(e.target.value)} placeholder="e.g. 123456789" />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Relationship <span className="text-muted-foreground">(Optional)</span></label>
          <Input value={relationship} onChange={(e) => setRelationship(e.target.value)} placeholder="Spouse, Friend, Colleague..." />
        </div>
      </div>
      <Button onClick={submit} disabled={busy || !name.trim() || !phone.trim()} size="sm" type="button">
        {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Users className="h-4 w-4 mr-2" />}
        Authorize & Send PIN
      </Button>
    </div>
  );
}
