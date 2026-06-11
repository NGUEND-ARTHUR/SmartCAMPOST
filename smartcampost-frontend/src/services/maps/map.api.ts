import { httpClient } from "../apiClient";

export interface MapTimelineEvent {
  id: string;
  eventType: string;
  timestamp: string;
  locationNote?: string;
  latitude?: number;
  longitude?: number;
  agencyName?: string;
}

export interface ParcelMapResponse {
  parcelId: string;
  trackingNumber?: string;
  status?: string;
  timeline?: MapTimelineEvent[];
  currentLocation?: {
    latitude?: number;
    longitude?: number;
    note?: string;
    timestamp?: string;
  };
}

export interface RecentLocationResponse {
  id: number;
  userId?: number;
  latitude?: number;
  longitude?: number;
  address?: string;
  timestamp?: string;
}

export interface AdminMapOverviewResponse {
  recentLocations?: RecentLocationResponse[];
  activeParcels?: Array<{
    id: string;
    trackingRef?: string;
    status?: string;
    creationLatitude?: number;
    creationLongitude?: number;
    currentLatitude?: number;
    currentLongitude?: number;
    currentTimestamp?: string;
    currentEventType?: string;
  }>;
}

export interface CourierMapResponse {
  locations?: Array<{
    id?: string | number;
    latitude?: number;
    longitude?: number;
    address?: string;
    timestamp?: string;
  }>;
  activeParcels?: Array<{
    id: string;
    trackingRef?: string;
    status?: string;
    currentLatitude?: number;
    currentLongitude?: number;
    currentTimestamp?: string;
    currentEventType?: string;
    locationNote?: string;
  }>;
}

export const mapService = {
  getParcelMap(parcelId: string): Promise<ParcelMapResponse> {
    return httpClient.get(`/map/parcels/${parcelId}`);
  },

  getAdminOverview(): Promise<AdminMapOverviewResponse> {
    return httpClient.get("/map/admin/overview");
  },

  /** Courier / Agent personal map — uses /api/map/couriers/me (allowed for COURIER + AGENT) */
  getCourierMap(): Promise<CourierMapResponse> {
    return httpClient.get("/map/couriers/me");
  },
};
