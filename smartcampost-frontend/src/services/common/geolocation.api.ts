/**
 * Geolocation API Service
 */
import { httpClient } from "../apiClient";

// ---- Types ----
export interface GeocodeRequest {
  address: string;
  city?: string;
  country?: string;
}

export interface GeocodeResponse {
  latitude: number;
  longitude: number;
  formattedAddress: string;
}

export interface RouteEtaRequest {
  originLat: number;
  originLng: number;
  destinationLat: number;
  destinationLng: number;
}

export interface RouteEtaResponse {
  distanceKm: number;
  estimatedMinutes: number;
  routePolyline?: string;
}

// ---- Service ----
export const geolocationService = {
  geocode(data: GeocodeRequest): Promise<GeocodeResponse> {
    return httpClient.post("/geo/geocode", data);
  },

  routeEta(data: RouteEtaRequest): Promise<RouteEtaResponse> {
    return httpClient.post("/geo/route-eta", data);
  },
};
