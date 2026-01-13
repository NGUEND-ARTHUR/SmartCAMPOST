/**
 * Admin React Query Hooks
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminService } from "@/services";

export const adminKeys = {
  all: ["admin"] as const,
  users: () => [...adminKeys.all, "users"] as const,
  usersByRole: (role: string) => [...adminKeys.users(), "role", role] as const,
};

export function useAllUsers() {
  return useQuery({
    queryKey: adminKeys.users(),
    queryFn: () => adminService.listAllUsers(),
  });
}

export function useUsersByRole(role: string) {
  return useQuery({
    queryKey: adminKeys.usersByRole(role),
    queryFn: () => adminService.listUsersByRole(role),
    enabled: !!role,
  });
}

export function useFreezeUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, frozen }: { userId: string; frozen: boolean }) =>
      adminService.freezeUser(userId, frozen),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.users() });
    },
  });
}
