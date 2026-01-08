import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { recordScanEvent, getParcelScanHistory } from "../../services/scans/scanEventService";
import type { ScanEventCreateRequest, ScanEventResponse } from "../../types/Scan";

export function useListScanEvents(parcelId: string) {
  return useQuery({
    queryKey: ["scan-events", parcelId],
    queryFn: async (): Promise<ScanEventResponse[]> => {
      return await getParcelScanHistory(parcelId);
    },
    enabled: !!parcelId,
  });
}

export function useRecordScanEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ScanEventCreateRequest) => {
      return await recordScanEvent(data);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["scan-events", data.parcelId] });
    },
  });
}