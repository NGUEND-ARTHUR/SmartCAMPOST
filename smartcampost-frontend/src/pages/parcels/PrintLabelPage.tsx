import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import apiClient from "@/lib/api";

interface QrLabelData {
  parcelId: string;
  trackingRef: string;
  barcode: string;
  qrCodeImage: string;
  qrContent: string;
  companyName: string;
  companyLogo: string;
  labelTitle: string;
  senderName: string;
  senderCity: string;
  senderPhone: string;
  recipientName: string;
  recipientCity: string;
  recipientPhone: string;
  recipientAddress: string;
  totalAmount: number;
  paymentStatus: string;
  currency: string;
  printedAt: string;
  labelSize: string;
  copiesCount: number;
}

export default function PrintLabelPage() {
  const { t } = useTranslation();
  const { parcelId } = useParams<{ parcelId: string }>();
  const [label, setLabel] = useState<QrLabelData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!parcelId) return;
    let mounted = true;

    const fetchLabel = async () => {
      try {
        setLoading(true);
        const data = await apiClient.get<QrLabelData>(
          `/api/qr/label/${parcelId}`,
        );
        if (!mounted) return;
        setLabel(data);
      } catch (err) {
        if (mounted) toast.error(t("label.print.error"));
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchLabel();
    return () => {
      mounted = false;
    };
  }, [parcelId, t]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin mb-4" />
        <span>{t("label.print.loading")}</span>
      </div>
    );
  }

  if (!label) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <span>{t("label.print.notFound")}</span>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>{t("label.print.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 text-sm text-muted-foreground">
            {t("label.print.instructions")}
          </div>
          <div className="border rounded p-4 bg-white">
            <img
              src={`data:image/png;base64,${label.qrCodeImage}`}
              alt="QR Code"
              className="mx-auto mb-2 w-[150px] h-[150px]"
            />
            <div className="text-center font-mono text-sm font-bold mb-2">
              {label.trackingRef}
            </div>
            <div className="text-xs text-muted-foreground mb-1">
              {label.labelTitle}
            </div>
            <div className="text-xs mb-1">
              {t("label.print.sender")}: {label.senderName} ({label.senderCity})
            </div>
            <div className="text-xs mb-1">
              {t("label.print.recipient")}: {label.recipientName} (
              {label.recipientCity})
            </div>
            <div className="text-xs mb-1">
              {t("label.print.amount")}: {label.totalAmount} {label.currency} (
              {label.paymentStatus})
            </div>
            <div className="text-xs mb-1">
              {t("label.print.size")}: {label.labelSize}
            </div>
            <div className="text-xs mb-1">
              {t("label.print.copies")}: {label.copiesCount}
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              {t("label.print.printedAt", {
                date: new Date(label.printedAt).toLocaleString(),
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
