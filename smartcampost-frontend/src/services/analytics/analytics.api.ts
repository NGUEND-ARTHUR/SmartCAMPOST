/**
 * Analytics API Service
 */
import { httpClient } from "../apiClient";

export interface EtaPredictionResponse {
  parcelId: string;
  trackingRef?: string;
  predictedDeliveryAt: string;
  confidence?: number;
  lastEventType?: string;
  lastEventAt?: string;
  lastLocationNote?: string;
}

export interface AnomalyCheckResponse {
  anomalous: boolean;
  reason?: string;
  score?: number;
}

export const analyticsService = {
  predictEta(parcelId: string): Promise<EtaPredictionResponse> {
    return httpClient.get(`/analytics/parcels/${parcelId}/eta`);
  },

  checkPaymentAnomaly(paymentId: string): Promise<AnomalyCheckResponse> {
    return httpClient.get(`/analytics/payments/${paymentId}/anomaly`);
  },
};
