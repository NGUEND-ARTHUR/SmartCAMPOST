import { api } from "./api";
import type { PageResponse } from "../types/Common";
import type { Parcel, ParcelDetail, ParcelStatus, DeliveryOption } from "../types/Parcel";

export interface CreateParcelRequest {
  receiverName: string;
  receiverPhone: string;
  destinationCity: string;

  // optional extras (adapt to your backend DTO)
  senderName?: string;
  senderPhone?: string;
  originCity?: string;
  deliveryOption?: DeliveryOption;
  comment?: string;
}

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
  const { data } = await api.post<Parcel>("/api/parcels", payload);
  return data;
}

export async function listMyParcels(page = 0, size = 20) {
  const { data } = await api.get<PageResponse<Parcel>>("/api/parcels/me", {
    params: { page, size },
  });
  return data;
}

export async function listParcels(page = 0, size = 20) {
  const { data } = await api.get<PageResponse<Parcel>>("/api/parcels", {
    params: { page, size },
  });
  return data;
}

export async function getParcelById(parcelId: string) {
  const { data } = await api.get<ParcelDetail>(`/api/parcels/${parcelId}`);
  return data;
}

export async function getParcelByTracking(trackingRef: string) {
  const { data } = await api.get<ParcelDetail>(`/api/parcels/tracking/${trackingRef}`);
  return data;
}

export async function updateParcelStatus(parcelId: string, payload: UpdateParcelStatusRequest) {
  const { data } = await api.patch<Parcel>(`/api/parcels/${parcelId}/status`, payload);
  return data;
}

export async function acceptParcel(parcelId: string) {
  const { data } = await api.patch<Parcel>(`/api/parcels/${parcelId}/accept`);
  return data;
}

export async function changeDeliveryOption(parcelId: string, payload: ChangeDeliveryOptionRequest) {
  const { data } = await api.patch<Parcel>(`/api/parcels/${parcelId}/delivery-option`, payload);
  return data;
}

export async function updateParcelMetadata(parcelId: string, payload: UpdateParcelMetadataRequest) {
  const { data } = await api.patch<Parcel>(`/api/parcels/${parcelId}/metadata`, payload);
  return data;
}
