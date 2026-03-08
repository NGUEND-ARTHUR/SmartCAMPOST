import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Clock, Loader2, Package, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QRCodeDisplay } from "@/components/qrcode";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/EmptyState";
import { StatusBadge } from "@/components/StatusBadge";
import { useParcel } from "@/hooks";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";

export default function QRCodePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const authUser = useAuthStore((s) => s.user);

  const normalizedRole = (() => {
    const raw = String(authUser?.role || "CLIENT").toUpperCase();
    if (raw === "USER") return "CLIENT";
    return raw;
  })();

  const basePath =
    normalizedRole === "ADMIN"
      ? "/admin"
      : normalizedRole === "STAFF"
        ? "/staff"
        : "/client";

  const { data: parcel, isLoading, error } = useParcel(id || "");

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !parcel) {
    return (
      <div className="space-y-6 max-w-lg mx-auto p-4">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t("common.back")}
        </Button>
        <EmptyState
          icon={Package}
          title={t("parcels.detail.notFoundTitle")}
          description={
            error instanceof Error
              ? error.message
              : t("parcels.detail.notFoundDescription")
          }
        />
      </div>
    );
  }

  const handleShare = async () => {
    const url = `${window.location.origin}/tracking?ref=${encodeURIComponent(parcel.trackingRef || "")}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `SmartCAMPOST - ${parcel.trackingRef}`,
          text: t("qrCodePage.shareText", { trackingRef: parcel.trackingRef }),
          url,
        });
      } catch {
        // User cancelled share
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        toast.success(t("qrCodePage.linkCopied"));
      } catch {
        toast.error(t("qrCodePage.copyFailed"));
      }
    }
  };

  return (
    <div className="max-w-lg mx-auto space-y-6 p-4">
      <Button
        variant="ghost"
        onClick={() => navigate(`${basePath}/parcels/${id}`)}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        {t("parcels.detail.backToParcels")}
      </Button>

      <div className="text-center">
        <h1 className="text-2xl font-bold mb-1">{t("qrCodePage.title")}</h1>
        <p className="text-muted-foreground">{t("qrCodePage.subtitle")}</p>
      </div>

      {/* Parcel Summary */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{parcel.trackingRef}</CardTitle>
            <StatusBadge status={parcel.status} />
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-muted-foreground">
              {t("parcels.detail.sender")}
            </span>
            <p className="font-medium">{parcel.senderCity || "—"}</p>
          </div>
          <div>
            <span className="text-muted-foreground">
              {t("parcels.detail.recipient")}
            </span>
            <p className="font-medium">{parcel.recipientCity || "—"}</p>
          </div>
          {parcel.serviceType && (
            <div>
              <span className="text-muted-foreground">
                {t("parcels.detail.serviceType")}
              </span>
              <p className="font-medium">{parcel.serviceType}</p>
            </div>
          )}
          {parcel.weight && (
            <div>
              <span className="text-muted-foreground">
                {t("parcels.detail.weight")}
              </span>
              <p className="font-medium">{parcel.weight} kg</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* QR Code Display */}
      {parcel.qrStatus === "FINAL" ? (
        <QRCodeDisplay
          trackingRef={parcel.trackingRef || parcel.id}
          parcelId={parcel.id}
          qrContent={parcel.finalQrCode as string | undefined}
          senderCity={parcel.senderCity}
          recipientCity={parcel.recipientCity}
          serviceType={parcel.serviceType}
          createdAt={parcel.createdAt}
          size="large"
          showLabel={true}
          showActions={true}
        />
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10 text-center space-y-3">
            <Clock className="w-12 h-12 text-muted-foreground" />
            <Badge variant="secondary">
              <Clock className="w-3 h-3 mr-1" />
              Pending Approval
            </Badge>
            <p className="text-sm text-muted-foreground max-w-xs">
              The final QR code will be generated after the parcel is validated
              and approved by staff.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Share Button */}
      <Button variant="outline" className="w-full" onClick={handleShare}>
        <Share2 className="w-4 h-4 mr-2" />
        {t("qrCodePage.shareTracking")}
      </Button>
    </div>
  );
}
