/**
 * Refund React Query Hooks
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  refundService,
  CreateRefundRequest,
  UpdateRefundStatusRequest,
} from "@/services";

export const refundKeys = {
  all: ["refunds"] as const,
  lists: () => [...refundKeys.all, "list"] as const,
  list: (page: number, size: number) =>
    [...refundKeys.lists(), { page, size }] as const,
  details: () => [...refundKeys.all, "detail"] as const,
  detail: (id: string) => [...refundKeys.details(), id] as const,
  forPayment: (paymentId: string) =>
    [...refundKeys.all, "payment", paymentId] as const,
};

export function useRefunds(page = 0, size = 20) {
  return useQuery({
    queryKey: refundKeys.list(page, size),
    queryFn: () => refundService.listAll(page, size),
  });
}

export function useRefund(id: string) {
  return useQuery({
    queryKey: refundKeys.detail(id),
    queryFn: () => refundService.getById(id),
    enabled: !!id,
  });
}

export function useRefundsForPayment(paymentId: string) {
  return useQuery({
    queryKey: refundKeys.forPayment(paymentId),
    queryFn: () => refundService.getForPayment(paymentId),
    enabled: !!paymentId,
  });
}

export function useCreateRefund() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateRefundRequest) => refundService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: refundKeys.all });
    },
  });
}

export function useUpdateRefundStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateRefundStatusRequest;
    }) => refundService.updateStatus(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: refundKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: refundKeys.lists() });
    },
  });
}
