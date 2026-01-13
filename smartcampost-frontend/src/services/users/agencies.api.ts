/**
 * Agency API Service
 */
import { httpClient, PaginatedResponse } from "../apiClient";

// ---- Types ----
export interface AgencyResponse {
  id: string;
  name: string;
  code?: string;
  address?: string;
  city?: string;
  region?: string;
  country?: string;
  phone?: string;
  email?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateAgencyRequest {
  name: string;
  code?: string;
  address?: string;
  city?: string;
  region?: string;
  country?: string;
  phone?: string;
  email?: string;
}

export interface UpdateAgencyRequest {
  name?: string;
  code?: string;
  address?: string;
  city?: string;
  region?: string;
  country?: string;
  phone?: string;
  email?: string;
  isActive?: boolean;
}

// ---- Service ----
export const agencyService = {
  create(data: CreateAgencyRequest): Promise<AgencyResponse> {
    return httpClient.post("/agencies", data);
  },

  getById(id: string): Promise<AgencyResponse> {
    return httpClient.get(`/agencies/${id}`);
  },

  listAll(page = 0, size = 20): Promise<PaginatedResponse<AgencyResponse>> {
    return httpClient.get(`/agencies?page=${page}&size=${size}`);
  },

  update(id: string, data: UpdateAgencyRequest): Promise<AgencyResponse> {
    return httpClient.put(`/agencies/${id}`, data);
  },
};
