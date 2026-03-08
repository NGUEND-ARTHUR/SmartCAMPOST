import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { QRCodeDisplay } from "./QRCodeDisplay";
import { Badge } from "@/components/ui/badge";
import { Clock, ShieldCheck } from "lucide-react";
import type { QrStatus } from "@/types";

interface QRCodeViewerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trackingRef: string;
  parcelId?: string;
  qrContent?: string;
  qrStatus?: QrStatus;
  senderName?: string;
  senderCity?: string;
  recipientName?: string;
  recipientCity?: string;
  serviceType?: string;
  createdAt?: string;
}

export function QRCodeViewerDialog({
  open,
  onOpenChange,
  trackingRef,
  parcelId,
  qrContent,
  qrStatus,
  senderName,
  senderCity,
  recipientName,
  recipientCity,
  serviceType,
  createdAt,
}: QRCodeViewerDialogProps) {
  const isFinal = qrStatus === "FINAL";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            QR Code — {trackingRef}
            {qrStatus && (
              <Badge variant={isFinal ? "default" : "secondary"}>
                {isFinal ? (
                  <>
                    <ShieldCheck className="w-3 h-3 mr-1" />
                    Final
                  </>
                ) : (
                  <>
                    <Clock className="w-3 h-3 mr-1" />
                    Pending Approval
                  </>
                )}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        {isFinal || qrContent ? (
          <QRCodeDisplay
            trackingRef={trackingRef}
            parcelId={parcelId}
            qrContent={qrContent}
            senderName={senderName}
            senderCity={senderCity}
            recipientName={recipientName}
            recipientCity={recipientCity}
            serviceType={serviceType}
            createdAt={createdAt}
            size="large"
          />
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center space-y-3">
            <Clock className="w-12 h-12 text-muted-foreground" />
            <p className="text-sm font-medium">Pending Approval</p>
            <p className="text-xs text-muted-foreground max-w-xs">
              The final QR code will be generated after the parcel is validated
              and approved by staff. A partial reference is available for
              internal tracking.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
