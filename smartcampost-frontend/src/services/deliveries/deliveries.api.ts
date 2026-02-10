/**
 * Delivery API Service
 */
import { httpClient } from "../apiClient";
import { ParcelResponse } from "../parcels/parcels.api";

// ---- Types ----
export interface DeliveryOtpSendRequest {
  parcelId: string;
  phoneNumber: string;

  latitude: number;
  longitude: number;
  notes?: string;
}

export interface DeliveryOtpVerificationRequest {
  parcelId: string;
  otpCode: string;

  latitude: number;
  longitude: number;
  notes?: string;
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

  latitude: number;
  longitude: number;
  notes?: string;
}

export interface StartDeliveryRequest {
  parcelId: string;
  trackingRef?: string;
  courierId?: string;
  latitude: number;
  longitude: number;
  notes?: string;
}

export interface StartDeliveryResponse {
  parcelId: string;
  trackingRef: string;
  status: string;
  recipientName?: string | null;
  recipientPhone?: string | null;
  recipientAddress?: string | null;
  recipientLatitude?: number | null;
  recipientLongitude?: number | null;
  otpSent?: boolean;
  otpSentTo?: string | null;
  startedAt?: string;
  expectedDeliveryAt?: string | null;
}

export interface CompleteDeliveryRequest {
  parcelId?: string;
  trackingRef?: string;

  otpCode?: string;

  proofType?: string;
  receiverName?: string;
  receiverRelation?: string;
  photoUrl?: string;
  notes?: string;

  latitude: number;
  longitude: number;
  accuracy?: number;

  paymentCollected?: boolean;
  amountCollected?: number;
  paymentMethod?: string;
}

export interface CompleteDeliveryResponse {
  parcelId: string;
  trackingRef: string;
  status: string;
  proofId?: string;
  proofType?: string;
  receiverName?: string;
  latitude?: number;
  longitude?: number;
  receiptGenerated?: boolean;
  deliveredAt?: string;
}

export interface DeliveryAttemptDto {
  attemptNumber: number;
  attemptedAt?: string;
  result?: string;
  failureReason?: string;
  latitude?: number | null;
  longitude?: number | null;
}

export interface DeliveryStatusResponse {
  parcelId: string;
  trackingRef: string;
  status: string;
  deliveryOption?: string;
  currentStage?: string;
  currentAgencyName?: string | null;
  recipientName?: string | null;
  recipientCity?: string | null;
  attemptCount?: number;
  attempts?: DeliveryAttemptDto[];
}

export interface RescheduleDeliveryRequest {
  newDate: string; // YYYY-MM-DD
  timeWindow?: string;
  reason?: string;
  contactPhone?: string;
  deliveryNotes?: string;

  latitude: number;
  longitude: number;
}

export interface ReturnToSenderRequest {
  reason?: string;
  notes?: string;
  latitude: number;
  longitude: number;
}

export interface PickupAtAgencyRequest {
  parcelId?: string;
  trackingRef?: string;
  otpCode: string;
  latitude: number;
  longitude: number;
  notes?: string;
}

export interface PickupAtAgencyResponse {
  parcelId: string;
  trackingRef: string;
  status: string;
  otpVerified: boolean;
  latitude: number;
  longitude: number;
  pickedUpAt?: string;
}

// ---- Service ----
export const deliveryService = {
  sendOtp(data: DeliveryOtpSendRequest): Promise<void> {
    return httpClient.post("/delivery/otp/send", data);
  },

  verifyOtp(data: DeliveryOtpVerificationRequest): Promise<boolean> {
    return httpClient.post("/delivery/otp/verify", data);
  },

  resendOtp(
    parcelId: string,
    latitude: number,
    longitude: number,
    notes?: string,
  ): Promise<void> {
    const qs = new URLSearchParams({
      latitude: String(latitude),
      longitude: String(longitude),
    });
    if (notes) qs.set("notes", notes);
    return httpClient.post(
      `/delivery/${parcelId}/otp/resend?${qs.toString()}`,
      {},
    );
  },

  startDelivery(data: StartDeliveryRequest): Promise<StartDeliveryResponse> {
    return httpClient.post("/delivery/start", data);
  },

  completeDelivery(
    data: CompleteDeliveryRequest,
  ): Promise<CompleteDeliveryResponse> {
    return httpClient.post("/delivery/complete", data);
  },

  getStatus(parcelId: string): Promise<DeliveryStatusResponse> {
    return httpClient.get(`/delivery/${parcelId}/status`);
  },

  markFailed(
    parcelId: string,
    reason: string,
    latitude: number,
    longitude: number,
    notes?: string,
  ): Promise<DeliveryStatusResponse> {
    const qs = new URLSearchParams({
      reason,
      latitude: String(latitude),
      longitude: String(longitude),
    });
    if (notes) qs.set("notes", notes);
    return httpClient.post(`/delivery/${parcelId}/failed?${qs.toString()}`, {});
  },

  reschedule(
    parcelId: string,
    data: RescheduleDeliveryRequest,
  ): Promise<DeliveryStatusResponse> {
    return httpClient.post(`/delivery/${parcelId}/reschedule`, data);
  },

  returnToSender(
    parcelId: string,
    data: ReturnToSenderRequest,
  ): Promise<DeliveryStatusResponse> {
    return httpClient.post(`/delivery/${parcelId}/return-to-sender`, data);
  },

  pickupAtAgency(data: PickupAtAgencyRequest): Promise<PickupAtAgencyResponse> {
    return httpClient.post("/delivery/pickup/agency", data);
  },

  confirmFinalDelivery(data: FinalDeliveryRequest): Promise<ParcelResponse> {
    return httpClient.post("/delivery/final", data);
  },
};
