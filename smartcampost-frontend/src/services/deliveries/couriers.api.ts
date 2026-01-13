/**
 * Courier API Service
 */
import { httpClient, PaginatedResponse } from "../apiClient";

// ---- Types ----
export interface CourierResponse {
  id: string;
  userId: string;
  fullName: string;
  phone: string;
  vehicleId?: string;
  status: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateCourierRequest {
  fullName: string;
  phone: string;
  password: string;
  vehicleId?: string;
}

export interface UpdateCourierStatusRequest {
  status: string;
}

export interface UpdateCourierVehicleRequest {
  vehicleId?: string;
}

// ---- Service ----
export const courierService = {
  create(data: CreateCourierRequest): Promise<CourierResponse> {
    return httpClient.post("/couriers", data);
  },

  getById(id: string): Promise<CourierResponse> {
    return httpClient.get(`/couriers/${id}`);
  },

  listAll(page = 0, size = 20): Promise<PaginatedResponse<CourierResponse>> {
    return httpClient.get(`/couriers?page=${page}&size=${size}`);
  },

  updateStatus(
    id: string,
    data: UpdateCourierStatusRequest,
  ): Promise<CourierResponse> {
    return httpClient.patch(`/couriers/${id}/status`, data);
  },

  updateVehicle(
    id: string,
    data: UpdateCourierVehicleRequest,
  ): Promise<CourierResponse> {
    return httpClient.patch(`/couriers/${id}/vehicle`, data);
  },
};
