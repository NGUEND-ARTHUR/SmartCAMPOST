/**
 * Agency React Query Hooks
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  agencyService,
  CreateAgencyRequest,
  UpdateAgencyRequest,
} from "@/services";

export const agencyKeys = {
  all: ["agencies"] as const,
  lists: () => [...agencyKeys.all, "list"] as const,
  list: (page: number, size: number) =>
    [...agencyKeys.lists(), { page, size }] as const,
  details: () => [...agencyKeys.all, "detail"] as const,
  detail: (id: string) => [...agencyKeys.details(), id] as const,
};

export function useAgencies(page = 0, size = 20) {
  return useQuery({
    queryKey: agencyKeys.list(page, size),
    queryFn: () => agencyService.listAll(page, size),
  });
}

export function useAgency(id: string) {
  return useQuery({
    queryKey: agencyKeys.detail(id),
    queryFn: () => agencyService.getById(id),
    enabled: !!id,
  });
}

export function useCreateAgency() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateAgencyRequest) => agencyService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: agencyKeys.all });
    },
  });
}

export function useUpdateAgency() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAgencyRequest }) =>
      agencyService.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: agencyKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: agencyKeys.lists() });
    },
  });
}
