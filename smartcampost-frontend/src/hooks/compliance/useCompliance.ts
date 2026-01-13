/**
 * Compliance React Query Hooks
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { complianceService, ResolveRiskAlertRequest } from "@/services";
import { adminKeys } from "../users/useAdmin";

export const complianceKeys = {
  all: ["compliance"] as const,
  alerts: (page: number, size: number) =>
    [...complianceKeys.all, "alerts", { page, size }] as const,
  alert: (id: string) => [...complianceKeys.all, "alert", id] as const,
  report: (from: string, to: string) =>
    [...complianceKeys.all, "report", { from, to }] as const,
};

export function useComplianceAlerts(page = 0, size = 20) {
  return useQuery({
    queryKey: complianceKeys.alerts(page, size),
    queryFn: () => complianceService.listAlerts(page, size),
  });
}

export function useComplianceAlert(id: string) {
  return useQuery({
    queryKey: complianceKeys.alert(id),
    queryFn: () => complianceService.getAlert(id),
    enabled: !!id,
  });
}

export function useResolveComplianceAlert() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ResolveRiskAlertRequest }) =>
      complianceService.resolveAlert(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: complianceKeys.all });
    },
  });
}

export function useComplianceReport(from: string, to: string) {
  return useQuery({
    queryKey: complianceKeys.report(from, to),
    queryFn: () => complianceService.generateReport(from, to),
    enabled: !!from && !!to,
  });
}

export function useComplianceFreezeAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => complianceService.freezeAccount(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: complianceKeys.all });
      queryClient.invalidateQueries({ queryKey: adminKeys.users() });
    },
  });
}

export function useComplianceUnfreezeAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => complianceService.unfreezeAccount(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: complianceKeys.all });
      queryClient.invalidateQueries({ queryKey: adminKeys.users() });
    },
  });
}

// Mutation wrapper for generating compliance reports
export function useGenerateComplianceReport() {
  return useMutation({
    mutationFn: ({
      startDate,
      endDate,
    }: {
      startDate: string;
      endDate: string;
    }) => complianceService.generateReport(startDate, endDate),
  });
}
