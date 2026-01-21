import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import QRCodeDisplay from "@/components/qrcode/QRCodeDisplay";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import apiClient from "@/lib/api";

interface TemporaryQrData {
  pickupId: string;
  temporaryToken: string;
  expiresAt: string;
  isValid: boolean;
  parcelId: string;
  preTrackingRef: string;
  clientName: string;
  clientPhone: string;
  pickupAddressLabel: string;
  city: string;
  region: string;
}

export default function PickupQrPage() {
  const { t } = useTranslation();
  const { pickupId } = useParams<{ pickupId: string }>();
  const [qrData, setQrData] = useState<TemporaryQrData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!pickupId) return;
    let mounted = true;

    const fetchQr = async () => {
      try {
        setLoading(true);
        const data = await apiClient.post<TemporaryQrData>(
          `/api/qr/pickup/${pickupId}/temporary`,
        );
        if (!mounted) return;
        setQrData(data);
      } catch {
        if (mounted) toast.error(t("pickup.qr.error"));
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchQr();
    return () => {
      mounted = false;
    };
  }, [pickupId, t]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin mb-4" />
        <span>{t("pickup.qr.loading")}</span>
      </div>
    );
  }

  if (!qrData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <span>{t("pickup.qr.notFound")}</span>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>{t("pickup.qr.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 text-sm text-muted-foreground">
            {t("pickup.qr.instructions")}
          </div>
          <QRCodeDisplay
            trackingRef={qrData.preTrackingRef}
            parcelId={qrData.parcelId}
            senderName={qrData.clientName}
            senderCity={qrData.city}
            recipientName={undefined}
            recipientCity={undefined}
            serviceType={undefined}
            createdAt={undefined}
            size="medium"
            showLabel={true}
            showActions={true}
          />
          <div className="mt-4 text-xs text-muted-foreground">
            {t("pickup.qr.validUntil", {
              date: new Date(qrData.expiresAt).toLocaleString(),
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
