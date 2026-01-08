import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../services/api/api";

export interface SupportTicket {
  id: number;
  subject: string;
  description: string;
  category: string;
  priority: "LOW" | "MEDIUM" | "HIGH";
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  createdAt: string;
  updatedAt: string;
  responses?: SupportResponse[];
}

export interface SupportResponse {
  id: number;
  message: string;
  author: string;
  authorRole: string;
  createdAt: string;
}

export function useListSupportTickets() {
  return useQuery({
    queryKey: ["support-tickets"],
    queryFn: async (): Promise<SupportTicket[]> => {
      const response = await api.get("/support/tickets");
      return response.data;
    },
  });
}

export function useCreateSupportTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      subject: string;
      description: string;
      category: string;
      priority: string;
    }) => {
      const response = await api.post("/support/tickets", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
    },
  });
}

export function useGetSupportTicket(id: number) {
  return useQuery({
    queryKey: ["support-tickets", id],
    queryFn: async (): Promise<SupportTicket> => {
      const response = await api.get(`/support/tickets/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
}