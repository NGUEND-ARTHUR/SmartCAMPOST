/**
 * Refund API Service
 */
import { httpClient, PaginatedResponse } from "../apiClient";

// ---- Types ----
export interface RefundResponse {
  id: string;
  paymentId: string;
  parcelId: string;
  parcelTrackingRef?: string;
  amount: number;
  currency: string;
  status: string;
  reason?: string;
  createdAt: string;
  processedAt?: string;
}

export interface CreateRefundRequest {
  paymentId: string;
  amount: number;
  reason?: string;
}

export interface UpdateRefundStatusRequest {
  status: string;
}

// ---- Service ----
export const refundService = {
  create(data: CreateRefundRequest): Promise<RefundResponse> {
    return httpClient.post("/refunds", data);
  },

  getById(id: string): Promise<RefundResponse> {
    return httpClient.get(`/refunds/${id}`);
  },

  getForPayment(paymentId: string): Promise<RefundResponse[]> {
    return httpClient.get(`/refunds/payment/${paymentId}`);
  },

  listAll(page = 0, size = 20): Promise<PaginatedResponse<RefundResponse>> {
    return httpClient.get(`/refunds?page=${page}&size=${size}`);
  },

  updateStatus(
    id: string,
    data: UpdateRefundStatusRequest,
  ): Promise<RefundResponse> {
    return httpClient.patch(`/refunds/${id}/status`, data);
  },
};
