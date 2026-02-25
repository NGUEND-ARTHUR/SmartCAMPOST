import { useQuery } from "@tanstack/react-query";
import { httpClient } from "@/services/apiClient";

export interface AddressDto {
  id: string;
  label: string;
  street?: string | null;
  city: string;
  region: string;
  country: string;
  latitude?: number | null;
  longitude?: number | null;
}

export function useMyAddresses() {
  return useQuery({
    queryKey: ["myAddresses"],
    queryFn: async (): Promise<AddressDto[]> => {
      const res = await httpClient.get("/addresses/me");
      return res as AddressDto[];
    },
  });
}
