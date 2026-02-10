/**
 * Scan Event API Service
 * GPS coordinates are MANDATORY for all scan events.
 */
import { httpClient } from "../apiClient";
import type {
  OfflineScanEvent,
  OfflineSyncResult,
  LocationSource,
} from "../../types";

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
  // GPS data
  latitude?: number;
  longitude?: number;
  locationSource?: LocationSource;
  deviceTimestamp?: string;
  // Proof
  proofUrl?: string;
  comment?: string;
}

export interface ScanEventCreateRequest {
  parcelId: string;
  eventType: string;
  agencyId?: string;
  agentId?: string;
  locationNote?: string;
  // MANDATORY GPS fields
  latitude: number;
  longitude: number;
  locationSource?: string;
  deviceTimestamp?: string;
  // Proof
  proofUrl?: string;
  comment?: string;
}

export interface OfflineSyncRequest {
  events: OfflineScanEvent[];
  deviceId?: string;
  batchId?: string;
}

// ---- Service ----
export const scanEventService = {
  /**
   * Record a scan event with mandatory GPS data.
   */
  record(data: ScanEventCreateRequest): Promise<ScanEventResponse> {
    return httpClient.post("/scan-events", data);
  },

  /**
   * Get full history for a parcel (timeline).
   */
  getHistoryForParcel(parcelId: string): Promise<ScanEventResponse[]> {
    return httpClient.get(`/scan-events/parcel/${parcelId}`);
  },

  /**
   * Sync offline scan events.
   * Used when device was offline and events were queued locally.
   */
  syncOffline(data: OfflineSyncRequest): Promise<OfflineSyncResult> {
    return httpClient.post("/offline/sync", data);
  },
};
