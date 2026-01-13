/**
 * Integration Config React Query Hooks
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { integrationConfigService, IntegrationConfigRequest } from "@/services";

export const integrationKeys = {
  all: ["integrations"] as const,
  lists: () => [...integrationKeys.all, "list"] as const,
  list: (page: number, size: number) =>
    [...integrationKeys.lists(), { page, size }] as const,
  details: () => [...integrationKeys.all, "detail"] as const,
  detail: (id: string) => [...integrationKeys.details(), id] as const,
};

export function useIntegrations(page = 0, size = 20) {
  return useQuery({
    queryKey: integrationKeys.list(page, size),
    queryFn: () => integrationConfigService.listAll(page, size),
  });
}

export function useIntegration(id: string) {
  return useQuery({
    queryKey: integrationKeys.detail(id),
    queryFn: () => integrationConfigService.getById(id),
    enabled: !!id,
  });
}

export function useCreateIntegration() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: IntegrationConfigRequest) =>
      integrationConfigService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: integrationKeys.all });
    },
  });
}

export function useUpdateIntegration() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: IntegrationConfigRequest;
    }) => integrationConfigService.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: integrationKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: integrationKeys.lists() });
    },
  });
}
