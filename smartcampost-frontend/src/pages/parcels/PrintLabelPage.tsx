import { useParams } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { QRCodeDisplay } from "@/components/qrcode";
import { useParcel, usePricingQuote } from "@/hooks";

export default function PrintLabelPage() {
  const { t } = useTranslation();
  const { parcelId } = useParams<{ parcelId: string }>();
  const [readyToPrint, setReadyToPrint] = useState(false);
  const hasPrintedRef = useRef(false);

  const parcelQuery = useParcel(parcelId || "");
  const quoteQuery = usePricingQuote(parcelId || "");

  useEffect(() => {
    hasPrintedRef.current = false;
    setReadyToPrint(false);
  }, [parcelId]);

  useEffect(() => {
    const parcel = parcelQuery.data;
    if (!parcel) return;
    if (!readyToPrint) return;
    if (hasPrintedRef.current) return;
    hasPrintedRef.current = true;

    const id = window.setTimeout(() => {
      try {
        window.print();
      } catch {
        // ignore
      }
    }, 300);

    return () => window.clearTimeout(id);
  }, [parcelQuery.data, readyToPrint]);

  useEffect(() => {
    if (parcelQuery.data) {
      // QRCodeSVG renders synchronously; allow one paint before printing.
      const id = window.setTimeout(() => setReadyToPrint(true), 50);
      return () => window.clearTimeout(id);
    }
  }, [parcelQuery.data]);

  if (parcelQuery.isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin mb-4" />
        <span>{t("label.print.loading")}</span>
      </div>
    );
  }

  if (parcelQuery.error || !parcelQuery.data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <span>{t("label.print.notFound")}</span>
      </div>
    );
  }

  const parcel = parcelQuery.data;
  const quote = quoteQuery.data;
  const amountText = quote
    ? `${quote.amount?.toLocaleString?.() ?? quote.amount} ${quote.currency || "XAF"}`
    : "—";

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
            <div className="flex justify-center mb-2">
              <QRCodeDisplay
                trackingRef={parcel.trackingRef}
                parcelId={parcel.id}
                size="medium"
                showActions={false}
                showLabel={false}
              />
            </div>
            <div className="text-center font-mono text-sm font-bold mb-2">
              {parcel.trackingRef}
            </div>
            <div className="text-xs mb-1">
              {t("label.print.sender")}: {parcel.senderCity || "—"}
            </div>
            <div className="text-xs mb-1">
              {t("label.print.recipient")}: {parcel.recipientCity || "—"}
            </div>
            <div className="text-xs mb-1">
              {t("label.print.amount")}: {amountText}
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              {t("label.print.printedAt", {
                date: new Date().toLocaleString(),
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
