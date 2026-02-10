/**
 * QR Code Display Component
 * Displays a printable QR code label for parcels
 * The QR code contains tracking reference and can be printed on adhesive labels
 */
import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { QRCodeSVG } from "qrcode.react";
import {
  Printer,
  Download,
  Copy,
  Package,
  MapPin,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

interface QRCodeDisplayProps {
  trackingRef: string;
  parcelId?: string;
  qrContent?: string;
  senderName?: string;
  senderCity?: string;
  recipientName?: string;
  recipientCity?: string;
  serviceType?: string;
  createdAt?: string;
  size?: "small" | "medium" | "large";
  showLabel?: boolean;
  showActions?: boolean;
}

const sizeMap = {
  small: 100,
  medium: 150,
  large: 200,
};

export function QRCodeDisplay({
  trackingRef,
  parcelId,
  qrContent,
  senderName,
  senderCity,
  recipientName,
  recipientCity,
  serviceType,
  createdAt,
  size = "medium",
  showLabel = true,
  showActions = true,
}: QRCodeDisplayProps) {
  const { t } = useTranslation();
  const printRef = useRef<HTMLDivElement>(null);

  // PARTIAL default payload: JSON with trackingRef + parcelId for scanner compatibility.
  // FINAL payload: pass `qrContent` (secure V1|...) from the parent.
  const qrData =
    qrContent ||
    JSON.stringify({
      trackingRef,
      parcelId,
      type: "SMARTCAMPOST_PARCEL",
      version: 1,
    });

  const handlePrint = () => {
    if (!printRef.current) return;

    const printContent = printRef.current.innerHTML;
    const printWindow = window.open("", "_blank", "width=400,height=600");
    if (!printWindow) {
      toast.error(t("qrcode.display.toasts.printWindowBlocked"));
      return;
    }

    // Enhanced print styles for thermal/label printers
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>SmartCAMPOST - Label ${trackingRef}</title>
          <style>
            /* Reset and base styles */
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              font-family: Arial, Helvetica, sans-serif;
              background: white;
              display: flex;
              justify-content: center;
              align-items: flex-start;
              padding: 10mm;
            }
            
            .label {
              border: 2px solid #000;
              padding: 12px;
              width: 80mm; /* Standard label width */
              max-width: 100%;
              background: white;
              page-break-inside: avoid;
            }
            
            .header {
              text-align: center;
              border-bottom: 1px solid #333;
              padding-bottom: 8px;
              margin-bottom: 8px;
            }
            
            .header h1 {
              margin: 0;
              font-size: 14pt;
              font-weight: bold;
              color: #000;
            }
            
            .header p {
              margin: 2px 0 0 0;
              font-size: 8pt;
              color: #333;
            }
            
            .qr-container {
              text-align: center;
              padding: 10px 0;
            }
            
            .qr-container svg {
              max-width: 100%;
              height: auto;
            }
            
            .tracking-ref {
              text-align: center;
              font-size: 12pt;
              font-weight: bold;
              font-family: 'Courier New', Courier, monospace;
              letter-spacing: 2px;
              padding: 8px;
              background: #f0f0f0;
              border: 1px solid #ccc;
              margin: 8px 0;
            }
            
            .info-row {
              display: flex;
              justify-content: space-between;
              font-size: 9pt;
              margin: 4px 0;
              padding: 2px 0;
            }
            
            .info-label {
              color: #555;
            }
            
            .info-value {
              font-weight: bold;
              color: #000;
            }
            
            .route {
              text-align: center;
              font-size: 10pt;
              padding: 8px;
              background: #f5f5f5;
              border: 1px solid #ddd;
              margin-top: 8px;
            }
            
            .route-arrow {
              font-size: 14pt;
              margin: 0 8px;
            }

            /* Print-specific styles */
            @media print {
              @page {
                size: 80mm auto; /* Width fixed, height automatic */
                margin: 5mm;
              }
              
              body {
                margin: 0;
                padding: 0;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              
              .label {
                border-width: 1px;
                width: 100%;
                max-width: 75mm;
              }
              
              /* Ensure QR code prints clearly */
              .qr-container svg {
                width: 45mm !important;
                height: 45mm !important;
              }
              
              /* Hide browser UI elements */
              .no-print {
                display: none !important;
              }
            }
            
            /* Button for manual print trigger */
            .print-btn {
              display: block;
              width: 100%;
              margin-top: 15px;
              padding: 12px;
              background: #2563eb;
              color: white;
              border: none;
              border-radius: 6px;
              font-size: 14px;
              font-weight: bold;
              cursor: pointer;
            }
            
            .print-btn:hover {
              background: #1d4ed8;
            }
            
            @media print {
              .print-btn {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          ${printContent}
          <button class="print-btn no-print" onclick="window.print()">
            🖨️ Print Label
          </button>
          <script>
            // Auto-trigger print dialog after content loads
            window.onload = function() {
              // Small delay to ensure content is fully rendered
              setTimeout(function() {
                window.print();
              }, 500);
            };
            
            // Close window after printing (optional)
            window.onafterprint = function() {
              // Uncomment below to auto-close after print
              // window.close();
            };
          </script>
        </body>
      </html>
    `);

    printWindow.document.close();
    toast.success(t("qrcode.display.toasts.printDialogOpened"));
  };

  const handleDownload = () => {
    const svg = document.getElementById(`qr-${trackingRef}`);
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `SmartCAMPOST-${trackingRef}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
      toast.success(t("qrcode.display.toasts.downloaded"));
    };

    img.src =
      "data:image/svg+xml;base64," +
      btoa(unescape(encodeURIComponent(svgData)));
  };

  const handleCopyTracking = async () => {
    try {
      await navigator.clipboard.writeText(trackingRef);
      toast.success(t("qrcode.display.toasts.copied"));
    } catch {
      toast.error(t("qrcode.display.toasts.copyFailed"));
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Package className="h-4 w-4" />
          {t("qrcode.display.title")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Printable Label Area */}
        <div ref={printRef}>
          <div className="label border rounded-lg p-4 bg-white">
            {/* Header */}
            <div className="header text-center border-b pb-2 mb-3">
              <h1 className="text-sm font-bold text-primary">SMARTCAMPOST</h1>
              <p className="text-xs text-muted-foreground">
                Suivi de Colis / Parcel Tracking
              </p>
            </div>

            {/* QR Code */}
            <div className="qr-container flex justify-center py-4">
              <QRCodeSVG
                id={`qr-${trackingRef}`}
                value={qrData}
                size={sizeMap[size]}
                level="H"
                includeMargin={true}
                imageSettings={{
                  src: "/logo-small.png",
                  height: 24,
                  width: 24,
                  excavate: true,
                }}
              />
            </div>

            {/* Tracking Reference */}
            <div className="tracking-ref text-center font-mono text-sm font-bold bg-muted px-3 py-2 rounded">
              {trackingRef}
            </div>

            {showLabel && (
              <>
                {/* Route Info */}
                {(senderCity || recipientCity) && (
                  <div className="route flex items-center justify-center gap-2 text-xs mt-3 bg-muted/50 rounded p-2">
                    <span className="font-medium">
                      {senderCity || "Origin"}
                    </span>
                    <MapPin className="h-3 w-3" />
                    <span>→</span>
                    <span className="font-medium">
                      {recipientCity || "Destination"}
                    </span>
                  </div>
                )}

                {/* Additional Info */}
                <div className="mt-3 space-y-1 text-xs">
                  {senderName && (
                    <div className="info-row flex justify-between">
                      <span className="info-label text-muted-foreground">
                        Expéditeur:
                      </span>
                      <span className="info-value font-medium">
                        {senderName}
                      </span>
                    </div>
                  )}
                  {recipientName && (
                    <div className="info-row flex justify-between">
                      <span className="info-label text-muted-foreground">
                        Destinataire:
                      </span>
                      <span className="info-value font-medium">
                        {recipientName}
                      </span>
                    </div>
                  )}
                  {serviceType && (
                    <div className="info-row flex justify-between">
                      <span className="info-label text-muted-foreground">
                        Service:
                      </span>
                      <span className="info-value font-medium">
                        {serviceType}
                      </span>
                    </div>
                  )}
                  {createdAt && (
                    <div className="info-row flex justify-between items-center">
                      <span className="info-label text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Date:
                      </span>
                      <span className="info-value font-medium">
                        {formatDate(createdAt)}
                      </span>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        {showActions && (
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-1" />
              Print
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-1" />
              Download
            </Button>
            <Button variant="outline" size="sm" onClick={handleCopyTracking}>
              <Copy className="h-4 w-4 mr-1" />
              Copy Ref
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default QRCodeDisplay;
