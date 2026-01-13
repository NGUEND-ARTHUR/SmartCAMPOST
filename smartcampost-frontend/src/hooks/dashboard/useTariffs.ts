/**
 * Tariff React Query Hooks
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  tariffService,
  CreateTariffRequest,
  UpdateTariffRequest,
  TariffQuoteRequest,
} from "@/services";

export const tariffKeys = {
  all: ["tariffs"] as const,
  lists: () => [...tariffKeys.all, "list"] as const,
  list: (page: number, size: number, serviceType?: string) =>
    [...tariffKeys.lists(), { page, size, serviceType }] as const,
  details: () => [...tariffKeys.all, "detail"] as const,
  detail: (id: string) => [...tariffKeys.details(), id] as const,
  quote: (params: TariffQuoteRequest) =>
    [...tariffKeys.all, "quote", params] as const,
};

export function useTariffs(page = 0, size = 20, serviceType?: string) {
  return useQuery({
    queryKey: tariffKeys.list(page, size, serviceType),
    queryFn: () => tariffService.listAll(page, size, serviceType),
  });
}

export function useTariff(id: string) {
  return useQuery({
    queryKey: tariffKeys.detail(id),
    queryFn: () => tariffService.getById(id),
    enabled: !!id,
  });
}

export function useCreateTariff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTariffRequest) => tariffService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tariffKeys.all });
    },
  });
}

export function useUpdateTariff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTariffRequest }) =>
      tariffService.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: tariffKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: tariffKeys.lists() });
    },
  });
}

export function useDeleteTariff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tariffService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tariffKeys.all });
    },
  });
}

export function useTariffQuote() {
  return useMutation({
    mutationFn: (data: TariffQuoteRequest) => tariffService.quote(data),
  });
}
