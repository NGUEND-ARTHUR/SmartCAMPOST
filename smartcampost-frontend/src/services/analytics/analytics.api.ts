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

export interface DemandForecastRequest {
  agencyId?: string;
  region?: string;
  forecastDays?: number;
}

export interface DailyForecast {
  date: string;
  predictedVolume: number;
  confidence: number;
  demandLevel: string;
}

export interface DemandForecastResponse {
  agencyId?: string;
  agencyName?: string;
  region?: string;
  forecasts: DailyForecast[];
  currentBacklog: number;
  averageDailyVolume: number;
  trend: string;
  confidenceScore: number;
  recommendation: string;
}

export interface SentimentAnalysisResponse {
  overallSentiment: string;
  sentimentScore: number;
  totalInteractions: number;
  positiveCount: number;
  neutralCount: number;
  negativeCount: number;
  topIssues: { issue: string; count: number; sentiment: string }[];
  satisfactionRate: number;
}

export interface SmartAlert {
  parcelId: string;
  trackingNumber: string;
  alertType: string;
  severity: string;
  message: string;
  recommendation: string;
}

export interface SmartNotificationResponse {
  alerts: SmartAlert[];
  totalAlerts: number;
}

export interface AddressValidationRequest {
  street: string;
  city?: string;
  region?: string;
  country?: string;
  postalCode?: string;
}

export interface AddressValidationResponse {
  valid: boolean;
  confidenceScore: number;
  normalizedAddress?: string;
  normalizedCity?: string;
  normalizedRegion?: string;
  normalizedCountry?: string;
  issues: string[];
  suggestions: string[];
}

export const analyticsService = {
  predictEta(parcelId: string): Promise<EtaPredictionResponse> {
    return httpClient.get(`/analytics/parcels/${parcelId}/eta`);
  },

  checkPaymentAnomaly(paymentId: string): Promise<AnomalyCheckResponse> {
    return httpClient.get(`/analytics/payments/${paymentId}/anomaly`);
  },

  forecastDemand(
    request: DemandForecastRequest,
  ): Promise<DemandForecastResponse> {
    return httpClient.post(`/analytics/demand-forecast`, request);
  },

  analyzeSentiment(): Promise<SentimentAnalysisResponse> {
    return httpClient.get(`/analytics/sentiment`);
  },

  getSmartNotifications(): Promise<SmartNotificationResponse> {
    return httpClient.get(`/analytics/smart-notifications`);
  },

  validateAddress(
    request: AddressValidationRequest,
  ): Promise<AddressValidationResponse> {
    return httpClient.post(`/analytics/validate-address`, request);
  },
};
