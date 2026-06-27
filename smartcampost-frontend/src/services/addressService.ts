/**
 * Address API Service
 */
import { httpClient } from "./apiClient";
import { Address } from "@/types";

export const addressService = {
  /**
   * Get current user's addresses
   */
  getMyAddresses(): Promise<Address[]> {
    return httpClient.get("/addresses/me");
  },

  /**
   * Create a new address
   */
  createAddress(data: Partial<Address>): Promise<Address> {
    return httpClient.post("/addresses", data);
  },

  /**
   * Get a specific address
   */
  getAddressById(id: string): Promise<Address> {
    return httpClient.get(`/addresses/${id}`);
  },

  /**
   * Update an address
   */
  updateAddress(id: string, data: Partial<Address>): Promise<Address> {
    return httpClient.put(`/addresses/${id}`, data);
  },

  /**
   * Delete an address
   */
  deleteAddress(id: string): Promise<void> {
    return httpClient.delete(`/addresses/${id}`);
  },

  /**
   * Get addresses for a specific client by phone (agent/staff/admin only)
   */
  getClientAddresses(phone: string): Promise<Address[]> {
    return httpClient.get(`/addresses/client/${encodeURIComponent(phone)}`);
  },

  /**
   * Create an address for a specific client by phone (agent/staff/admin only)
   */
  createAddressForClient(phone: string, data: Partial<Address>): Promise<Address> {
    return httpClient.post(`/addresses/client/${encodeURIComponent(phone)}`, data);
  },
};
