/**
 * QR Code Scanner Component
 * Uses native BarcodeDetector API (Chrome/Edge mobile) as primary engine,
 * with html5-qrcode as fallback for browsers without native support.
 */
import React, { useEffect, useRef, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  Camera,
  CameraOff,
  FlipHorizontal,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface QRCodeData {
  trackingRef: string;
  parcelId?: string;
  type: string;
  version: number;
}

export interface ScanResult {
  success: boolean;
  data?: QRCodeData;
  rawText: string;
  timestamp: Date;
  error?: string;
  latitude?: number;
  longitude?: number;
}

interface QRCodeScannerProps {
  onScan: (result: ScanResult) => void;
  onError?: (error: string) => void;
  autoStart?: boolean;
  continuous?: boolean;
  scanDelay?: number;
  showHistory?: boolean;
}

function parseQRCode(decodedText: string): ScanResult {
  if (decodedText?.startsWith("V1|")) {
    const parts = decodedText.split("|");
    if (parts.length === 6 && parts[3]) {
      return {
        success: true,
        data: { trackingRef: parts[3], type: "SMARTCAMPOST_SECURE", version: 1 },
        rawText: decodedText,
        timestamp: new Date(),
      };
    }
    return { success: false, rawText: decodedText, timestamp: new Date(), error: "Invalid secure QR payload" };
  }

  try {
    const data = JSON.parse(decodedText) as QRCodeData;
    if (data.type !== "SMARTCAMPOST_PARCEL") {
      return { success: false, rawText: decodedText, timestamp: new Date(), error: "Invalid QR code type" };
    }
    return { success: true, data, rawText: decodedText, timestamp: new Date() };
  } catch {
    if (decodedText.length >= 6 && decodedText.length <= 100) {
      return {
        success: true,
        data: { trackingRef: decodedText, type: "TRACKING_REF", version: 1 },
        rawText: decodedText,
        timestamp: new Date(),
      };
    }
    return { success: false, rawText: decodedText, timestamp: new Date(), error: "Invalid QR code format" };
  }
}

// Check if native BarcodeDetector is available
function hasBarcodeDetector(): boolean {
  return typeof globalThis !== "undefined" && "BarcodeDetector" in globalThis;
}

export function QRCodeScanner({
  onScan,
  onError,
  autoStart = true,
  continuous = false,
  scanDelay = 2000,
  showHistory = true,
}: QRCodeScannerProps) {
  const { t } = useTranslation();
  const [isScanning, setIsScanning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [lastScan, setLastScan] = useState<ScanResult | null>(null);
  const [scanHistory, setScanHistory] = useState<ScanResult[]>([]);
  const [hasCamera, setHasCamera] = useState(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [engineUsed, setEngineUsed] = useState<"native" | "html5-qrcode" | "">("");

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanLoopRef = useRef<number>(0);
  const onScanRef = useRef(onScan);
  useEffect(() => { onScanRef.current = onScan; }, [onScan]);
  const lastScanTimeRef = useRef<number>(0);

  // html5-qrcode fallback refs
  const html5ScannerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const stopScanRef = useRef<() => Promise<void>>(() => Promise.resolve());

  const handleDetection = useCallback(
    (decodedText: string) => {
      const now = Date.now();
      if (now - lastScanTimeRef.current < scanDelay) return;
      lastScanTimeRef.current = now;

      const result = parseQRCode(decodedText);
      setLastScan(result);
      setScanHistory((prev) => [result, ...prev].slice(0, 10));

      if (result.success) {
        toast.success("QR Scanned", {
          description: result.data?.trackingRef || decodedText.slice(0, 30),
        });
      } else {
        toast.error("Invalid QR", { description: result.error });
      }

      onScanRef.current(result);

      if (!continuous && result.success) {
        stopScanRef.current().catch(() => {});
      }
    },
    [scanDelay, continuous],
  );

  const stopScanning = useCallback(async () => {
    // Stop native scan loop
    if (scanLoopRef.current) {
      cancelAnimationFrame(scanLoopRef.current);
      scanLoopRef.current = 0;
    }
    // Stop camera stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    // Stop html5-qrcode fallback
    if (html5ScannerRef.current) {
      try {
        if (html5ScannerRef.current.isScanning) {
          await html5ScannerRef.current.stop();
        }
        await html5ScannerRef.current.clear();
      } catch { /* ignore cleanup */ }
      html5ScannerRef.current = null;
    }
    setIsScanning(false);
  }, []);

  useEffect(() => { stopScanRef.current = stopScanning; }, [stopScanning]);

  const startNativeScanner = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) throw new Error("Video/canvas elements not ready");

    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
    });
    streamRef.current = stream;
    video.srcObject = stream;
    await video.play();

    const detector = new (globalThis as any).BarcodeDetector({ formats: ["qr_code"] });
    setEngineUsed("native");

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) throw new Error("Canvas context unavailable");

    const scan = async () => {
      if (!streamRef.current || video.readyState < 2) {
        scanLoopRef.current = requestAnimationFrame(scan);
        return;
      }
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);
      try {
        const barcodes = await detector.detect(canvas);
        if (barcodes.length > 0) {
          handleDetection(barcodes[0].rawValue);
        }
      } catch { /* detection frame error — skip */ }
      scanLoopRef.current = requestAnimationFrame(scan);
    };

    scanLoopRef.current = requestAnimationFrame(scan);
  }, [facingMode, handleDetection]);

  const startHtml5Fallback = useCallback(async () => {
    const container = document.getElementById("qr-reader-fallback");
    if (!container) throw new Error("Fallback container not found");

    const { Html5Qrcode } = await import("html5-qrcode");
    const scanner = new Html5Qrcode("qr-reader-fallback", { verbose: false });
    html5ScannerRef.current = scanner;
    setEngineUsed("html5-qrcode");

    const containerWidth = container.clientWidth || 300;
    const qrBoxSize = Math.min(250, Math.floor(containerWidth * 0.7));

    await scanner.start(
      { facingMode },
      { fps: 10, qrbox: { width: qrBoxSize, height: qrBoxSize } },
      (decodedText: string) => handleDetection(decodedText),
      undefined,
    );
  }, [facingMode, handleDetection]);

  const startScanning = useCallback(async () => {
    setIsLoading(true);
    setCameraError(null);

    try {
      // Check camera availability
      const devices = await navigator.mediaDevices.enumerateDevices();
      const cameras = devices.filter((d) => d.kind === "videoinput");
      if (cameras.length === 0) {
        setHasCamera(false);
        setCameraError("No camera found on this device");
        toast.error("No camera found");
        setIsLoading(false);
        return;
      }

      // Stop any previous instance
      await stopScanning();

      // Try native BarcodeDetector first (much more reliable on mobile)
      if (hasBarcodeDetector()) {
        try {
          await startNativeScanner();
          setIsScanning(true);
          setIsLoading(false);
          return;
        } catch (err) {
          console.warn("Native BarcodeDetector failed, falling back to html5-qrcode:", err);
        }
      }

      // Fallback to html5-qrcode
      await startHtml5Fallback();
      setIsScanning(true);
      setIsLoading(false);
    } catch (err) {
      console.error("Camera error:", err);
      setIsLoading(false);
      setIsScanning(false);
      const errorMessage = err instanceof Error ? err.message : "Camera access denied";
      setCameraError(errorMessage);
      toast.error(t("qrcode.scanner.toasts.cameraError"), { description: errorMessage });
      onError?.(errorMessage);
    }
  }, [facingMode, stopScanning, startNativeScanner, startHtml5Fallback, onError, t]);

  const toggleCamera = useCallback(async () => {
    await stopScanning();
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
    setTimeout(() => { startScanning(); }, 200);
  }, [stopScanning, startScanning]);

  // Auto-start
  useEffect(() => {
    let mounted = true;
    if (autoStart) {
      const timer = setTimeout(() => {
        if (mounted) startScanning().catch(console.error);
      }, 500);
      return () => { mounted = false; clearTimeout(timer); stopScanning(); };
    }
    return () => { mounted = false; stopScanning(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart]);

  const clearHistory = () => {
    setScanHistory([]);
    setLastScan(null);
    toast.info(t("qrcode.scanner.toasts.historyCleared"));
  };

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            {t("qrcode.scanner.title")}
          </span>
          <div className="flex items-center gap-2">
            {engineUsed && (
              <Badge variant="outline" className="text-[10px]">
                {engineUsed === "native" ? "Native" : "JS"}
              </Badge>
            )}
            <Badge variant={isScanning ? "default" : "secondary"}>
              {isScanning
                ? t("qrcode.scanner.status.scanning")
                : t("qrcode.scanner.status.stopped")}
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Scanner View */}
        <div className="relative">
          {/* Native scanner: video + hidden canvas */}
          <video
            ref={videoRef}
            className={`w-full aspect-square object-cover rounded-lg bg-muted ${engineUsed === "native" && isScanning ? "" : "hidden"}`}
            playsInline
            muted
            autoPlay
          />
          <canvas ref={canvasRef} className="hidden" />

          {/* html5-qrcode fallback container */}
          <div
            id="qr-reader-fallback"
            ref={containerRef}
            className={`w-full aspect-square bg-muted rounded-lg overflow-hidden ${engineUsed === "html5-qrcode" && isScanning ? "" : "hidden"}`}
          />

          {/* Placeholder when not scanning */}
          {!isScanning && !isLoading && (
            <div className="w-full aspect-square flex flex-col items-center justify-center text-muted-foreground bg-muted rounded-lg">
              {cameraError ? (
                <>
                  <XCircle className="h-12 w-12 mb-2 text-destructive" />
                  <p className="text-center px-4">{cameraError}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={() => { setCameraError(null); startScanning(); }}
                  >
                    {t("common.tryAgain")}
                  </Button>
                </>
              ) : hasCamera ? (
                <>
                  <CameraOff className="h-12 w-12 mb-2" />
                  <p>{t("qrcode.scanner.cameraStopped")}</p>
                </>
              ) : (
                <>
                  <XCircle className="h-12 w-12 mb-2 text-destructive" />
                  <p>{t("qrcode.scanner.noCameraAvailable")}</p>
                </>
              )}
            </div>
          )}
          {isLoading && (
            <div className="w-full aspect-square flex flex-col items-center justify-center bg-background/80 rounded-lg">
              <Loader2 className="h-8 w-8 animate-spin mb-2" />
              <p>{t("qrcode.scanner.activatingCamera")}</p>
            </div>
          )}

          {/* Scan overlay for native scanner */}
          {isScanning && engineUsed === "native" && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-64 h-64 border-2 border-primary rounded-lg relative">
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-primary rounded-tl-lg" />
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-primary rounded-tr-lg" />
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-primary rounded-bl-lg" />
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-primary rounded-br-lg" />
                  <div className="absolute left-2 right-2 h-0.5 bg-primary animate-scan" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-2">
          {isScanning ? (
            <Button variant="destructive" onClick={stopScanning}>
              <CameraOff className="h-4 w-4 mr-1" />
              Stop
            </Button>
          ) : (
            <Button onClick={startScanning} disabled={isLoading || !hasCamera}>
              <Camera className="h-4 w-4 mr-1" />
              Start Scan
            </Button>
          )}
          <Button
            variant="outline"
            onClick={toggleCamera}
            disabled={!isScanning || isLoading}
          >
            <FlipHorizontal className="h-4 w-4 mr-1" />
            Flip Camera
          </Button>
        </div>

        {/* Last Scan Result */}
        {lastScan && (
          <div
            className={`p-3 rounded-lg border ${
              lastScan.success
                ? "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800"
                : "bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800"
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              {lastScan.success ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              <span className="font-medium">
                {lastScan.success ? "Scan Successful" : "Scan Failed"}
              </span>
            </div>
            {lastScan.success && lastScan.data && (
              <div className="text-sm space-y-1">
                <p>
                  <span className="text-muted-foreground">{t("qrcode.scanner.trackingRef")}:</span>{" "}
                  <span className="font-mono font-bold">{lastScan.data.trackingRef}</span>
                </p>
                {lastScan.data.parcelId && (
                  <p>
                    <span className="text-muted-foreground">{t("qrcode.scanner.parcelId")}:</span>{" "}
                    <span className="font-mono">{lastScan.data.parcelId}</span>
                  </p>
                )}
              </div>
            )}
            {!lastScan.success && (
              <p className="text-sm text-red-600">{lastScan.error}</p>
            )}
          </div>
        )}

        {/* Scan History */}
        {showHistory && scanHistory.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">{t("qrcode.scanner.recentScans")}</h4>
              <Button variant="ghost" size="sm" onClick={clearHistory}>
                Clear
              </Button>
            </div>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {scanHistory.slice(0, 5).map((scan, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between text-sm p-2 bg-muted rounded"
                >
                  <div className="flex items-center gap-2">
                    {scan.success ? (
                      <CheckCircle className="h-3 w-3 text-green-600" />
                    ) : (
                      <XCircle className="h-3 w-3 text-red-600" />
                    )}
                    <span className="font-mono text-xs">
                      {scan.data?.trackingRef || scan.rawText.slice(0, 20)}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {scan.timestamp.toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default QRCodeScanner;
