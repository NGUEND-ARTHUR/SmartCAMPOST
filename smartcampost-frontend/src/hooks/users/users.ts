import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../services/api/api";

export interface User {
  id: number;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  role: string;
  frozen: boolean;
  createdAt: string;
  updatedAt: string;
}

export function useListUsers(page = 0, size = 10) {
  return useQuery({
    queryKey: ["users", page, size],
    queryFn: async (): Promise<{ content: User[]; totalElements: number }> => {
      const response = await api.get(`/users?page=${page}&size=${size}`);
      return response.data;
    },
  });
}

export function useGetUser(id: number) {
  return useQuery({
    queryKey: ["users", id],
    queryFn: async (): Promise<User> => {
      const response = await api.get(`/users/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      phone: string;
      email?: string;
      address?: string;
    }) => {
      const response = await api.put("/users/profile", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      // Also invalidate auth context if needed
      queryClient.invalidateQueries({ queryKey: ["auth"] });
    },
  });
}

export function useFreezeUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: number) => {
      const response = await api.put(`/users/${userId}/freeze`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}