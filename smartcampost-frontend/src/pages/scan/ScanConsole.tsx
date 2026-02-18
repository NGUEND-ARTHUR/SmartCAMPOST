import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { useTranslation } from "react-i18next";
import {
  AlertCircle,
  CheckCircle2,
  History,
  Package,
  RefreshCw,
  Scan,
  Camera,
  Keyboard,
} from "lucide-react";
import { toast } from "sonner";
import { useRecordScanEvent } from "@/hooks";
import { QRCodeScanner } from "@/components/qrcode";
import { verifyQrCodeContent } from "@/services/scan/qrVerification.api";

interface ScanEvent {
  id: string;
  trackingNumber: string;
  timestamp: string;
  status: string;
  success: boolean;
}

export default function ScanConsole() {
  const { t } = useTranslation();
  const [barcode, setBarcode] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("CREATED");
  const [location, setLocation] = useState(t("scan.defaultLocation"));

  const statusOptions = [
    { value: "CREATED", label: t("scan.status.created") },
    { value: "AT_ORIGIN_AGENCY", label: t("scan.status.atOriginAgency") },
    { value: "IN_TRANSIT", label: t("scan.status.inTransit") },
    { value: "ARRIVED_HUB", label: t("scan.status.arrivedHub") },
    { value: "DEPARTED_HUB", label: t("scan.status.departedHub") },
    {
      value: "ARRIVED_DESTINATION",
      label: t("scan.status.arrivedDestination"),
    },
    { value: "OUT_FOR_DELIVERY", label: t("scan.status.outForDelivery") },
    { value: "DELIVERED", label: t("scan.status.delivered") },
    { value: "RETURNED", label: t("scan.status.returned") },
  ];
  const [scanHistory, setScanHistory] = useState<ScanEvent[]>([]);
  const [scanMode, setScanMode] = useState<"camera" | "manual">("camera");
  const inputRef = useRef<HTMLInputElement>(null);

  const recordScan = useRecordScanEvent();

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

  useEffect(() => {
    // Auto-focus the barcode input
    inputRef.current?.focus();
  }, []);

  const handleScan = async () => {
    if (!barcode.trim()) {
      toast.error(t("scan.error.enterTrackingNumber"));
      return;
    }

    let gps: { latitude: number; longitude: number };
    try {
      gps = await getGpsOrThrow();
    } catch {
      toast.error(t("scan.error.gpsRequired"));
      return;
    }

    recordScan.mutate(
      {
        parcelId: barcode,
        eventType: selectedStatus,
        locationNote: location,
        latitude: gps.latitude,
        longitude: gps.longitude,
        locationSource: "DEVICE_GPS",
        deviceTimestamp: new Date().toISOString(),
      },
      {
        onSuccess: () => {
          const newScan: ScanEvent = {
            id: Date.now().toString(),
            trackingNumber: barcode,
            timestamp: new Date().toISOString(),
            status: selectedStatus,
            success: true,
          };
          setScanHistory([newScan, ...scanHistory]);
          toast.success(t("scan.success.scanned", { barcode }), {
            description: t("scan.success.eventType", {
              status: selectedStatus,
            }),
          });
          setBarcode("");
          inputRef.current?.focus();
        },
        onError: (error) => {
          const newScan: ScanEvent = {
            id: Date.now().toString(),
            trackingNumber: barcode,
            timestamp: new Date().toISOString(),
            status: selectedStatus,
            success: false,
          };
          setScanHistory([newScan, ...scanHistory]);
          toast.error(t("scan.error.failed"), {
            description:
              error instanceof Error ? error.message : t("scan.error.unknown"),
          });
        },
      },
    );
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      void handleScan();
    }
  };

  const clearHistory = () => {
    setScanHistory([]);
    toast.info(t("scan.info.historyCleared"));
  };

  // Handle QR code scan from camera
  const handleQRScan = (result: {
    success: boolean;
    data?: { trackingRef: string; parcelId?: string };
    rawText?: string;
  }) => {
    if (!result.success || !result.data) return;

    const trackingRef = result.data.trackingRef;
    setBarcode(trackingRef);

    // Auto-submit the scan (GPS required)
    void (async () => {
      let gps: { latitude: number; longitude: number };
      try {
        gps = await getGpsOrThrow();
      } catch {
        toast.error(t("scan.error.gpsRequired"));
        return;
      }

      // If this is a secure FINAL QR payload, verify with backend first.
      // We must obtain parcelId (UUID) from the verification response.
      let parcelIdForScan = result.data?.parcelId;
      const raw = result.rawText || "";
      if (raw.startsWith("V1|")) {
        try {
          const verification = await verifyQrCodeContent(raw);
          if (!verification.valid || !verification.parcelId) {
            toast.error(t("scan.error.qrVerificationFailed"), {
              description: verification.message,
            });
            return;
          }
          parcelIdForScan = verification.parcelId;
        } catch (e) {
          toast.error(t("scan.error.qrVerificationFailed"));
          return;
        }
      }

      if (!parcelIdForScan) {
        toast.error(t("scan.error.missingParcelId"));
        return;
      }

      recordScan.mutate(
        {
          parcelId: parcelIdForScan,
          eventType: selectedStatus,
          locationNote: location,
          latitude: gps.latitude,
          longitude: gps.longitude,
          locationSource: "DEVICE_GPS",
          deviceTimestamp: new Date().toISOString(),
        },
        {
          onSuccess: () => {
            const newScan: ScanEvent = {
              id: Date.now().toString(),
              trackingNumber: trackingRef,
              timestamp: new Date().toISOString(),
              status: selectedStatus,
              success: true,
            };
            setScanHistory([newScan, ...scanHistory]);
            toast.success(t("scan.success.qrScanned", { trackingRef }), {
              description: t("scan.success.eventType", {
                status: selectedStatus,
              }),
            });
            setBarcode("");
          },
          onError: (error) => {
            const newScan: ScanEvent = {
              id: Date.now().toString(),
              trackingNumber: trackingRef,
              timestamp: new Date().toISOString(),
              status: selectedStatus,
              success: false,
            };
            setScanHistory([newScan, ...scanHistory]);
            toast.error(t("scan.error.failed"), {
              description:
                error instanceof Error
                  ? error.message
                  : t("scan.error.unknown"),
            });
          },
        },
      );
    })();
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-2">{t("scan.title")}</h1>
          <p className="text-muted-foreground">{t("scan.subtitle")}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Scan Panel */}
          <div className="space-y-6">
            {/* Scanner Card */}
            <div className="bg-card text-card-foreground rounded-lg shadow-lg p-8 border border-border">
              {/* Mode Toggle */}
              <div className="flex justify-center gap-2 mb-6">
                <button
                  onClick={() => setScanMode("camera")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                    scanMode === "camera"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  }`}
                >
                  <Camera className="w-4 h-4" />
                  {t("scan.mode.camera")}
                </button>
                <button
                  onClick={() => setScanMode("manual")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                    scanMode === "manual"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  }`}
                >
                  <Keyboard className="w-4 h-4" />
                  {t("scan.mode.manual")}
                </button>
              </div>

              {scanMode === "camera" ? (
                /* Camera QR Scanner */
                <div className="space-y-4">
                  <QRCodeScanner
                    onScan={handleQRScan}
                    autoStart={true}
                    continuous={true}
                    scanDelay={3000}
                    showHistory={false}
                  />

                  {/* Status Selection for Camera Mode */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      {t("scan.status.label")}
                    </label>
                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className="w-full border border-input bg-background text-foreground rounded-lg px-4 py-3 focus:ring-2 focus:ring-ring focus:border-transparent"
                      title={t("scan.status.selectTitle")}
                    >
                      {statusOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Location for Camera Mode */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      {t("scan.location.label")}
                    </label>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full border border-input bg-background text-foreground rounded-lg px-4 py-2 focus:ring-2 focus:ring-ring focus:border-transparent"
                      title={t("scan.location.title")}
                      placeholder={t("scan.location.placeholder")}
                    />
                  </div>
                </div>
              ) : (
                /* Manual Entry Mode */
                <>
                  <div className="flex items-center justify-center mb-6">
                    <div className="bg-primary/10 p-4 rounded-full">
                      <Scan className="w-12 h-12 text-primary" />
                    </div>
                  </div>

                  <h2 className="text-center mb-6">{t("scan.quickScan")}</h2>

                  <div className="space-y-4">
                    {/* Barcode Input */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        {t("scan.trackingNumber.label")}
                      </label>
                      <input
                        ref={inputRef}
                        type="text"
                        value={barcode}
                        onChange={(e) => setBarcode(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder={t("scan.trackingNumber.placeholder")}
                        className="w-full border-2 border-input bg-background text-foreground rounded-lg px-4 py-3 text-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                        disabled={recordScan.isPending}
                      />
                    </div>

                    {/* Status Selection */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        {t("scan.status.label")}
                      </label>
                      <select
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        className="w-full border border-input bg-background text-foreground rounded-lg px-4 py-3 focus:ring-2 focus:ring-ring focus:border-transparent"
                        disabled={recordScan.isPending}
                        title={t("scan.status.selectTitle")}
                      >
                        {statusOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Location */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        {t("scan.location.label")}
                      </label>
                      <input
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="w-full border border-input bg-background text-foreground rounded-lg px-4 py-2 focus:ring-2 focus:ring-ring focus:border-transparent"
                        disabled={recordScan.isPending}
                        title={t("scan.location.title")}
                        placeholder={t("scan.location.placeholder")}
                      />
                    </div>

                    {/* Scan Button */}
                    <button
                      onClick={() => void handleScan()}
                      disabled={recordScan.isPending || !barcode.trim()}
                      className="w-full bg-primary text-primary-foreground py-4 rounded-lg hover:bg-primary/90 transition-colors font-semibold text-lg disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      {recordScan.isPending ? (
                        <>
                          <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                          {t("scan.button.scanning")}
                        </>
                      ) : (
                        <>
                          <Scan className="w-5 h-5 mr-2" />
                          {t("scan.button.scanAndUpdate")}
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}

              {/* Tips */}
              <div className="mt-6 bg-primary/5 border border-primary/20 rounded-lg p-4">
                <p className="text-sm text-primary font-medium mb-2">
                  {t("scan.tips.title")}
                </p>
                <ul className="text-sm text-primary/80 space-y-1">
                  <li>{t("scan.tips.barcodeScanner")}</li>
                  <li>{t("scan.tips.pressEnter")}</li>
                  <li>{t("scan.tips.autoFocus")}</li>
                </ul>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-card text-card-foreground rounded-lg shadow border border-border p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      {t("scan.todaysScans")}
                    </p>
                    <p className="text-2xl font-bold text-foreground">
                      {scanHistory.length}
                    </p>
                  </div>
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
              </div>
              <div className="bg-card text-card-foreground rounded-lg shadow border border-border p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      {t("scan.successRate")}
                    </p>
                    <p className="text-2xl font-bold text-foreground">100%</p>
                  </div>
                  <Package className="w-8 h-8 text-primary" />
                </div>
              </div>
            </div>
          </div>

          {/* Scan History */}
          <div className="bg-card text-card-foreground rounded-lg shadow border border-border">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <div className="flex items-center">
                <History className="w-5 h-5 text-muted-foreground mr-2" />
                <h2 className="font-semibold">{t("scan.history.title")}</h2>
              </div>
              {scanHistory.length > 0 && (
                <button
                  onClick={clearHistory}
                  className="text-sm text-muted-foreground hover:text-foreground flex items-center"
                >
                  <RefreshCw className="w-4 h-4 mr-1" />
                  {t("scan.history.clear")}
                </button>
              )}
            </div>

            <div className="max-h-screen overflow-y-auto">
              {scanHistory.length === 0 ? (
                <div className="p-12 text-center">
                  <Scan className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">{t("scan.history.noScans")}</p>
                  <p className="text-sm text-muted-foreground/70 mt-1">
                    {t("scan.history.hint")}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {scanHistory.map((scan) => (
                    <div
                      key={scan.id}
                      className="p-4 hover:bg-accent transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          <div
                            className={`p-2 rounded-full mt-1 ${scan.success ? "bg-green-100 dark:bg-green-900/30" : "bg-red-100 dark:bg-red-900/30"}`}
                          >
                            {scan.success ? (
                              <CheckCircle2 className="w-4 h-4 text-green-600" />
                            ) : (
                              <AlertCircle className="w-4 h-4 text-red-600" />
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">
                              {scan.trackingNumber}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {t("scan.history.status", {
                                status: scan.status,
                              })}
                            </p>
                            <p className="text-xs text-muted-foreground/70 mt-1">
                              {new Date(scan.timestamp).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
