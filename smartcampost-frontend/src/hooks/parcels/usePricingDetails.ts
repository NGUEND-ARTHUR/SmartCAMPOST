/**
 * Pricing Detail React Query Hooks
 */
import { useQuery } from "@tanstack/react-query";
import { pricingDetailService } from "@/services";

export const pricingKeys = {
  all: ["pricingDetails"] as const,
  forParcel: (parcelId: string) =>
    [...pricingKeys.all, "parcel", parcelId] as const,
};

export function usePricingHistoryForParcel(parcelId: string) {
  return useQuery({
    queryKey: pricingKeys.forParcel(parcelId),
    queryFn: () => pricingDetailService.historyForParcel(parcelId),
    enabled: !!parcelId,
  });
}
