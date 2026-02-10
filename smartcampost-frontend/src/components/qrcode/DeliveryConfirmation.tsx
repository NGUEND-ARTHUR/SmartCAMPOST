/**
 * Delivery Confirmation Component
 * Handles the complete delivery confirmation flow:
 * 1. QR Code scan
 * 2. OTP verification
 * 3. Proof of delivery (photo, signature, location)
 * 4. Transaction closure
 */
import React, { useState, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  Camera,
  CheckCircle,
  Clock,
  FileSignature,
  KeyRound,
  Loader2,
  MapPin,
  Package,
  Shield,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { QRCodeScanner } from "./QRCodeScanner";

interface DeliveryInfo {
  trackingRef: string;
  parcelId: string;
  recipientName: string;
  recipientPhone: string;
  recipientAddress: string;
}

interface ProofOfDelivery {
  photo?: string;
  signature?: string;
  location?: {
    latitude: number;
    longitude: number;
    accuracy: number;
    timestamp: Date;
  };
  receiverName?: string;
  notes?: string;
}

interface DeliveryConfirmationProps {
  onConfirm: (data: {
    parcelId: string;
    trackingRef: string;
    otpCode: string;
    proof: ProofOfDelivery;
  }) => Promise<void>;
  onSendOtp: (parcelId: string, phone: string) => Promise<void>;
}

type Step = "scan" | "verify" | "proof" | "complete";

export function DeliveryConfirmation({
  onConfirm,
  onSendOtp,
}: DeliveryConfirmationProps) {
  const { t } = useTranslation();
  const [step, setStep] = useState<Step>("scan");
  const [deliveryInfo, setDeliveryInfo] = useState<DeliveryInfo | null>(null);
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [proof, setProof] = useState<ProofOfDelivery>({});
  const [isCapturing, setIsCapturing] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  const photoInputRef = useRef<HTMLInputElement>(null);
  const signatureCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Handle QR scan result
  const handleScan = useCallback(
    async (result: {
      success: boolean;
      data?: { trackingRef: string; parcelId?: string };
    }) => {
      if (!result.success || !result.data) return;

      // In real app, fetch delivery info from backend
      const info: DeliveryInfo = {
        trackingRef: result.data.trackingRef,
        parcelId: result.data.parcelId || result.data.trackingRef,
        recipientName: "John Doe", // Would come from API
        recipientPhone: "+237 6XX XXX XXX",
        recipientAddress: "123 Main St, Douala",
      };

      setDeliveryInfo(info);
      setStep("verify");
    },
    [],
  );

  // Send OTP to recipient
  const handleSendOtp = async () => {
    if (!deliveryInfo) return;

    setIsSendingOtp(true);
    try {
      await onSendOtp(deliveryInfo.parcelId, deliveryInfo.recipientPhone);
      setOtpSent(true);
      toast.success(t("qrcode.deliveryConfirmation.toasts.otpSentTitle"), {
        description: t(
          "qrcode.deliveryConfirmation.toasts.otpSentDescription",
          {
            phone: deliveryInfo.recipientPhone,
          },
        ),
      });
    } catch (error) {
      toast.error(t("qrcode.deliveryConfirmation.toasts.otpSendFailedTitle"), {
        description:
          error instanceof Error
            ? error.message
            : t("qrcode.deliveryConfirmation.toasts.unknownError"),
      });
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Verify OTP and proceed to proof
  const handleVerifyOtp = () => {
    if (otpCode.length < 4) {
      toast.error(t("qrcode.deliveryConfirmation.toasts.invalidOtp"));
      return;
    }

    // In real app, verify OTP with backend
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      setStep("proof");
      toast.success(t("qrcode.deliveryConfirmation.toasts.otpVerified"));
    }, 1000);
  };

  // Capture photo
  const handlePhotoCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsCapturing(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      setProof((prev) => ({ ...prev, photo: reader.result as string }));
      setIsCapturing(false);
      toast.success(t("qrcode.deliveryConfirmation.toasts.photoCaptured"));
    };
    reader.readAsDataURL(file);
  };

  // Get current location
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast.error(t("qrcode.deliveryConfirmation.toasts.geoNotSupported"));
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setProof((prev) => ({
          ...prev,
          location: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date(),
          },
        }));
        setIsLocating(false);
        toast.success(
          t("qrcode.deliveryConfirmation.toasts.locationCapturedTitle"),
          {
            description: t(
              "qrcode.deliveryConfirmation.toasts.locationCapturedDescription",
              { accuracy: Math.round(position.coords.accuracy) },
            ),
          },
        );
      },
      (error) => {
        setIsLocating(false);
        toast.error(
          t("qrcode.deliveryConfirmation.toasts.locationErrorTitle"),
          {
            description: error.message,
          },
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  };

  // Signature canvas handlers
  const startDrawing = (
    e:
      | React.MouseEvent<HTMLCanvasElement>
      | React.TouchEvent<HTMLCanvasElement>,
  ) => {
    setIsDrawing(true);
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x =
      "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y =
      "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (
    e:
      | React.MouseEvent<HTMLCanvasElement>
      | React.TouchEvent<HTMLCanvasElement>,
  ) => {
    if (!isDrawing) return;

    const canvas = signatureCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x =
      "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y =
      "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing && signatureCanvasRef.current) {
      const signature = signatureCanvasRef.current.toDataURL();
      setProof((prev) => ({ ...prev, signature }));
    }
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setProof((prev) => ({ ...prev, signature: undefined }));
  };

  // Complete delivery confirmation
  const handleConfirmDelivery = async () => {
    if (!deliveryInfo) return;

    if (!proof.photo && !proof.signature && !proof.location) {
      toast.error(t("qrcode.deliveryConfirmation.toasts.proofRequired"));
      return;
    }

    setIsVerifying(true);
    try {
      await onConfirm({
        parcelId: deliveryInfo.parcelId,
        trackingRef: deliveryInfo.trackingRef,
        otpCode,
        proof,
      });
      setStep("complete");
      toast.success(t("qrcode.deliveryConfirmation.toasts.confirmedTitle"), {
        description: t(
          "qrcode.deliveryConfirmation.toasts.confirmedDescription",
        ),
      });
    } catch (error) {
      toast.error(t("qrcode.deliveryConfirmation.toasts.confirmFailedTitle"), {
        description:
          error instanceof Error
            ? error.message
            : t("qrcode.deliveryConfirmation.toasts.unknownError"),
      });
    } finally {
      setIsVerifying(false);
    }
  };

  // Reset for new delivery
  const handleReset = () => {
    setStep("scan");
    setDeliveryInfo(null);
    setOtpCode("");
    setOtpSent(false);
    setProof({});
    clearSignature();
  };

  return (
    <div className="w-full max-w-lg mx-auto space-y-4">
      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-2 mb-6">
        {(["scan", "verify", "proof", "complete"] as Step[]).map((s, idx) => (
          <div key={s} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step === s
                  ? "bg-primary text-primary-foreground"
                  : idx < ["scan", "verify", "proof", "complete"].indexOf(step)
                    ? "bg-green-500 text-white"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              {idx < ["scan", "verify", "proof", "complete"].indexOf(step) ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                idx + 1
              )}
            </div>
            {idx < 3 && (
              <div
                className={`w-8 h-0.5 ${
                  idx < ["scan", "verify", "proof", "complete"].indexOf(step)
                    ? "bg-green-500"
                    : "bg-muted"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Scan QR Code */}
      {step === "scan" && (
        <QRCodeScanner
          onScan={handleScan}
          autoStart={true}
          continuous={false}
          showHistory={false}
        />
      )}

      {/* Step 2: OTP Verification */}
      {step === "verify" && deliveryInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5" />
              OTP Verification
            </CardTitle>
            <CardDescription>
              Verify recipient identity with OTP code
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Delivery Info Summary */}
            <div className="p-3 bg-muted rounded-lg space-y-2">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span className="font-mono font-medium">
                  {deliveryInfo.trackingRef}
                </span>
              </div>
              <Separator />
              <div className="text-sm space-y-1">
                <p>
                  <span className="text-muted-foreground">Recipient:</span>{" "}
                  {deliveryInfo.recipientName}
                </p>
                <p>
                  <span className="text-muted-foreground">Phone:</span>{" "}
                  {deliveryInfo.recipientPhone}
                </p>
                <p>
                  <span className="text-muted-foreground">Address:</span>{" "}
                  {deliveryInfo.recipientAddress}
                </p>
              </div>
            </div>

            {/* Send OTP Button */}
            {!otpSent ? (
              <Button
                onClick={handleSendOtp}
                disabled={isSendingOtp}
                className="w-full"
              >
                {isSendingOtp ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Shield className="h-4 w-4 mr-2" />
                )}
                Send OTP to Recipient
              </Button>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  OTP sent to {deliveryInfo.recipientPhone}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Enter OTP Code
                  </label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) =>
                      setOtpCode(e.target.value.replace(/\D/g, ""))
                    }
                    autoComplete="one-time-code"
                    name="otp"
                    placeholder="Enter 4-6 digit code"
                    className="text-center text-2xl tracking-widest"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handleSendOtp}
                    disabled={isSendingOtp}
                    className="flex-1"
                  >
                    Resend OTP
                  </Button>
                  <Button
                    onClick={handleVerifyOtp}
                    disabled={isVerifying || otpCode.length < 4}
                    className="flex-1"
                  >
                    {isVerifying ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : null}
                    Verify
                  </Button>
                </div>
              </div>
            )}

            <Button variant="ghost" onClick={handleReset} className="w-full">
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Proof of Delivery */}
      {step === "proof" && deliveryInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSignature className="h-5 w-5" />
              Proof of Delivery
            </CardTitle>
            <CardDescription>
              Capture photo, signature, and location as delivery proof
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Photo Capture */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Photo <Badge variant="secondary">Optional</Badge>
              </label>
              {proof.photo ? (
                <div className="relative">
                  <img
                    src={proof.photo}
                    alt="Proof of delivery"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() =>
                      setProof((prev) => ({ ...prev, photo: undefined }))
                    }
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/*"
                    aria-label="Capture delivery photo"
                    onChange={handlePhotoCapture}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    onClick={() => photoInputRef.current?.click()}
                    disabled={isCapturing}
                  >
                    {isCapturing ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Camera className="h-4 w-4 mr-2" />
                    )}
                    Take Photo
                  </Button>
                </div>
              )}
            </div>

            {/* Signature Capture */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium">
                  Signature <Badge variant="secondary">Optional</Badge>
                </label>
                {proof.signature && (
                  <Button variant="ghost" size="sm" onClick={clearSignature}>
                    Clear
                  </Button>
                )}
              </div>
              <div className="border rounded-lg overflow-hidden bg-white">
                <canvas
                  ref={signatureCanvasRef}
                  width={350}
                  height={150}
                  className="w-full cursor-crosshair touch-none"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Draw signature above
              </p>
            </div>

            {/* Location Capture */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Location <Badge variant="secondary">Recommended</Badge>
              </label>
              {proof.location ? (
                <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                  <MapPin className="h-5 w-5 text-green-600" />
                  <div className="text-sm">
                    <p className="font-medium">Location captured</p>
                    <p className="text-muted-foreground">
                      {proof.location.latitude.toFixed(6)},{" "}
                      {proof.location.longitude.toFixed(6)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Accuracy: {Math.round(proof.location.accuracy)}m
                    </p>
                  </div>
                </div>
              ) : (
                <Button
                  variant="outline"
                  onClick={handleGetLocation}
                  disabled={isLocating}
                  className="w-full"
                >
                  {isLocating ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <MapPin className="h-4 w-4 mr-2" />
                  )}
                  Capture Location
                </Button>
              )}
            </div>

            {/* Receiver Name */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Receiver Name <Badge variant="secondary">Optional</Badge>
              </label>
              <Input
                value={proof.receiverName || ""}
                onChange={(e) =>
                  setProof((prev) => ({
                    ...prev,
                    receiverName: e.target.value,
                  }))
                }
                placeholder="Name of person receiving"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Notes <Badge variant="secondary">Optional</Badge>
              </label>
              <Input
                value={proof.notes || ""}
                onChange={(e) =>
                  setProof((prev) => ({ ...prev, notes: e.target.value }))
                }
                placeholder="Additional notes..."
              />
            </div>

            <Separator />

            <Button
              onClick={handleConfirmDelivery}
              disabled={isVerifying}
              className="w-full"
              size="lg"
            >
              {isVerifying ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Confirm Delivery
            </Button>

            <Button
              variant="ghost"
              onClick={() => setStep("verify")}
              className="w-full"
            >
              Back
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Complete */}
      {step === "complete" && deliveryInfo && (
        <Card>
          <CardContent className="pt-6 text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold">Delivery Confirmed!</h2>
            <p className="text-muted-foreground">
              Parcel{" "}
              <span className="font-mono font-medium">
                {deliveryInfo.trackingRef}
              </span>{" "}
              has been successfully delivered.
            </p>

            <div className="p-4 bg-muted rounded-lg text-left text-sm space-y-2">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>Delivered at {new Date().toLocaleString()}</span>
              </div>
              {proof.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>
                    Location: {proof.location.latitude.toFixed(4)},{" "}
                    {proof.location.longitude.toFixed(4)}
                  </span>
                </div>
              )}
              {proof.receiverName && (
                <div className="flex items-center gap-2">
                  <FileSignature className="h-4 w-4 text-muted-foreground" />
                  <span>Received by: {proof.receiverName}</span>
                </div>
              )}
            </div>

            <p className="text-sm text-muted-foreground">
              A digital receipt and invoice have been sent to the client.
            </p>

            <Button onClick={handleReset} className="w-full" size="lg">
              Scan Next Parcel
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default DeliveryConfirmation;
