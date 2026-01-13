/**
 * AI React Query Hooks
 */
import { useMutation } from "@tanstack/react-query";
import {
  aiService,
  RouteOptimizationRequest,
  ChatRequest,
  DeliveryPredictionRequest,
} from "@/services/ai";

/**
 * Hook for AI route optimization
 */
export function useOptimizeRoute() {
  return useMutation({
    mutationFn: (data: RouteOptimizationRequest) =>
      aiService.optimizeRoute(data),
  });
}

/**
 * Hook for AI chatbot
 */
export function useAIChat() {
  return useMutation({
    mutationFn: (data: ChatRequest) => aiService.chat(data),
  });
}

/**
 * Hook for delivery time prediction
 */
export function useDeliveryPrediction() {
  return useMutation({
    mutationFn: (data: DeliveryPredictionRequest) =>
      aiService.predictDelivery(data),
  });
}
