/**
 * Scan Event API Service
 */
import { httpClient } from "../apiClient";

// ---- Types ----
export interface ScanEventResponse {
  id: string;
  parcelId: string;
  trackingRef?: string;
  agencyId?: string;
  agencyName?: string;
  agentId?: string;
  agentName?: string;
  eventType: string;
  timestamp: string;
  locationNote?: string;
  parcelStatusAfter?: string;
}

export interface ScanEventCreateRequest {
  parcelId: string;
  eventType: string;
  agencyId?: string;
  agentId?: string;
  locationNote?: string;
}

// ---- Service ----
export const scanEventService = {
  record(data: ScanEventCreateRequest): Promise<ScanEventResponse> {
    return httpClient.post("/scan-events", data);
  },

  getHistoryForParcel(parcelId: string): Promise<ScanEventResponse[]> {
    return httpClient.get(`/scan-events/parcel/${parcelId}`);
  },
};
