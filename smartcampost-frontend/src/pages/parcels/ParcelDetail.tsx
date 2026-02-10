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
import { ScanEvent, Parcel } from "@/types";
import { canTransition } from "@/lib/transitions";
import { ActionButton } from "@/components/transitions/ActionButton";
import { EmptyState } from "@/components/EmptyState";
import {
  useParcel,
  useScanEventsForParcel,
  usePricingQuote,
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
            <CardTitle>Addresses</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-blue-600" />
                </div>
                <p className="font-medium">Sender</p>
              </div>
              <div className="ml-10 text-sm text-muted-foreground">
                <p>John Doe</p>
                <p>123 Main Street</p>
                <p>Douala, Littoral</p>
                <p>Cameroon</p>
              </div>
            </div>
            <Separator />
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-green-600" />
                </div>
                <p className="font-medium">Recipient</p>
              </div>
              <div className="ml-10 text-sm text-muted-foreground">
                <p>Jane Smith</p>
                <p>456 Avenue de l'Indépendance</p>
                <p>Yaoundé, Centre</p>
                <p>Cameroon</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* QR Code for Printing */}
        <QRCodeDisplay
          trackingRef={parcel.trackingRef}
          parcelId={parcel.id}
          qrContent={
            (parcel as any).locked && (parcel as any).qrStatus === "FINAL"
              ? ((parcel as any).finalQrCode as string | undefined)
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
          <CardTitle>Tracking Timeline</CardTitle>
          <CardDescription>
            Complete history of your parcel's journey
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            {scanEvents.map((event, index) => {
              const Icon = eventIcons[event.eventType] || Package;
              const isLast = index === scanEvents.length - 1;
              return (
                <div key={event.id} className="relative pb-8">
                  {!isLast && (
                    <div className="absolute left-4 top-10 bottom-0 w-0.5 bg-gray-200" />
                  )}
                  <div className="flex gap-4">
                    <div
                      className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center ${index === 0 ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"}`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 pt-0.5">
                      <div className="flex items-start justify-between mb-1">
                        <div>
                          <p className="font-medium">{event.eventType}</p>
                          {event.locationNote && (
                            <p className="text-sm text-muted-foreground">
                              {event.locationNote}
                            </p>
                          )}
                        </div>
                        <time className="text-sm text-muted-foreground">
                          {new Date(event.timestamp).toLocaleDateString()}
                        </time>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tracking Map</CardTitle>
          <CardDescription>
            Visual representation of your parcel&apos;s journey
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

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-3">
            <Button variant="outline">
              <Camera className="w-4 h-4 mr-2" />
              {t("parcels.detail.actions.viewPhoto")}
            </Button>
            <Button variant="outline">
              {t("parcels.detail.actions.downloadReceipt")}
            </Button>
            <Button variant="outline">
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
                    (parcel as any).locked ||
                    parcel.status !== "ACCEPTED" ||
                    (useValidateAndLock as any).isLoading
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
              disabled={!canCancel || (updateStatus as any).isLoading}
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
    </div>
  );
}
