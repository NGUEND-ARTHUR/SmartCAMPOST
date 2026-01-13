/**
 * Risk API Service
 */
import { httpClient, PaginatedResponse } from "../apiClient";
import { UserAccountResponse } from "../users/admin.api";

// ---- Types ----
export interface RiskAlertResponse {
  id: string;
  type: string;
  severity: string;
  entityType?: string;
  entityId?: string;
  description: string;
  resolved: boolean;
  createdAt: string;
}

export interface RiskAlertUpdateRequest {
  description?: string;
  severity?: string;
}

// ---- Service ----
export const riskService = {
  listAlerts(
    page = 0,
    size = 20,
  ): Promise<PaginatedResponse<RiskAlertResponse>> {
    return httpClient.get(`/risk/alerts?page=${page}&size=${size}`);
  },

  updateAlert(
    id: string,
    data: RiskAlertUpdateRequest,
  ): Promise<RiskAlertResponse> {
    return httpClient.patch(`/risk/alerts/${id}`, data);
  },

  freezeUser(userId: string, frozen: boolean): Promise<UserAccountResponse> {
    return httpClient.patch(`/risk/users/${userId}/freeze`, { frozen });
  },
};
