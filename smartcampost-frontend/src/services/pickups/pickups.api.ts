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
  clientPhone?: string;
  courierId?: string;
  courierName?: string;
  requestedDate?: string;
  timeWindow?: string;
  state: string;
  comment?: string;
  pickupLatitude?: number;
  pickupLongitude?: number;
  locationMode?: "GPS_DEFAULT" | "MANUAL_OVERRIDE";
  createdAt: string;
}

export interface CreatePickupRequest {
  parcelId: string;
  requestedDate?: string;
  timeWindow?: string;
  comment?: string;
  pickupLatitude: number;
  pickupLongitude: number;
  locationMode?: "GPS_DEFAULT" | "MANUAL_OVERRIDE";
}

export interface AssignPickupCourierRequest {
  courierId: string;
}

export interface UpdatePickupStateRequest {
  state: string;
}

export interface ConfirmPickupRequest {
  temporaryQrToken?: string;
  pickupId?: string;

  actualWeight?: number;
  actualDimensions?: string;
  validationComment?: string;
  descriptionConfirmed: boolean;
  photoUrl?: string;

  printLabel?: boolean;
  labelCopies?: number;

  latitude: number;
  longitude: number;
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

  generateQr(id: string) {
    return httpClient.post(`/pickups/${id}/qr`);
  },

  getByTemporaryQr(token: string) {
    return httpClient.get(`/pickups/qr/${token}`);
  },

  confirmPickup(data: ConfirmPickupRequest) {
    return httpClient.post(`/pickups/confirm`, data);
  },
};
