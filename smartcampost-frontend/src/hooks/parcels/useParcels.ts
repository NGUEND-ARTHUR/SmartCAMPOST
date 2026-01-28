/**
 * Parcel React Query Hooks
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  parcelService,
  ParcelResponse,
  ParcelDetailResponse,
  CreateParcelRequest,
  UpdateParcelStatusRequest,
  ChangeDeliveryOptionRequest,
  UpdateParcelMetadataRequest,
} from "@/services";

export const parcelKeys = {
  all: ["parcels"] as const,
  lists: () => [...parcelKeys.all, "list"] as const,
  list: (filters: Record<string, unknown>) =>
    [...parcelKeys.lists(), filters] as const,
  myList: (page: number, size: number) =>
    [...parcelKeys.all, "my", { page, size }] as const,
  details: () => [...parcelKeys.all, "detail"] as const,
  detail: (id: string) => [...parcelKeys.details(), id] as const,
  tracking: (ref: string) => [...parcelKeys.all, "tracking", ref] as const,
};

export function useMyParcels(page = 0, size = 20) {
  return useQuery({
    queryKey: parcelKeys.myList(page, size),
    queryFn: () => parcelService.listMyParcels(page, size),
  });
}

export function useParcels(page = 0, size = 20) {
  return useQuery({
    queryKey: parcelKeys.list({ page, size }),
    queryFn: () => parcelService.listAll(page, size),
  });
}

export function useParcel(id: string) {
  return useQuery({
    queryKey: parcelKeys.detail(id),
    queryFn: () => parcelService.getById(id),
    enabled: !!id,
  });
}

export function useParcelByTracking(trackingRef: string) {
  return useQuery({
    queryKey: parcelKeys.tracking(trackingRef),
    queryFn: () => parcelService.getByTracking(trackingRef),
    enabled: !!trackingRef,
  });
}

export function useCreateParcel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateParcelRequest) => parcelService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: parcelKeys.all });
    },
  });
}

export function useUpdateParcelStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateParcelStatusRequest;
    }) => parcelService.updateStatus(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: parcelKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: parcelKeys.lists() });
    },
  });
}

export function useAcceptParcel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => parcelService.accept(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: parcelKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: parcelKeys.lists() });
    },
  });
}

export function useValidateAndAccept() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      parcelService.validateAndAccept(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: parcelKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: parcelKeys.lists() });
    },
  });
}

export function useChangeDeliveryOption() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: ChangeDeliveryOptionRequest;
    }) => parcelService.changeDeliveryOption(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: parcelKeys.detail(id) });
    },
  });
}

export function useUpdateParcelMetadata() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateParcelMetadataRequest;
    }) => parcelService.updateMetadata(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: parcelKeys.detail(id) });
    },
  });
}
