import { useMemo } from "react";
import { api } from "../../services/api";

/**
 * Thin hook wrapper around the shared Axios client.
 * Keeps a single configured instance (baseURL + Authorization header).
 */
export function useApiClient() {
  // useMemo mainly for typing consistency and future extension
  return useMemo(() => api, []);
}


