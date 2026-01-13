/**
 * Payment API Service
 */
import { httpClient, PaginatedResponse } from "../apiClient";

// ---- Types ----
export interface PaymentResponse {
  id: string;
  parcelId: string;
  amount: number;
  currency: string;
  method: string;
  status: string;
  transactionRef?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InitPaymentRequest {
  parcelId: string;
  amount: number;
  method: string;
  currency?: string;
}

export interface ConfirmPaymentRequest {
  paymentId: string;
  transactionRef: string;
  status: string;
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
