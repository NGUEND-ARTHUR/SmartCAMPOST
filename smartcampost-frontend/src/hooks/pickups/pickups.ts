import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createPickup,
  listMyPickups,
  listAllPickups,
  getPickupById,
} from "../../services/pickups/pickupService";
import type { CreatePickupRequest, PickupResponse, PageResponse } from "../../services/pickups/pickupService";

export function useListMyPickups(page = 0, size = 20) {
  return useQuery({
    queryKey: ["my-pickups", page, size],
    queryFn: async (): Promise<PageResponse<PickupResponse>> => {
      return await listMyPickups(page, size);
    },
  });
}

export function useListAllPickups(page = 0, size = 20) {
  return useQuery({
    queryKey: ["pickups", page, size],
    queryFn: async (): Promise<PageResponse<PickupResponse>> => {
      return await listAllPickups(page, size);
    },
  });
}

export function useGetPickup(pickupId: string) {
  return useQuery({
    queryKey: ["pickups", pickupId],
    queryFn: async (): Promise<PickupResponse> => {
      return await getPickupById(pickupId);
    },
    enabled: !!pickupId,
  });
}

export function useCreatePickupRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      pickupAddress: string;
      pickupDate: string;
      pickupTime: string;
      contactName: string;
      contactPhone: string;
      parcelCount: number;
      notes?: string;
      pickupDateTime: string;
    }) => {
      // Transform the data to match the service interface
      const payload: CreatePickupRequest = {
        parcelId: "temp", // This might need to be adjusted based on your backend
        addressText: data.pickupAddress,
        preferredTimeSlot: data.pickupDateTime,
      };
      return await createPickup(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-pickups"] });
      queryClient.invalidateQueries({ queryKey: ["pickups"] });
    },
  });
}