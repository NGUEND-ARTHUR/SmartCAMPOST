/**
 * Pickup React Query Hooks
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  pickupService,
  CreatePickupRequest,
  AssignPickupCourierRequest,
  UpdatePickupStateRequest,
  ConfirmPickupRequest,
} from "@/services";

export const pickupKeys = {
  all: ["pickups"] as const,
  lists: () => [...pickupKeys.all, "list"] as const,
  list: (filters: Record<string, unknown>) =>
    [...pickupKeys.lists(), filters] as const,
  myList: (page: number, size: number) =>
    [...pickupKeys.all, "my", { page, size }] as const,
  courierList: (page: number, size: number) =>
    [...pickupKeys.all, "courier", { page, size }] as const,
  details: () => [...pickupKeys.all, "detail"] as const,
  detail: (id: string) => [...pickupKeys.details(), id] as const,
  byParcel: (parcelId: string) =>
    [...pickupKeys.all, "by-parcel", parcelId] as const,
};

export function useMyPickups(page = 0, size = 20) {
  return useQuery({
    queryKey: pickupKeys.myList(page, size),
    queryFn: () => pickupService.listMyPickups(page, size),
  });
}

export function useCourierPickups(page = 0, size = 20) {
  return useQuery({
    queryKey: pickupKeys.courierList(page, size),
    queryFn: () => pickupService.listCourierPickups(page, size),
  });
}

export function usePickups(page = 0, size = 20) {
  return useQuery({
    queryKey: pickupKeys.list({ page, size }),
    queryFn: () => pickupService.listAll(page, size),
  });
}

export function usePickup(id: string) {
  return useQuery({
    queryKey: pickupKeys.detail(id),
    queryFn: () => pickupService.getById(id),
    enabled: !!id,
  });
}

export function usePickupByParcel(parcelId: string) {
  return useQuery({
    queryKey: pickupKeys.byParcel(parcelId),
    queryFn: () => pickupService.getByParcel(parcelId),
    enabled: !!parcelId,
  });
}

export function useCreatePickup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePickupRequest) => pickupService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pickupKeys.all });
    },
  });
}

export function useAssignPickupCourier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: AssignPickupCourierRequest;
    }) => pickupService.assignCourier(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: pickupKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: pickupKeys.lists() });
    },
  });
}

export function useUpdatePickupState() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdatePickupStateRequest;
    }) => pickupService.updateState(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: pickupKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: pickupKeys.lists() });
    },
  });
}

export function useConfirmPickup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ConfirmPickupRequest) =>
      pickupService.confirmPickup(data),
    onSuccess: (_, data) => {
      if (data && data.pickupId) {
        queryClient.invalidateQueries({
          queryKey: pickupKeys.detail(data.pickupId),
        });
      }
      queryClient.invalidateQueries({ queryKey: pickupKeys.lists() });
    },
  });
}

// Alias for backward compatibility
export const useAssignCourier = () => {
  const assignPickupCourier = useAssignPickupCourier();
  return {
    ...assignPickupCourier,
    mutate: (
      { id, courierId }: { id: string; courierId: string },
      options?: Parameters<typeof assignPickupCourier.mutate>[1],
    ) => {
      assignPickupCourier.mutate({ id, data: { courierId } }, options);
    },
  };
};
