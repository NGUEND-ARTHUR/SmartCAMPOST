import { useQuery } from "react-query";
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
  return useQuery<AddressDto[]>("myAddresses", async () => {
    const res = await httpClient.get("/addresses/me");
    return res as AddressDto[];
  });
}
