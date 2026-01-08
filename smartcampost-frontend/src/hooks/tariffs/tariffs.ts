import { useQuery } from "@tanstack/react-query";
import { api } from "../../services/api/api";

export interface Tariff {
  id: number;
  name: string;
  baseRate: number;
  weightRate: number;
  description?: string;
  active: boolean;
}

export function useListTariffs() {
  return useQuery({
    queryKey: ["tariffs"],
    queryFn: async (): Promise<Tariff[]> => {
      const response = await api.get("/tariffs");
      return response.data;
    },
  });
}

export function useGetTariff(id: number) {
  return useQuery({
    queryKey: ["tariffs", id],
    queryFn: async (): Promise<Tariff> => {
      const response = await api.get(`/tariffs/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
}