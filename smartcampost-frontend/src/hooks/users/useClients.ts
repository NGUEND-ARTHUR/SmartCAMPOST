/**
 * Client React Query Hooks
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  clientService,
  UpdateClientProfileRequest,
  UpdateLanguageRequest,
} from "@/services";

export const clientKeys = {
  all: ["clients"] as const,
  lists: () => [...clientKeys.all, "list"] as const,
  list: (page: number, size: number) =>
    [...clientKeys.lists(), { page, size }] as const,
  details: () => [...clientKeys.all, "detail"] as const,
  detail: (id: string) => [...clientKeys.details(), id] as const,
  me: () => [...clientKeys.all, "me"] as const,
};

export function useMyProfile() {
  return useQuery({
    queryKey: clientKeys.me(),
    queryFn: () => clientService.getMyProfile(),
  });
}

export function useClients(page = 0, size = 20) {
  return useQuery({
    queryKey: clientKeys.list(page, size),
    queryFn: () => clientService.listAll(page, size),
  });
}

export function useClient(id: string) {
  return useQuery({
    queryKey: clientKeys.detail(id),
    queryFn: () => clientService.getById(id),
    enabled: !!id,
  });
}

export function useUpdateMyProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateClientProfileRequest) =>
      clientService.updateMyProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clientKeys.me() });
    },
  });
}

export function useUpdatePreferredLanguage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateLanguageRequest) =>
      clientService.updatePreferredLanguage(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clientKeys.me() });
    },
  });
}
