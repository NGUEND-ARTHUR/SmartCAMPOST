/**
 * Self-Healing API Service
 * For congestion detection, route optimization, and automated interventions.
 */
import { httpClient } from "../apiClient";
import type { CongestionAlert, SelfHealingAction } from "../../types";

export interface RouteOptimization {
  courierId: string;
  courierName: string;
  optimizedRoute: DeliveryStop[];
  estimatedDuration: number;
  estimatedDistance: number;
  totalDeliveries: number;
  optimizationReason: string;
}

export interface DeliveryStop {
  sequence: number;
  parcelId: string;
  trackingRef: string;
  recipientName: string;
  address: string;
  latitude?: number;
  longitude?: number;
  deliveryType: string;
  estimatedArrival?: string;
}

export const selfHealingService = {
  /**
   * Detect congestion across all agencies.
   */
  detectCongestion(): Promise<CongestionAlert[]> {
    return httpClient.get("/self-healing/congestion");
  },

  /**
   * Detect congestion for a specific agency.
   */
  detectCongestionForAgency(agencyId: string): Promise<CongestionAlert> {
    return httpClient.get(`/self-healing/congestion/agency/${agencyId}`);
  },

  /**
   * Get suggested self-healing actions.
   */
  getSuggestedActions(): Promise<SelfHealingAction[]> {
    return httpClient.get("/self-healing/actions");
  },

  /**
   * Execute a self-healing action (admin only).
   */
  executeAction(actionId: string): Promise<SelfHealingAction> {
    return httpClient.post(`/self-healing/actions/${actionId}/execute`, {});
  },

  /**
   * Get route optimization for a courier.
   */
  optimizeCourierRoute(courierId: string): Promise<RouteOptimization> {
    return httpClient.get(`/self-healing/route/courier/${courierId}`);
  },

  /**
   * Notify clients about delays due to congestion.
   */
  notifyAffectedClients(
    agencyId: string,
    message: string,
  ): Promise<{ notifiedClients: number }> {
    return httpClient.post(`/self-healing/notify/agency/${agencyId}`, {
      message,
    });
  },
};
