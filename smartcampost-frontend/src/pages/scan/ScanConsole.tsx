import { useEffect, useRef, useState, useMemo } from "react";
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
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { useRecordScanEvent } from "@/hooks";
import { QRCodeScanner } from "@/components/qrcode";
import ErrorBoundary from "@/components/ErrorBoundary";
import { verifyQrCodeContent, isSecureQrCode } from "@/services/scan/qrVerification.api";
import { httpClient } from "@/services/apiClient";
import { useAuthStore } from "@/store/authStore";
import { useLocalStorage } from "@/hooks/useLocalStorage";

interface ScanEvent {
  id: string;
  trackingNumber: string;
  timestamp: string;
  status: string;
  success: boolean;
}

export default function ScanConsole() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const userRole = user?.role?.toUpperCase() ?? "AGENT";
  const [barcode, setBarcode] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [location, setLocation] = useState(t("scan.defaultLocation"));
  const [error, setError] = useState<string | null>(null);

  // All possible scan event types with labels
  const allStatusOptions = useMemo(
    () => [
      { value: "AT_ORIGIN_AGENCY", label: t("scan.status.atOriginAgency") },
      {
        value: "TAKEN_IN_CHARGE",
        label: t("scan.status.takenInCharge", {
          defaultValue: "Taken In Charge (Pickup)",
        }),
      },
      { value: "IN_TRANSIT", label: t("scan.status.inTransit") },
      { value: "ARRIVED_HUB", label: t("scan.status.arrivedHub") },
      { value: "DEPARTED_HUB", label: t("scan.status.departedHub") },
      {
        value: "ARRIVED_DESTINATION",
        label: t("scan.status.arrivedDestination"),
      },
      { value: "OUT_FOR_DELIVERY", label: t("scan.status.outForDelivery") },
      { value: "DELIVERED", label: t("scan.status.delivered") },
      {
        value: "PICKED_UP_AT_AGENCY",
        label: t("scan.status.pickedUpAtAgency", {
          defaultValue: "Picked Up At Agency",
        }),
      },
      { value: "RETURNED", label: t("scan.status.returned") },
      {
        value: "DELIVERY_FAILED",
        label: t("scan.status.deliveryFailed", {
          defaultValue: "Delivery Failed",
        }),
      },
    ],
    [t],
  );

  // Role-aware: show relevant options first based on user role
  const statusOptions = useMemo(() => {
    // Agent at agency: sees agency-relevant events first
    if (userRole === "AGENT" || userRole === "STAFF") {
      const agentPriority = [
        "AT_ORIGIN_AGENCY", // Client drops off parcel
        "ARRIVED_HUB", // Parcel arrives at this hub
        "DEPARTED_HUB", // Parcel leaves this hub
        "ARRIVED_DESTINATION", // Parcel arrives at destination agency
        "PICKED_UP_AT_AGENCY", // Recipient picks up
      ];
      return [
        ...allStatusOptions.filter((o) => agentPriority.includes(o.value)),
        ...allStatusOptions.filter((o) => !agentPriority.includes(o.value)),
      ];
    }
    // Courier: sees transit/delivery events first
    if (userRole === "COURIER") {
      const courierPriority = [
        "TAKEN_IN_CHARGE", // Courier picked up from client (HOME)
        "IN_TRANSIT", // Moving between locations
        "OUT_FOR_DELIVERY", // En route to recipient
        "DELIVERED", // Successfully delivered
        "DELIVERY_FAILED", // Delivery attempt failed
      ];
      return [
        ...allStatusOptions.filter((o) => courierPriority.includes(o.value)),
        ...allStatusOptions.filter((o) => !courierPriority.includes(o.value)),
      ];
    }
    // Admin/other: show all
    return allStatusOptions;
  }, [userRole, allStatusOptions]);

  // Set default status based on role – use timeout to avoid synchronous setState in effect
  useEffect(() => {
    if (!selectedStatus && statusOptions.length > 0) {
      const id = window.setTimeout(
        () => setSelectedStatus(statusOptions[0].value),
        0,
      );
      return () => window.clearTimeout(id);
    }
  }, [statusOptions, selectedStatus]);
  const [scanHistory, setScanHistory] = useLocalStorage<ScanEvent[]>(
    "scanHistory",
    [],
  );
  const [scanMode, setScanMode] = useState<"camera" | "manual">("manual");
  const [cameraBoundaryKey, setCameraBoundaryKey] = useState(0);
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

  const handleScan = async (scannedCode: string) => {
    setError(null);
    if (!scannedCode.trim()) {
      const errorMsg = t("scan.error.enterTrackingNumber", "Please enter a tracking number");
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    if (!selectedStatus) {
      const errorMsg = t("scan.error.selectStatus", "Please select a scan type");
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    let gps: { latitude: number; longitude: number };
    try {
      gps = await getGpsOrThrow();
    } catch {
      const errorMsg = t("scan.error.gpsRequired", "GPS access required for scanning");
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    try {
      // Step 1: Resolve parcel ID — try QR verification first, fallback to tracking ref lookup
      let parcelId: string | undefined;

      if (isSecureQrCode(scannedCode)) {
        // Secure V1|... QR code — verify via crypto endpoint
        const verificationResult = await verifyQrCodeContent(scannedCode, gps.latitude, gps.longitude);
        if (!verificationResult.valid) {
          const errorMsg = verificationResult.message || t("scan.error.invalidQr", "Invalid QR code");
          setError(errorMsg);
          throw new Error(errorMsg);
        }
        parcelId = verificationResult.parcelId;
      } else {
        // Try parsing as SmartCAMPOST JSON QR code first
        let trackingRef = scannedCode;
        try {
          const parsed = JSON.parse(scannedCode);
          if (parsed.parcelId) {
            parcelId = parsed.parcelId;
          }
          if (parsed.trackingRef) {
            trackingRef = parsed.trackingRef;
          }
        } catch {
          // Not JSON — treat as plain tracking ref or partial QR
          if (scannedCode.includes("|PARTIAL|") || scannedCode.includes("|FINAL|")) {
            trackingRef = scannedCode.split("|")[0];
          }
        }

        // Look up parcel by ID or tracking reference
        if (!parcelId) {
          try {
            const parcel = await httpClient.get<{ id: string }>(`/parcels/tracking/${encodeURIComponent(trackingRef)}`);
            parcelId = parcel.id;
          } catch {
            const errorMsg = t("scan.error.parcelNotFound", "Parcel not found for this tracking number");
            setError(errorMsg);
            throw new Error(errorMsg);
          }
        }
      }

      if (!parcelId) {
        const errorMsg = t("scan.error.noParcelId", "No parcel ID found");
        setError(errorMsg);
        throw new Error(errorMsg);
      }

      // Step 2: Record the scan event
      recordScan.mutate(
        {
          parcelId: parcelId,
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
              trackingNumber: parcelId,
              timestamp: new Date().toISOString(),
              status: selectedStatus,
              success: true,
            };
            setScanHistory([newScan, ...scanHistory]);
            setError(null);
            toast.success(t("scan.success.scanned", { barcode: parcelId }), {
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
              trackingNumber: parcelId,
              timestamp: new Date().toISOString(),
              status: selectedStatus,
              success: false,
            };
            setScanHistory([newScan, ...scanHistory]);
            const errorMsg = error instanceof Error
              ? error.message
              : t("scan.error.unknown", "Unknown error");
            setError(errorMsg);
            toast.error(t("scan.error.failed", "Failed to record scan"), {
              description: errorMsg,
            });
          },
        },
      );
    } catch (error) {
      const newScan: ScanEvent = {
        id: Date.now().toString(),
        trackingNumber: scannedCode,
        timestamp: new Date().toISOString(),
        status: selectedStatus,
        success: false,
      };
      setScanHistory([newScan, ...scanHistory]);
      const errorMsg = error instanceof Error ? error.message : t("scan.error.unknown", "Unknown error");
      setError(errorMsg);
      toast.error(t("scan.error.verificationFailed", "Verification failed"), {
        description: errorMsg,
      });
    }
  };

  const handleManualSubmit = () => {
    handleScan(barcode);
  };

  const handleCameraScan = (result: any) => {
    if (result?.success) {
      setBarcode(result.rawText);
      void handleScan(result.rawText);
    }
  };

  const clearHistory = () => {
    setScanHistory([]);
    toast.info(t("scan.history.cleared", { defaultValue: "History cleared" }));
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-2">{t("scan.title")}</h1>
          <p className="text-muted-foreground">{t("scan.subtitle")}</p>
        </div>

        {error && (
          <div className="mb-6 bg-destructive/10 border border-destructive text-destructive rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="font-medium">{t("common.error", "Error")}</p>
                <p className="text-sm mt-1">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-xs font-medium hover:opacity-75 transition-opacity"
              >
                {t("common.dismiss", "Dismiss")}
              </button>
            </div>
          </div>
        )}

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
                  <div className="w-full max-w-md h-80 bg-gray-200 dark:bg-gray-800 rounded-lg overflow-hidden">
                    <ErrorBoundary
                      key={cameraBoundaryKey}
                      fallback={
                        <div className="flex flex-col items-center justify-center h-full gap-3 p-6 text-center text-muted-foreground">
                          <Camera className="w-12 h-12 text-destructive" />
                          <p className="font-medium text-foreground">
                            {t("scan.error.cameraFailed", "Camera failed to start")}
                          </p>
                          <p className="text-sm">
                            {t("scan.error.cameraRetry", "Try reloading or switch to manual mode")}
                          </p>
                          <button
                            onClick={() => setCameraBoundaryKey((k) => k + 1)}
                            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                          >
                            {t("scan.error.retryCamera", "Retry Camera")}
                          </button>
                        </div>
                      }
                    >
                      <QRCodeScanner onScan={handleCameraScan} />
                    </ErrorBoundary>
                  </div>

                  {/* Status Selection for Camera Mode */}

                  <div>
                    <label
                      htmlFor="scan-status"
                      className="block text-sm font-medium text-foreground mb-2"
                    >
                      {t("scan.status.label", { defaultValue: "Scan type" })}
                    </label>
                    <select
                      id="scan-status"
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className="w-full border border-input bg-background text-foreground rounded-lg px-4 py-3 focus:ring-2 focus:ring-ring focus:border-transparent"
                      title={t("scan.status.selectTitle", {
                        defaultValue: "Scan type",
                      })}
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
                        onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                          if (e.key === "Enter") {
                            handleManualSubmit();
                          }
                        }}
                        placeholder={t("scan.trackingNumber.placeholder")}
                        className="w-full border-2 border-input bg-background text-foreground rounded-lg px-4 py-3 text-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                        disabled={recordScan.isPending}
                      />
                    </div>

                    {/* Status Selection */}
                    <div>
                      <label
                        htmlFor="scan-status"
                        className="block text-sm font-medium text-foreground mb-2"
                      >
                        {t("scan.status.label", { defaultValue: "Scan type" })}
                      </label>
                      <select
                        id="scan-status"
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        className="w-full border border-input bg-background text-foreground rounded-lg px-4 py-3 focus:ring-2 focus:ring-ring focus:border-transparent"
                        disabled={recordScan.isPending}
                        title={t("scan.status.selectTitle", {
                          defaultValue: "Scan type",
                        })}
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
                      onClick={handleManualSubmit}
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
                    <p className="text-2xl font-bold text-foreground">
                      {scanHistory.length === 0
                        ? "—"
                        : `${Math.round((scanHistory.filter((s) => s.success).length / scanHistory.length) * 100)}%`}
                    </p>
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
                  <p className="text-muted-foreground">
                    {t("scan.history.noScans")}
                  </p>
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
