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
} from "lucide-react";
import type { ComponentType } from "react";
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
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/StatusBadge";
import { TrackingMap } from "@/components/maps";
import { QRCodeDisplay } from "@/components/qrcode";
import { canTransition } from "@/lib/transitions";
import { ActionButton } from "@/components/transitions/ActionButton";
import { EmptyState } from "@/components/EmptyState";
import { invoiceService } from "@/services";
import {
  useParcel,
  useScanEventsForParcel,
  usePricingQuote,
  usePaymentsForParcel,
  useMarkCodAsPaid,
  useUpdateParcelStatus,
  useValidateAndAccept,
  useValidateAndLockParcel,
} from "@/hooks";
import { toast } from "sonner";
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

  const authUser = useAuthStore((s) => s.user);
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
  const paymentsForParcel = usePaymentsForParcel(id || "");
  const markCodPaid = useMarkCodAsPaid();
  // mutation hooks must be called unconditionally

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
          />
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
        <QRCodeDisplay
          trackingRef={parcel.trackingRef}
          parcelId={parcel.id}
          qrContent={
            parcel.locked && parcel.qrStatus === "FINAL"
              ? (parcel.finalQrCode as string | undefined)
              : undefined
          }
          senderCity={parcel.senderCity}
          recipientCity={parcel.recipientCity}
          serviceType={parcel.serviceType}
          createdAt={parcel.createdAt}
          size="medium"
          showLabel={true}
          showActions={true}
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
                              event.longitude != null && (
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
              onClick={async () => {
                try {
                  const invoices = await invoiceService.listByParcel(parcel.id);
                  const latest = Array.isArray(invoices)
                    ? invoices[0]
                    : undefined;
                  if (latest?.id) {
                    window.open(invoiceService.pdfUrl(latest.id), "_blank");
                  } else {
                    toast.info(t("parcels.detail.actions.noReceiptAvailable"));
                  }
                } catch {
                  toast.error(
                    t("parcels.detail.actions.receiptDownloadFailed"),
                  );
                }
              }}
            >
              {t("parcels.detail.actions.downloadReceipt")}
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate(`/client/support?parcelId=${parcel.id}`)}
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
                    const confirm = window.prompt(
                      t("parcels.prompts.confirmDescription"),
                    );
                    if (!confirm || confirm.toLowerCase() !== "y") return;
                    const photo = window.prompt(
                      t("parcels.prompts.optionalPhotoUrl"),
                    );
                    try {
                      const gps = await getGpsOrThrow();
                      await useValidate.mutateAsync({
                        id: parcel.id,
                        data: {
                          descriptionConfirmed: true,
                          photoUrl: photo || undefined,
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

                  // Fetch latest invoice for this parcel and open PDF
                  const invoices = await invoiceService.listByParcel(parcel.id);
                  const latest = Array.isArray(invoices)
                    ? invoices[0]
                    : undefined;
                  if (latest?.id) {
                    window.open(invoiceService.pdfUrl(latest.id), "_blank");
                  }
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
    </div>
  );
}
