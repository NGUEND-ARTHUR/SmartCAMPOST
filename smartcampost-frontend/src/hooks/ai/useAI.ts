/**
 * AI React Query Hooks
 */
import { useMutation, useQuery } from "@tanstack/react-query";
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

/**
 * Hook for the current user's AI agent status + role-tailored recommendations.
 * Polls periodically since recommendations are produced by autonomous background agents.
 */
export function useAgentStatus() {
  return useQuery({
    queryKey: ["ai", "agent-status"],
    queryFn: () => aiService.getAgentStatus(),
    staleTime: 30_000,
    refetchInterval: 60_000,
    retry: false,
  });
}
