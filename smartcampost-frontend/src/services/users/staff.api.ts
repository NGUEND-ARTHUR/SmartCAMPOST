/**
 * Staff API Service
 */
import { httpClient, PaginatedResponse } from "../apiClient";

// ---- Types ----
export interface StaffResponse {
  id: string;
  userId: string;
  fullName: string;
  phone: string;
  email?: string;
  role: string;
  status: string;
  agencyId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStaffRequest {
  fullName: string;
  phone: string;
  email?: string;
  password: string;
  role: string;
  agencyId?: string;
}

export interface UpdateStaffStatusRequest {
  status: string;
}

export interface UpdateStaffRoleRequest {
  role: string;
}

// ---- Service ----
export const staffService = {
  create(data: CreateStaffRequest): Promise<StaffResponse> {
    return httpClient.post("/staff", data);
  },

  getById(id: string): Promise<StaffResponse> {
    return httpClient.get(`/staff/${id}`);
  },

  listAll(page = 0, size = 20): Promise<PaginatedResponse<StaffResponse>> {
    return httpClient.get(`/staff?page=${page}&size=${size}`);
  },

  updateStatus(
    id: string,
    data: UpdateStaffStatusRequest,
  ): Promise<StaffResponse> {
    return httpClient.patch(`/staff/${id}/status`, data);
  },

  updateRole(id: string, data: UpdateStaffRoleRequest): Promise<StaffResponse> {
    return httpClient.patch(`/staff/${id}/role`, data);
  },
};
