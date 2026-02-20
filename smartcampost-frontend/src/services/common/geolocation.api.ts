/**
 * Geolocation API Service
 */
import { httpClient } from "../apiClient";

// ---- Types ----
export interface GeocodeRequest {
  address?: string;
  city?: string;
  country?: string;
}

export interface GeocodeResponse {
  latitude: number;
  longitude: number;
  // Backend returns `normalizedAddress`; keep `formattedAddress` for UI convenience.
  formattedAddress: string;
}

export interface GeoSearchRequest {
  query: string;
  limit?: number;
}

export interface GeoSearchResult {
  latitude: number;
  longitude: number;
  displayName?: string;
  category?: string;
  type?: string;
  city?: string;
  state?: string;
  country?: string;
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
  async geocode(data: GeocodeRequest): Promise<GeocodeResponse> {
    const addressLine = [data.address, data.city, data.country]
      .filter((part): part is string => typeof part === "string" && part.trim().length > 0)
      .join(", ");

    const res = await httpClient.post<
      {
        latitude: number;
        longitude: number;
        normalizedAddress?: string;
        formattedAddress?: string;
      }
    >("/geo/geocode", { addressLine });

    return {
      latitude: res.latitude,
      longitude: res.longitude,
      formattedAddress:
        res.normalizedAddress ?? res.formattedAddress ?? addressLine,
    };
  },

  search(data: GeoSearchRequest): Promise<GeoSearchResult[]> {
    return httpClient.post("/geo/search", data);
  },

  routeEta(data: RouteEtaRequest): Promise<RouteEtaResponse> {
    return httpClient.post("/geo/route-eta", data);
  },
};
