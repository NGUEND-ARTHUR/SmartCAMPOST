/**
 * QR Code Scanner Component
 * Camera-based QR code scanning for agents to scan parcel QR codes
 * Uses html5-qrcode library for cross-platform camera access
 */
import { useEffect, useRef, useState, useCallback } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import {
  Camera,
  CameraOff,
  FlipHorizontal,
  Flashlight,
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

interface ScanResult {
  success: boolean;
  data?: QRCodeData;
  rawText: string;
  timestamp: Date;
  error?: string;
}

interface QRCodeScannerProps {
  onScan: (result: ScanResult) => void;
  onError?: (error: string) => void;
  autoStart?: boolean;
  continuous?: boolean;
  scanDelay?: number;
  showHistory?: boolean;
}

export function QRCodeScanner({
  onScan,
  onError,
  autoStart = true,
  continuous = false,
  scanDelay = 2000,
  showHistory = true,
}: QRCodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [lastScan, setLastScan] = useState<ScanResult | null>(null);
  const [scanHistory, setScanHistory] = useState<ScanResult[]>([]);
  const [hasCamera, setHasCamera] = useState(true);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastScanTimeRef = useRef<number>(0);

  const parseQRCode = useCallback((decodedText: string): ScanResult => {
    try {
      const data = JSON.parse(decodedText) as QRCodeData;
      
      // Validate it's a SmartCAMPOST QR code
      if (data.type !== "SMARTCAMPOST_PARCEL") {
        return {
          success: false,
          rawText: decodedText,
          timestamp: new Date(),
          error: "Invalid QR code type",
        };
      }

      return {
        success: true,
        data,
        rawText: decodedText,
        timestamp: new Date(),
      };
    } catch {
      // If not JSON, treat as plain tracking reference
      if (decodedText.length >= 6 && decodedText.length <= 50) {
        return {
          success: true,
          data: {
            trackingRef: decodedText,
            type: "TRACKING_REF",
            version: 1,
          },
          rawText: decodedText,
          timestamp: new Date(),
        };
      }

      return {
        success: false,
        rawText: decodedText,
        timestamp: new Date(),
        error: "Invalid QR code format",
      };
    }
  }, []);

  const handleScanSuccess = useCallback(
    (decodedText: string) => {
      const now = Date.now();
      
      // Debounce scans
      if (now - lastScanTimeRef.current < scanDelay) {
        return;
      }
      lastScanTimeRef.current = now;

      const result = parseQRCode(decodedText);
      setLastScan(result);
      setScanHistory((prev) => [result, ...prev].slice(0, 10));

      if (result.success) {
        toast.success("QR Code scanned", {
          description: `Tracking: ${result.data?.trackingRef}`,
        });
      } else {
        toast.error("Invalid QR Code", {
          description: result.error,
        });
        onError?.(result.error || "Unknown error");
      }

      onScan(result);

      // Stop scanning if not continuous mode
      if (!continuous && result.success) {
        stopScanning();
      }
    },
    [continuous, onScan, onError, parseQRCode, scanDelay]
  );

  const startScanning = useCallback(async () => {
    if (!containerRef.current) return;

    setIsLoading(true);

    try {
      // Check camera permission
      const devices = await Html5Qrcode.getCameras();
      if (devices.length === 0) {
        setHasCamera(false);
        toast.error("No camera found");
        onError?.("No camera found");
        setIsLoading(false);
        return;
      }

      const scanner = new Html5Qrcode("qr-reader", {
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        verbose: false,
      });

      scannerRef.current = scanner;

      await scanner.start(
        { facingMode },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1,
        },
        handleScanSuccess,
        () => {
          // QR code scan error (no QR code found in frame) - this is expected
        }
      );

      setIsScanning(true);
      setIsLoading(false);
    } catch (err) {
      console.error("Camera error:", err);
      setIsLoading(false);
      const errorMessage = err instanceof Error ? err.message : "Camera access denied";
      toast.error("Camera Error", { description: errorMessage });
      onError?.(errorMessage);
    }
  }, [facingMode, handleScanSuccess, onError]);

  const stopScanning = useCallback(async () => {
    if (scannerRef.current?.isScanning) {
      try {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
      } catch (err) {
        console.error("Error stopping scanner:", err);
      }
    }
    setIsScanning(false);
  }, []);

  const toggleCamera = useCallback(async () => {
    await stopScanning();
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
    setTimeout(() => {
      startScanning();
    }, 100);
  }, [stopScanning, startScanning]);

  // Auto-start scanning
  useEffect(() => {
    let mounted = true;
    
    if (autoStart && mounted) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        if (mounted) {
          startScanning().catch(console.error);
        }
      }, 500);
      return () => {
        mounted = false;
        clearTimeout(timer);
        stopScanning();
      };
    }

    return () => {
      mounted = false;
      stopScanning();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart]);

  const clearHistory = () => {
    setScanHistory([]);
    setLastScan(null);
    toast.info("Scan history cleared");
  };

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            QR Code Scanner
          </span>
          <Badge variant={isScanning ? "default" : "secondary"}>
            {isScanning ? "Scanning" : "Stopped"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Scanner View */}
        <div className="relative">
          <div
            id="qr-reader"
            ref={containerRef}
            className="w-full aspect-square bg-muted rounded-lg overflow-hidden"
          >
            {!isScanning && !isLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
                {hasCamera ? (
                  <>
                    <CameraOff className="h-12 w-12 mb-2" />
                    <p>Camera stopped</p>
                  </>
                ) : (
                  <>
                    <XCircle className="h-12 w-12 mb-2 text-destructive" />
                    <p>No camera available</p>
                  </>
                )}
              </div>
            )}
            {isLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80">
                <Loader2 className="h-8 w-8 animate-spin mb-2" />
                <p>Activating camera...</p>
              </div>
            )}
          </div>

          {/* Scan overlay */}
          {isScanning && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-64 h-64 border-2 border-primary rounded-lg relative">
                  {/* Corner markers */}
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-primary rounded-tl-lg" />
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-primary rounded-tr-lg" />
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-primary rounded-bl-lg" />
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-primary rounded-br-lg" />
                  {/* Scanning line animation */}
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
                  <span className="text-muted-foreground">Tracking Ref:</span>{" "}
                  <span className="font-mono font-bold">{lastScan.data.trackingRef}</span>
                </p>
                {lastScan.data.parcelId && (
                  <p>
                    <span className="text-muted-foreground">Parcel ID:</span>{" "}
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
              <h4 className="text-sm font-medium">Recent Scans</h4>
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
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                    <span className="font-mono">
                      {scan.data?.trackingRef || scan.rawText.slice(0, 20)}
                    </span>
                  </div>
                  <span className="text-muted-foreground text-xs">
                    {scan.timestamp.toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>

      {/* Custom CSS for scan animation */}
      <style>{`
        @keyframes scan {
          0%, 100% { top: 10%; }
          50% { top: 85%; }
        }
        .animate-scan {
          animation: scan 2s ease-in-out infinite;
        }
      `}</style>
    </Card>
  );
}

export default QRCodeScanner;
