/**
 * Dashboard API Service
 */
import { httpClient } from "../apiClient";

// ---- Types ----
// Backend returns a Map<String, Object> in metrics field
export interface DashboardSummaryResponse {
  metrics: Record<string, number | string | unknown>;
}

// ---- Service ----
export const dashboardService = {
  getSummary(): Promise<DashboardSummaryResponse> {
    return httpClient.get("/dashboard/summary");
  },
};
