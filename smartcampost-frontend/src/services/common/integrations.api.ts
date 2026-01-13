/**
 * Integration Config API Service
 */
import { httpClient, PaginatedResponse } from "../apiClient";

// ---- Types ----
export interface IntegrationConfigResponse {
  id: string;
  provider: string;
  configType: string;
  settings: Record<string, unknown>;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IntegrationConfigRequest {
  provider: string;
  configType: string;
  settings: Record<string, unknown>;
  active?: boolean;
}

// ---- Service ----
export const integrationConfigService = {
  create(data: IntegrationConfigRequest): Promise<IntegrationConfigResponse> {
    return httpClient.post("/integrations", data);
  },

  update(
    id: string,
    data: IntegrationConfigRequest,
  ): Promise<IntegrationConfigResponse> {
    return httpClient.put(`/integrations/${id}`, data);
  },

  getById(id: string): Promise<IntegrationConfigResponse> {
    return httpClient.get(`/integrations/${id}`);
  },

  listAll(
    page = 0,
    size = 20,
  ): Promise<PaginatedResponse<IntegrationConfigResponse>> {
    return httpClient.get(`/integrations?page=${page}&size=${size}`);
  },
};
