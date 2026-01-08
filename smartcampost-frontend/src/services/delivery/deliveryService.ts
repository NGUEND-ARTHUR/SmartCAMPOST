import { api } from "../api/api";
import type { ParcelResponse } from "../../types/Parcel";

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
  proofType?: "PHOTO" | "SIGNATURE" | "OTP";
  proofUrl?: string;
  note?: string;
}

export interface FinalDeliveryRequest {
  otp: DeliveryOtpVerificationRequest;
  proof: DeliveryProofRequest;
}

export async function sendDeliveryOtp(payload: DeliveryOtpSendRequest) {
  await api.post("/api/delivery/otp/send", payload);
}

export async function verifyDeliveryOtp(payload: DeliveryOtpVerificationRequest) {
  const { data } = await api.post<boolean>("/api/delivery/otp/verify", payload);
  return data;
}

export async function confirmFinalDelivery(payload: FinalDeliveryRequest) {
  const { data } = await api.post<ParcelResponse>("/api/delivery/final", payload);
  return data;
}
