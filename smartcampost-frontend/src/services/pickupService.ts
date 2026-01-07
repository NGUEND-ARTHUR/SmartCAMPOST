import { api } from "./api";
import type { PageResponse } from "../types/Common";

export type PickupState = "REQUESTED" | "ASSIGNED" | "COMPLETED" | "CANCELLED";

export interface PickupResponse {
  id: string;
  parcelId?: string;
  state: PickupState;
  addressText?: string;
  preferredTimeSlot?: string;
  createdAt?: string;
  courierId?: string;
}

export interface CreatePickupRequest {
  parcelId: string;
  addressText: string;
  preferredTimeSlot?: string;
}

export interface AssignPickupCourierRequest {
  courierId: string;
}

export interface UpdatePickupStateRequest {
  state: PickupState;
}

export async function createPickup(payload: CreatePickupRequest) {
  const { data } = await api.post<PickupResponse>("/api/pickups", payload);
  return data;
}

export async function getPickupById(pickupId: string) {
  const { data } = await api.get<PickupResponse>(`/api/pickups/${pickupId}`);
  return data;
}

export async function getPickupByParcel(parcelId: string) {
  const { data } = await api.get<PickupResponse>(`/api/pickups/by-parcel/${parcelId}`);
  return data;
}

export async function listMyPickups(page = 0, size = 20) {
  const { data } = await api.get<PageResponse<PickupResponse>>("/api/pickups/me", {
    params: { page, size },
  });
  return data;
}

export async function listCourierPickups(page = 0, size = 20) {
  const { data } = await api.get<PageResponse<PickupResponse>>("/api/pickups/courier/me", {
    params: { page, size },
  });
  return data;
}

export async function listAllPickups(page = 0, size = 20) {
  const { data } = await api.get<PageResponse<PickupResponse>>("/api/pickups", {
    params: { page, size },
  });
  return data;
}

export async function assignCourier(pickupId: string, payload: AssignPickupCourierRequest) {
  const { data } = await api.post<PickupResponse>(
    `/api/pickups/${pickupId}/assign-courier`,
    payload
  );
  return data;
}

export async function updatePickupState(pickupId: string, payload: UpdatePickupStateRequest) {
  const { data } = await api.patch<PickupResponse>(`/api/pickups/${pickupId}/state`, payload);
  return data;
}
