/**
 * Pickup Request API Service
 */
import { httpClient, PaginatedResponse } from "../apiClient";

// ---- Types ----
export interface PickupResponse {
  id: string;
  parcelId: string;
  trackingRef?: string;
  clientId: string;
  clientName?: string;
  courierId?: string;
  courierName?: string;
  requestedDate?: string;
  timeWindow?: string;
  state: string;
  comment?: string;
  createdAt: string;
}

export interface CreatePickupRequest {
  parcelId: string;
  pickupAddressId?: string;
  requestedDate?: string;
  timeWindow?: string;
  comment?: string;
}

export interface AssignPickupCourierRequest {
  courierId: string;
}

export interface UpdatePickupStateRequest {
  state: string;
}

// ---- Service ----
export const pickupService = {
  create(data: CreatePickupRequest): Promise<PickupResponse> {
    return httpClient.post("/pickups", data);
  },

  getById(id: string): Promise<PickupResponse> {
    return httpClient.get(`/pickups/${id}`);
  },

  getByParcel(parcelId: string): Promise<PickupResponse> {
    return httpClient.get(`/pickups/by-parcel/${parcelId}`);
  },

  listMyPickups(
    page = 0,
    size = 20,
  ): Promise<PaginatedResponse<PickupResponse>> {
    return httpClient.get(`/pickups/me?page=${page}&size=${size}`);
  },

  listCourierPickups(
    page = 0,
    size = 20,
  ): Promise<PaginatedResponse<PickupResponse>> {
    return httpClient.get(`/pickups/courier/me?page=${page}&size=${size}`);
  },

  listAll(page = 0, size = 20): Promise<PaginatedResponse<PickupResponse>> {
    return httpClient.get(`/pickups?page=${page}&size=${size}`);
  },

  assignCourier(
    id: string,
    data: AssignPickupCourierRequest,
  ): Promise<PickupResponse> {
    return httpClient.post(`/pickups/${id}/assign-courier`, data);
  },

  updateState(
    id: string,
    data: UpdatePickupStateRequest,
  ): Promise<PickupResponse> {
    return httpClient.patch(`/pickups/${id}/state`, data);
  },
};
