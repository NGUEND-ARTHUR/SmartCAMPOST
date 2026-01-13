/**
 * Admin API Service
 */
import { httpClient } from "../apiClient";

// ---- Types ----
export interface UserAccountResponse {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  role: string;
  frozen: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FreezeAccountRequest {
  frozen: boolean;
}

// ---- Service ----
export const adminService = {
  listAllUsers(): Promise<UserAccountResponse[]> {
    return httpClient.get("/admin/users");
  },

  listUsersByRole(role: string): Promise<UserAccountResponse[]> {
    return httpClient.get(`/admin/users/by-role?role=${role}`);
  },

  freezeUser(userId: string, frozen: boolean): Promise<UserAccountResponse> {
    return httpClient.patch(`/admin/users/${userId}/freeze`, {
      frozen,
    } as FreezeAccountRequest);
  },
};
