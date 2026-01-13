/**
 * Payment React Query Hooks
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  paymentService,
  InitPaymentRequest,
  ConfirmPaymentRequest,
} from "@/services";

export const paymentKeys = {
  all: ["payments"] as const,
  lists: () => [...paymentKeys.all, "list"] as const,
  list: (page: number, size: number) =>
    [...paymentKeys.lists(), { page, size }] as const,
  details: () => [...paymentKeys.all, "detail"] as const,
  detail: (id: string) => [...paymentKeys.details(), id] as const,
  forParcel: (parcelId: string) =>
    [...paymentKeys.all, "parcel", parcelId] as const,
};

export function usePayments(page = 0, size = 20) {
  return useQuery({
    queryKey: paymentKeys.list(page, size),
    queryFn: () => paymentService.listAll(page, size),
  });
}

export function usePayment(id: string) {
  return useQuery({
    queryKey: paymentKeys.detail(id),
    queryFn: () => paymentService.getById(id),
    enabled: !!id,
  });
}

export function usePaymentsForParcel(parcelId: string) {
  return useQuery({
    queryKey: paymentKeys.forParcel(parcelId),
    queryFn: () => paymentService.getForParcel(parcelId),
    enabled: !!parcelId,
  });
}

export function useInitPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: InitPaymentRequest) => paymentService.init(data),
    onSuccess: (_, data) => {
      queryClient.invalidateQueries({
        queryKey: paymentKeys.forParcel(data.parcelId),
      });
      queryClient.invalidateQueries({ queryKey: paymentKeys.lists() });
    },
  });
}

export function useConfirmPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ConfirmPaymentRequest) => paymentService.confirm(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentKeys.all });
    },
  });
}
