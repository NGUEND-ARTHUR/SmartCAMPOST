/**
 * Pricing Detail API Service
 */
import { httpClient, PaginatedResponse } from "../apiClient";

// ---- Types ----
export interface PricingDetailResponse {
  id: string;
  parcelId: string;
  tariffId: string;
  serviceType: string;
  originZone: string;
  destinationZone: string;
  weightBracket: string;
  appliedPrice: number;
  appliedAt: string;
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
