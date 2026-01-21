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

  useEffect(() => {
    // Auto-focus the barcode input
    inputRef.current?.focus();
  }, []);

  const handleScan = async () => {
    if (!barcode.trim()) {
      toast.error(t("scan.error.enterTrackingNumber"));
      return;
    }

    recordScan.mutate(
      {
        parcelId: barcode,
        eventType: selectedStatus,
        locationNote: location,
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
  }) => {
    if (!result.success || !result.data) return;

    const trackingRef = result.data.trackingRef;
    setBarcode(trackingRef);

    // Auto-submit the scan
    recordScan.mutate(
      {
        parcelId: result.data.parcelId || trackingRef,
        eventType: selectedStatus,
        locationNote: location,
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
              error instanceof Error ? error.message : t("scan.error.unknown"),
          });
        },
      },
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-2">{t("scan.title")}</h1>
          <p className="text-gray-600">{t("scan.subtitle")}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Scan Panel */}
          <div className="space-y-6">
            {/* Scanner Card */}
            <div className="bg-white rounded-lg shadow-lg p-8">
              {/* Mode Toggle */}
              <div className="flex justify-center gap-2 mb-6">
                <button
                  onClick={() => setScanMode("camera")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                    scanMode === "camera"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <Camera className="w-4 h-4" />
                  {t("scan.mode.camera")}
                </button>
                <button
                  onClick={() => setScanMode("manual")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                    scanMode === "manual"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t("scan.status.label")}
                    </label>
                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t("scan.location.label")}
                    </label>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      title={t("scan.location.title")}
                      placeholder={t("scan.location.placeholder")}
                    />
                  </div>
                </div>
              ) : (
                /* Manual Entry Mode */
                <>
                  <div className="flex items-center justify-center mb-6">
                    <div className="bg-blue-100 p-4 rounded-full">
                      <Scan className="w-12 h-12 text-blue-600" />
                    </div>
                  </div>

                  <h2 className="text-center mb-6">{t("scan.quickScan")}</h2>

                  <div className="space-y-4">
                    {/* Barcode Input */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t("scan.trackingNumber.label")}
                      </label>
                      <input
                        ref={inputRef}
                        type="text"
                        value={barcode}
                        onChange={(e) => setBarcode(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder={t("scan.trackingNumber.placeholder")}
                        className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={recordScan.isPending}
                      />
                    </div>

                    {/* Status Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t("scan.status.label")}
                      </label>
                      <select
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t("scan.location.label")}
                      </label>
                      <input
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={recordScan.isPending}
                        title={t("scan.location.title")}
                        placeholder={t("scan.location.placeholder")}
                      />
                    </div>

                    {/* Scan Button */}
                    <button
                      onClick={() => void handleScan()}
                      disabled={recordScan.isPending || !barcode.trim()}
                      className="w-full bg-blue-600 text-white py-4 rounded-lg hover:bg-blue-700 transition-colors font-semibold text-lg disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center"
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
              <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900 font-medium mb-2">
                  {t("scan.tips.title")}
                </p>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>{t("scan.tips.barcodeScanner")}</li>
                  <li>{t("scan.tips.pressEnter")}</li>
                  <li>{t("scan.tips.autoFocus")}</li>
                </ul>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">
                      {t("scan.todaysScans")}
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {scanHistory.length}
                    </p>
                  </div>
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">
                      {t("scan.successRate")}
                    </p>
                    <p className="text-2xl font-bold text-gray-900">100%</p>
                  </div>
                  <Package className="w-8 h-8 text-blue-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Scan History */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center">
                <History className="w-5 h-5 text-gray-400 mr-2" />
                <h2 className="font-semibold">{t("scan.history.title")}</h2>
              </div>
              {scanHistory.length > 0 && (
                <button
                  onClick={clearHistory}
                  className="text-sm text-gray-600 hover:text-gray-900 flex items-center"
                >
                  <RefreshCw className="w-4 h-4 mr-1" />
                  {t("scan.history.clear")}
                </button>
              )}
            </div>

            <div className="max-h-screen overflow-y-auto">
              {scanHistory.length === 0 ? (
                <div className="p-12 text-center">
                  <Scan className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">{t("scan.history.noScans")}</p>
                  <p className="text-sm text-gray-400 mt-1">
                    {t("scan.history.hint")}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {scanHistory.map((scan) => (
                    <div
                      key={scan.id}
                      className="p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          <div
                            className={`p-2 rounded-full mt-1 ${scan.success ? "bg-green-100" : "bg-red-100"}`}
                          >
                            {scan.success ? (
                              <CheckCircle2 className="w-4 h-4 text-green-600" />
                            ) : (
                              <AlertCircle className="w-4 h-4 text-red-600" />
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">
                              {scan.trackingNumber}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                              {t("scan.history.status", {
                                status: scan.status,
                              })}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
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
