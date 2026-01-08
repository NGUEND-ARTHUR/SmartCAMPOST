import { api } from "../api/api";

export interface GenerateQrResponse {
  parcelId: string;
  trackingNumber: string;
  qrValue: string; // e.g. CAM-2025-000123 (what QR encodes)
  qrImageBase64?: string; // optional from backend
}

export interface ScanQrRequest {
  qrValue: string; // scanned value
  eventType:
    | "ACCEPTED"
    | "TAKEN_IN_CHARGE"
    | "AT_ORIGIN_CENTER"
    | "IN_TRANSIT"
    | "ARRIVED_HUB"
    | "DEPARTED_HUB"
    | "ARRIVED_DEST_AGENCY"
    | "OUT_FOR_DELIVERY"
    | "DELIVERED"
    | "PICKED_UP_AT_AGENCY"
    | "RETURNED_TO_SENDER";
  locationName?: string;
  latitude?: number;
  longitude?: number;
}

export interface ScanQrResponse {
  ok: boolean;
  message?: string;
  parcelId?: string;
  trackingNumber?: string;
  newStatus?: string;
}

export async function generateParcelQr(parcelId: string) {
  // POST /parcels/{id}/qr
  const { data } = await api.post<GenerateQrResponse>(`/parcels/${parcelId}/qr`);
  return data;
}

export async function scanParcelQr(payload: ScanQrRequest) {
  // POST /scan
  const { data } = await api.post<ScanQrResponse>("/scan", payload);
  return data;
}
