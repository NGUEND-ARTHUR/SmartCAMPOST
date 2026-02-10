/**
 * Delivery Confirmation Page
 * Courier page for confirming deliveries with QR scan, OTP verification, and proof of delivery
 */
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DeliveryConfirmation } from "@/components/qrcode";
import {
  useCompleteDelivery,
  useGpsLocation,
  useSendDeliveryOtp,
  useVerifyDeliveryOtp,
} from "@/hooks";
import { toast } from "sonner";

export default function ConfirmDelivery() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const sendOtp = useSendDeliveryOtp();
  const verifyOtp = useVerifyDeliveryOtp();
  const completeDelivery = useCompleteDelivery();
  const gps = useGpsLocation();

  const handleSendOtp = async (parcelId: string, phone: string) => {
    try {
      const loc = await gps.getCurrentPosition();
      await sendOtp.mutateAsync({
        parcelId,
        phoneNumber: phone,
        latitude: loc.latitude,
        longitude: loc.longitude,
      });
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Failed to send OTP",
      );
    }
  };

  const handleConfirm = async (data: {
    parcelId: string;
    trackingRef: string;
    otpCode: string;
    proof: {
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
    };
  }) => {
    try {
      const loc = data.proof.location
        ? {
            latitude: data.proof.location.latitude,
            longitude: data.proof.location.longitude,
          }
        : await gps.getCurrentPosition();

      // Verify OTP first
      const isValid = await verifyOtp.mutateAsync({
        parcelId: data.parcelId,
        otpCode: data.otpCode,
        latitude: loc.latitude,
        longitude: loc.longitude,
      });

      if (!isValid) {
        throw new Error("Invalid OTP code");
      }

      await completeDelivery.mutateAsync({
        parcelId: data.parcelId,
        otpCode: data.otpCode,
        receiverName:
          data.proof.receiverName || data.proof.signature || undefined,
        photoUrl: undefined,
        notes: data.proof.notes,
        proofType: data.proof.signature ? "SIGNATURE" : "OTP",
        latitude: loc.latitude,
        longitude: loc.longitude,
      });

      toast.success("Delivery confirmed successfully");
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Failed to confirm delivery",
      );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <Button variant="ghost" className="mb-4" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Confirm Delivery</h1>
          <p className="text-muted-foreground">
            Scan QR code, verify OTP, and capture proof of delivery
          </p>
        </div>

        {/* Delivery Confirmation Flow */}
        <DeliveryConfirmation
          onConfirm={handleConfirm}
          onSendOtp={handleSendOtp}
        />
      </div>
    </div>
  );
}
