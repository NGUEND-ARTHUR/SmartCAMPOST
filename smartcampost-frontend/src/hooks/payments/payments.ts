import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../services/api/api";

export interface Payment {
  id: number;
  reference: string;
  type: string;
  amount: number;
  method: string;
  status: "PENDING" | "COMPLETED" | "FAILED";
  createdAt: string;
  updatedAt: string;
}

export function useListPayments() {
  return useQuery({
    queryKey: ["payments"],
    queryFn: async (): Promise<Payment[]> => {
      const response = await api.get("/payments");
      return response.data;
    },
  });
}

export function useMakePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ paymentId, method }: { paymentId: number; method: string }) => {
      const response = await api.post(`/payments/${paymentId}/pay`, { method });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
    },
  });
}