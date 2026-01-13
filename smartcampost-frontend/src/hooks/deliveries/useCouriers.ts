/**
 * Courier React Query Hooks
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  courierService,
  CreateCourierRequest,
  UpdateCourierStatusRequest,
  UpdateCourierVehicleRequest,
} from "@/services";

export const courierKeys = {
  all: ["couriers"] as const,
  lists: () => [...courierKeys.all, "list"] as const,
  list: (page: number, size: number) =>
    [...courierKeys.lists(), { page, size }] as const,
  details: () => [...courierKeys.all, "detail"] as const,
  detail: (id: string) => [...courierKeys.details(), id] as const,
};

export function useCouriers(page = 0, size = 20) {
  return useQuery({
    queryKey: courierKeys.list(page, size),
    queryFn: () => courierService.listAll(page, size),
  });
}

export function useCourier(id: string) {
  return useQuery({
    queryKey: courierKeys.detail(id),
    queryFn: () => courierService.getById(id),
    enabled: !!id,
  });
}

export function useCreateCourier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCourierRequest) => courierService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: courierKeys.all });
    },
  });
}

export function useUpdateCourierStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateCourierStatusRequest;
    }) => courierService.updateStatus(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: courierKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: courierKeys.lists() });
    },
  });
}

export function useUpdateCourierVehicle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateCourierVehicleRequest;
    }) => courierService.updateVehicle(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: courierKeys.detail(id) });
    },
  });
}
