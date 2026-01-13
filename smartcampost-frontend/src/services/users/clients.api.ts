/**
 * Client API Service
 */
import { httpClient, PaginatedResponse } from "../apiClient";

// ---- Types ----
export interface ClientResponse {
  id: string;
  userId: string;
  fullName: string;
  phone: string;
  email?: string;
  preferredLanguage?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ClientProfileResponse extends ClientResponse {
  totalParcels?: number;
  totalSpent?: number;
}

export interface UpdateClientProfileRequest {
  fullName?: string;
  phone?: string;
  email?: string;
}

export interface UpdateLanguageRequest {
  language: string;
}

// ---- Service ----
export const clientService = {
  getMyProfile(): Promise<ClientProfileResponse> {
    return httpClient.get("/clients/me");
  },

  updateMyProfile(data: UpdateClientProfileRequest): Promise<ClientResponse> {
    return httpClient.put("/clients/me", data);
  },

  updatePreferredLanguage(
    data: UpdateLanguageRequest,
  ): Promise<ClientResponse> {
    return httpClient.patch("/clients/me/preferred-language", data);
  },

  getById(id: string): Promise<ClientResponse> {
    return httpClient.get(`/clients/${id}`);
  },

  listAll(page = 0, size = 20): Promise<PaginatedResponse<ClientResponse>> {
    return httpClient.get(`/clients?page=${page}&size=${size}`);
  },
};
