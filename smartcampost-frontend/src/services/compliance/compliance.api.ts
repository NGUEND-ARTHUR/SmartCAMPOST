/**
 * Compliance API Service
 */
import { httpClient, PaginatedResponse } from "../apiClient";

// ---- Types ----
export interface ComplianceAlertResponse {
  id: string;
  userId?: string;
  parcelId?: string;
  alertType?: string; // UI may need this
  severity: string;
  description: string;
  status: string;
  resolved: boolean;
  resolvedBy?: string;
  resolution?: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface ResolveRiskAlertRequest {
  resolution: string;
}

export interface ComplianceReportResponse {
  from: string;
  to: string;
  totalAlerts: number;
  resolvedAlerts: number;
  pendingAlerts: number;
  frozenAccounts: number;
}

// ---- Service ----
export const complianceService = {
  listAlerts(
    page = 0,
    size = 20,
  ): Promise<PaginatedResponse<ComplianceAlertResponse>> {
    return httpClient.get(`/compliance/alerts?page=${page}&size=${size}`);
  },

  getAlert(id: string): Promise<ComplianceAlertResponse> {
    return httpClient.get(`/compliance/alerts/${id}`);
  },

  resolveAlert(
    id: string,
    data: ResolveRiskAlertRequest,
  ): Promise<ComplianceAlertResponse> {
    const resolution = data?.resolution ?? "";
    // Backend expects { resolved, resolutionNote }
    return httpClient.patch(`/compliance/alerts/${id}`, {
      resolved: true,
      resolutionNote: resolution,
      resolution,
    });
  },

  generateReport(from: string, to: string): Promise<ComplianceReportResponse> {
    return httpClient.get(`/compliance/reports?from=${from}&to=${to}`);
  },

  freezeAccount(userId: string): Promise<void> {
    return httpClient.post(`/compliance/accounts/${userId}/freeze`);
  },

  unfreezeAccount(userId: string): Promise<void> {
    return httpClient.post(`/compliance/accounts/${userId}/unfreeze`);
  },
};
