/**
 * Pricing Quote API Service
 */
import { httpClient } from "../apiClient";

export interface PricingQuoteResponse {
  parcelId: string;
  amount: number;
  currency: string;
}

export const pricingQuoteService = {
  quote(parcelId: string): Promise<PricingQuoteResponse> {
    return httpClient.get(`/pricing/quote/${parcelId}`);
  },
};
