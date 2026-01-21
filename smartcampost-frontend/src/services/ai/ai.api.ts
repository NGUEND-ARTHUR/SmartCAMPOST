/**
 * AI Service - Route optimization and chatbot integration
 */
import { httpClient } from "../apiClient";

// ---- Types ----
export interface Stop {
  id: string;
  type: "PICKUP" | "DELIVERY";
  latitude: number;
  longitude: number;
  address?: string;
  priority?: number;
  timeWindow?: string;
}

export interface RouteOptimizationRequest {
  stops: Stop[];
  courierLat?: number;
  courierLng?: number;
  optimizationStrategy?: "SHORTEST" | "FASTEST" | "BALANCED";
}

export interface OptimizedStop {
  id: string;
  order: number;
  type: string;
  latitude: number;
  longitude: number;
  address?: string;
  distanceFromPrevious: number;
  etaMinutes: number;
  arrivalTime: string;
}

export interface RouteOptimizationResponse {
  optimizedRoute: OptimizedStop[];
  totalDistanceKm: number;
  estimatedDurationMinutes: number;
  fuelSavingsPercent: number;
  optimizationStrategy: string;
}

export interface ChatRequest {
  message: string;
  sessionId?: string;
  language?: "en" | "fr";
  context?: string;
}

export interface ActionData {
  type: "NAVIGATE" | "TRACK" | "CONTACT" | "CREATE_TICKET";
  payload: string;
}

export interface ChatResponse {
  message: string;
  sessionId: string;
  suggestions: string[];
  intent: string;
  confidence: number;
  action?: ActionData;
}

export interface DeliveryPredictionRequest {
  originLat: number;
  originLng: number;
  destinationLat: number;
  destinationLng: number;
  serviceType?: "STANDARD" | "EXPRESS";
  weight?: number;
}

export interface DeliveryPredictionResponse {
  estimatedDeliveryDate: string;
  estimatedDeliveryTime: string;
  confidenceScore: number;
  factors: string[];
}

// ---- Service ----
export const aiService = {
  /**
   * Optimize route for courier deliveries
   */
  optimizeRoute(
    request: RouteOptimizationRequest,
  ): Promise<RouteOptimizationResponse> {
    return httpClient.post("/ai/optimize-route", request);
  },

  /**
   * Send message to AI chatbot
   */
  chat(request: ChatRequest): Promise<ChatResponse> {
    return httpClient.post("/ai/chat", request);
  },

  /**
   * Predict delivery time
   */
  predictDelivery(
    request: DeliveryPredictionRequest,
  ): Promise<DeliveryPredictionResponse> {
    return httpClient.post("/ai/predict-delivery", request);
  },
};
