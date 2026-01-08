import { api } from "../api/api";
import type { PageResponse } from "../../types/Common";
import type {
  ParcelResponse,
  ParcelDetailResponse,
  ParcelStatus,
  DeliveryOption,
  CreateParcelRequest,
} from "../../types/Parcel";

export interface UpdateParcelStatusRequest {
  status: ParcelStatus;
}

export interface ChangeDeliveryOptionRequest {
  deliveryOption: DeliveryOption;
}

export interface UpdateParcelMetadataRequest {
  comment?: string;
  photoUrl?: string;
}

export async function createParcel(payload: CreateParcelRequest) {
  const { data } = await api.post<ParcelResponse>("/api/parcels", payload);
  return data;
}

export async function listMyParcels(page = 0, size = 20) {
  const { data } = await api.get<PageResponse<ParcelResponse>>("/api/parcels/me", {
    params: { page, size },
  });
  return data;
}

export async function listParcels(page = 0, size = 20) {
  const { data } = await api.get<PageResponse<ParcelResponse>>("/api/parcels", {
    params: { page, size },
  });
  return data;
}

export async function getParcelById(parcelId: string) {
  const { data } = await api.get<ParcelDetailResponse>(`/api/parcels/${parcelId}`);
  return data;
}

export async function getParcelByTracking(trackingRef: string) {
  const { data } = await api.get<ParcelDetailResponse>(`/api/parcels/tracking/${trackingRef}`);
  return data;
}

export async function updateParcelStatus(parcelId: string, payload: UpdateParcelStatusRequest) {
  const { data } = await api.patch<ParcelResponse>(`/api/parcels/${parcelId}/status`, payload);
  return data;
}

export async function acceptParcel(parcelId: string) {
  const { data } = await api.patch<ParcelResponse>(`/api/parcels/${parcelId}/accept`);
  return data;
}

export async function changeDeliveryOption(parcelId: string, payload: ChangeDeliveryOptionRequest) {
  const { data } = await api.patch<ParcelResponse>(`/api/parcels/${parcelId}/delivery-option`, payload);
  return data;
}

export async function updateParcelMetadata(parcelId: string, payload: UpdateParcelMetadataRequest) {
  const { data } = await api.patch<ParcelResponse>(`/api/parcels/${parcelId}/metadata`, payload);
  return data;
}
