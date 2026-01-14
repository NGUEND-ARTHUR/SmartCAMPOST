/**
 * Tariff API Service
 */
import { httpClient, PaginatedResponse } from "../apiClient";

// ---- Types ----
export interface TariffResponse {
  id: string;
  serviceType: string;
  originZone: string;
  destinationZone: string;
  weightBracket: string;
  price: number;
}

export interface CreateTariffRequest {
  name?: string;
  serviceType: string;
  originZone: string;
  destinationZone: string;
  weightBracket: string;
  price: number;
  basePrice?: number;
  pricePerKg?: number;
  currency?: string;
}

export interface UpdateTariffRequest {
  price?: number;
}

export interface TariffQuoteRequest {
  serviceType: string;
  weight: number;
  originCity?: string;
  destinationCity?: string;
}

export interface TariffQuoteResponse {
  estimatedPrice: number;
  currency: string;
  breakdown?: {
    basePrice: number;
    weightCharge: number;
    extras?: number;
  };
}

// ---- Service ----
export const tariffService = {
  create(data: CreateTariffRequest): Promise<TariffResponse> {
    return httpClient.post("/tariffs", data);
  },

  listAll(
    page = 0,
    size = 20,
    serviceType?: string,
  ): Promise<PaginatedResponse<TariffResponse>> {
    let url = `/tariffs?page=${page}&size=${size}`;
    if (serviceType) url += `&serviceType=${serviceType}`;
    return httpClient.get(url);
  },

  getById(id: string): Promise<TariffResponse> {
    return httpClient.get(`/tariffs/${id}`);
  },

  update(id: string, data: UpdateTariffRequest): Promise<TariffResponse> {
    return httpClient.put(`/tariffs/${id}`, data);
  },

  delete(id: string): Promise<void> {
    return httpClient.delete(`/tariffs/${id}`);
  },

  quote(data: TariffQuoteRequest): Promise<TariffQuoteResponse> {
    return httpClient.post("/tariffs/quote", data);
  },
};
