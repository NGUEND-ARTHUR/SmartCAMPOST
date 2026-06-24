/**
 * Agency API Service
 */
import { httpClient } from "../apiClient";

// ---- Types ----
export interface AgencyResponse {
  id: string;
  agencyName: string;
  agencyCode: string;
  city?: string;
  region?: string;
  country?: string;
}

export interface CreateAgencyRequest {
  agencyName: string;
  agencyCode?: string;
  city?: string;
  region?: string;
  country?: string;
}

export interface UpdateAgencyRequest {
  agencyName: string;
  agencyCode?: string;
  city?: string;
  region?: string;
  country?: string;
}

// ---- Service ----
export const agencyService = {
  create(data: CreateAgencyRequest): Promise<AgencyResponse> {
    return httpClient.post("/agencies", data);
  },

  getById(id: string): Promise<AgencyResponse> {
    return httpClient.get(`/agencies/${id}`);
  },

  listAll(): Promise<AgencyResponse[]> {
    return httpClient.get("/agencies");
  },

  update(id: string, data: UpdateAgencyRequest): Promise<AgencyResponse> {
    return httpClient.put(`/agencies/${id}`, data);
  },

  delete(id: string): Promise<void> {
    return httpClient.delete(`/agencies/${id}`);
  },
};
