import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createParcel,
  listMyParcels,
  listParcels,
  getParcelById,
  getParcelByTracking,
  updateParcelStatus,
} from "../../services/parcels/parcelService";
import type { CreateParcelRequest, ParcelResponse } from "../../types/Parcel";
import type { PageResponse } from "../../types/Common";
import type { ParcelStatus } from "../../types/Parcel";

export function useListParcels(page = 0, size = 20) {
  return useQuery({
    queryKey: ["parcels", page, size],
    queryFn: async (): Promise<PageResponse<ParcelResponse>> => {
      return await listParcels(page, size);
    },
  });
}

export function useListMyParcels(page = 0, size = 20) {
  return useQuery({
    queryKey: ["my-parcels", page, size],
    queryFn: async (): Promise<PageResponse<ParcelResponse>> => {
      return await listMyParcels(page, size);
    },
  });
}

export function useGetParcel(parcelId: string) {
  return useQuery({
    queryKey: ["parcels", parcelId],
    queryFn: async () => {
      return await getParcelById(parcelId);
    },
    enabled: !!parcelId,
  });
}

export function useGetParcelByTracking(trackingRef: string) {
  return useQuery({
    queryKey: ["parcels", "tracking", trackingRef],
    queryFn: async () => {
      return await getParcelByTracking(trackingRef);
    },
    enabled: !!trackingRef,
  });
}

export function useCreateParcel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateParcelRequest) => {
      return await createParcel(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parcels"] });
      queryClient.invalidateQueries({ queryKey: ["my-parcels"] });
    },
  });
}

export function useUpdateParcelStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      status,
      location,
    }: {
      id: number;
      status: ParcelStatus;
      location?: string;
    }) => {
      return await updateParcelStatus(id.toString(), { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parcels"] });
    },
  });
}

export function useScanParcel() {
  return useMutation({
    mutationFn: async (trackingRef: string) => {
      return await getParcelByTracking(trackingRef);
    },
  });
}