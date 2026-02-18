/**
 * Risk API Service
 */
import { httpClient } from "./apiClient";

export interface RiskAlert {
  id?: string;
  type: string;
  severity: string;
  description: string;
  createdAt?: string;
  status?: string;
}

export const riskService = {
  /**
   * Create a new risk alert
   */
  createRisk(data: RiskAlert): Promise<RiskAlert> {
    return httpClient.post("/risk", data);
  },

  /**
   * Get risk alerts
   */
  getRisks(page = 0, size = 20): Promise<any> {
    return httpClient.get(`/risk/alerts?page=${page}&size=${size}`);
  },

  /**
   * Get a specific risk alert
   */
  getRiskById(riskId: string): Promise<RiskAlert> {
    return httpClient.get(`/risk/${riskId}`);
  },

  /**
   * Update a risk alert
   */
  updateRisk(riskId: string, data: Partial<RiskAlert>): Promise<RiskAlert> {
    return httpClient.put(`/risk/${riskId}`, data);
  },

  /**
   * Delete a risk alert
   */
  deleteRisk(riskId: string): Promise<void> {
    return httpClient.delete(`/risk/${riskId}`);
  },
};
