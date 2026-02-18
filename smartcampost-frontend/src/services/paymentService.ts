/**
 * Payment API Service
 */
import { httpClient } from "./apiClient";
import type { Payment } from "@/types";

export const paymentService = {
  /**
   * Get current user's payments
   */
  getPayments(): Promise<Payment[]> {
    return httpClient.get("/payments");
  },

  /**
   * Get payment by ID
   */
  getPaymentById(id: string): Promise<Payment> {
    return httpClient.get(`/payments/${id}`);
  },

  /**
   * Get payments for a specific parcel
   */
  getPaymentsByParcel(parcelId: string): Promise<Payment[]> {
    return httpClient.get(`/payments/parcel/${parcelId}`);
  },

  /**
   * Process payment confirmation
   */
  confirmPayment(transactionId: string, reference: string): Promise<Payment> {
    return httpClient.post("/payments/confirm", {
      transactionId,
      reference,
    });
  },
};
