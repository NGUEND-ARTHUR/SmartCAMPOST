/**
 * Pricing Detail React Query Hooks
 */
import { useQuery } from "@tanstack/react-query";
import { pricingDetailService } from "@/services";

export const pricingKeys = {
  all: ["pricingDetails"] as const,
  forParcel: (parcelId: string) =>
    [...pricingKeys.all, "parcel", parcelId] as const,
  forParcelPaged: (parcelId: string, page: number, size: number) =>
    [...pricingKeys.forParcel(parcelId), { page, size }] as const,
};

export function usePricingDetailsForParcel(
  parcelId: string,
  page = 0,
  size = 20,
) {
  return useQuery({
    queryKey: pricingKeys.forParcelPaged(parcelId, page, size),
    queryFn: () => pricingDetailService.listForParcel(parcelId, page, size),
    enabled: !!parcelId,
  });
}

export function usePricingHistoryForParcel(parcelId: string) {
  return useQuery({
    queryKey: pricingKeys.forParcel(parcelId),
    queryFn: () => pricingDetailService.historyForParcel(parcelId),
    enabled: !!parcelId,
  });
}
