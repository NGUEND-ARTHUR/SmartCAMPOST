/**
 * Payment API Service
 */
import { httpClient, PaginatedResponse } from "../apiClient";

// ---- Types ----
export interface PaymentResponse {
  id: string;
  parcelId: string;
  parcelTrackingRef?: string;
  amount: number;
  currency: string;
  method: string;
  status: string;
  timestamp: string;
  externalRef?: string;
}

export interface InitPaymentRequest {
  parcelId: string;
  method: string;
  currency?: string;
  payerPhone?: string;
}

export interface ConfirmPaymentRequest {
  paymentId: string;
  success: boolean;
  gatewayRef?: string;
}

// ---- Service ----
export const paymentService = {
  init(data: InitPaymentRequest): Promise<PaymentResponse> {
    return httpClient.post("/payments/init", data);
  },

  confirm(data: ConfirmPaymentRequest): Promise<PaymentResponse> {
    return httpClient.post("/payments/confirm", data);
  },

  getById(id: string): Promise<PaymentResponse> {
    return httpClient.get(`/payments/${id}`);
  },

  getForParcel(parcelId: string): Promise<PaymentResponse[]> {
    return httpClient.get(`/payments/parcel/${parcelId}`);
  },

  listAll(page = 0, size = 20): Promise<PaginatedResponse<PaymentResponse>> {
    return httpClient.get(`/payments?page=${page}&size=${size}`);
  },
};
