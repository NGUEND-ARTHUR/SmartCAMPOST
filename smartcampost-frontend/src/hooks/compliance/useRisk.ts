/**
 * Risk React Query Hooks
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { riskService, RiskAlertUpdateRequest } from "@/services";
import { adminKeys } from "../users/useAdmin";

export const riskKeys = {
  all: ["risk"] as const,
  alerts: (page: number, size: number) =>
    [...riskKeys.all, "alerts", { page, size }] as const,
};

export function useRiskAlerts(page = 0, size = 20) {
  return useQuery({
    queryKey: riskKeys.alerts(page, size),
    queryFn: () => riskService.listAlerts(page, size),
  });
}

export function useUpdateRiskAlert() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: RiskAlertUpdateRequest }) =>
      riskService.updateAlert(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: riskKeys.all });
    },
  });
}

export function useRiskFreezeUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, frozen }: { userId: string; frozen: boolean }) =>
      riskService.freezeUser(userId, frozen),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: riskKeys.all });
      queryClient.invalidateQueries({ queryKey: adminKeys.users() });
    },
  });
}
