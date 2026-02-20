import { useQuery } from "@tanstack/react-query";
import { httpClient } from "@/services/apiClient";

export interface AddressDto {
  id: string;
  label?: string;
  fullName: string;
  phone: string;
  addressLine: string;
  city: string;
  region?: string;
  country: string;
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
