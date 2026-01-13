/**
 * Agent API Service
 */
import { httpClient, PaginatedResponse } from "../apiClient";

// ---- Types ----
export interface AgentResponse {
  id: string;
  userId: string;
  fullName: string;
  phone: string;
  email?: string;
  agencyId?: string;
  agencyName?: string;
  status: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateAgentRequest {
  fullName: string;
  phone: string;
  email?: string;
  password: string;
  agencyId?: string;
}

export interface UpdateAgentStatusRequest {
  status: string; // ACTIVE, INACTIVE, SUSPENDED
}

export interface AssignAgencyRequest {
  agencyId: string;
}

// ---- Service ----
export const agentService = {
  create(data: CreateAgentRequest): Promise<AgentResponse> {
    return httpClient.post("/agents", data);
  },

  getById(id: string): Promise<AgentResponse> {
    return httpClient.get(`/agents/${id}`);
  },

  listAll(page = 0, size = 20): Promise<PaginatedResponse<AgentResponse>> {
    return httpClient.get(`/agents?page=${page}&size=${size}`);
  },

  updateStatus(
    id: string,
    data: UpdateAgentStatusRequest,
  ): Promise<AgentResponse> {
    return httpClient.patch(`/agents/${id}/status`, data);
  },

  assignAgency(id: string, data: AssignAgencyRequest): Promise<AgentResponse> {
    return httpClient.patch(`/agents/${id}/agency`, data);
  },
};
