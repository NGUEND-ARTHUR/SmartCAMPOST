/**
 * Delivery API Service
 */
import { httpClient } from "../apiClient";
import { ParcelResponse } from "../parcels/parcels.api";

// ---- Types ----
export interface DeliveryOtpSendRequest {
  parcelId: string;
  phoneNumber: string;
}

export interface DeliveryOtpVerificationRequest {
  parcelId: string;
  otpCode: string;
}

export interface DeliveryProofRequest {
  parcelId: string;
  signatureUrl?: string;
  photoUrl?: string;
  notes?: string;
}

export interface FinalDeliveryRequest {
  otp: DeliveryOtpVerificationRequest;
  proof: DeliveryProofRequest;
}

// ---- Service ----
export const deliveryService = {
  sendOtp(data: DeliveryOtpSendRequest): Promise<void> {
    return httpClient.post("/delivery/otp/send", data);
  },

  verifyOtp(data: DeliveryOtpVerificationRequest): Promise<boolean> {
    return httpClient.post("/delivery/otp/verify", data);
  },

  confirmFinalDelivery(data: FinalDeliveryRequest): Promise<ParcelResponse> {
    return httpClient.post("/delivery/final", data);
  },
};
