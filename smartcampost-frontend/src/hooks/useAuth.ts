import { useAuth as useAuthContext } from "../context/AuthContext";

/**
 * Thin wrapper re-export so feature hooks can import from `hooks/useAuth`
 * instead of reaching into the context folder.
 */
export function useAuth() {
  return useAuthContext();
}


