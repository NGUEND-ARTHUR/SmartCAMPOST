/**
 * Finance React Query Hooks
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { financeService } from "@/services";
import { refundKeys } from "./useRefunds";

export const financeKeys = {
  all: ["finance"] as const,
  refunds: (page: number, size: number) =>
    [...financeKeys.all, "refunds", { page, size }] as const,
};

export function useFinanceRefunds(page = 0, size = 20) {
  return useQuery({
    queryKey: financeKeys.refunds(page, size),
    queryFn: () => financeService.listRefunds(page, size),
  });
}

export function useFinanceUpdateRefundStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ refundId, status }: { refundId: string; status: string }) =>
      financeService.updateRefundStatus(refundId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financeKeys.all });
      queryClient.invalidateQueries({ queryKey: refundKeys.all });
    },
  });
}
