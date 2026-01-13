/**
 * Pricing Detail API Service
 */
import { httpClient, PaginatedResponse } from "../apiClient";

// ---- Types ----
export interface PricingDetailResponse {
  id: string;
  parcelId: string;
  tariffId: string;
  basePrice: number;
  weightCharge: number;
  extras: number;
  totalPrice: number;
  currency: string;
  createdAt: string;
}

// ---- Service ----
export const pricingDetailService = {
  listForParcel(
    parcelId: string,
    page = 0,
    size = 20,
  ): Promise<PaginatedResponse<PricingDetailResponse>> {
    return httpClient.get(
      `/pricing-details/parcel/${parcelId}?page=${page}&size=${size}`,
    );
  },

  historyForParcel(parcelId: string): Promise<PricingDetailResponse[]> {
    return httpClient.get(`/pricing-details/parcel/${parcelId}/all`);
  },
};
