/**
 * Pricing quote hook
 */
import { useQuery } from "@tanstack/react-query";
import { pricingQuoteService } from "@/services";

export const pricingQuoteKeys = {
  all: ["pricingQuote"] as const,
  forParcel: (parcelId: string) => [...pricingQuoteKeys.all, parcelId] as const,
};

export function usePricingQuote(parcelId: string) {
  return useQuery({
    queryKey: pricingQuoteKeys.forParcel(parcelId),
    queryFn: () => pricingQuoteService.quote(parcelId),
    enabled: !!parcelId,
  });
}
