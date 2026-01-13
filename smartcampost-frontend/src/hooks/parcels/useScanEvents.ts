/**
 * Scan Event React Query Hooks
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { scanEventService, ScanEventCreateRequest } from "@/services";
import { parcelKeys } from "./useParcels";

export const scanEventKeys = {
  all: ["scanEvents"] as const,
  forParcel: (parcelId: string) =>
    [...scanEventKeys.all, "parcel", parcelId] as const,
};

export function useScanEventsForParcel(parcelId: string) {
  return useQuery({
    queryKey: scanEventKeys.forParcel(parcelId),
    queryFn: () => scanEventService.getHistoryForParcel(parcelId),
    enabled: !!parcelId,
  });
}

export function useRecordScanEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ScanEventCreateRequest) => scanEventService.record(data),
    onSuccess: (_, data) => {
      queryClient.invalidateQueries({
        queryKey: scanEventKeys.forParcel(data.parcelId),
      });
      queryClient.invalidateQueries({
        queryKey: parcelKeys.detail(data.parcelId),
      });
    },
  });
}
