import { useMemo } from "react";
import { useAuth } from "../useAuth";
import { hasAnyRole } from "../../app/config/roles";

/**
 * Hook used inside pages/components to quickly check role permissions.
 * It does NOT redirect; combine with RouteGuards for navigation.
 */
export function useRoleGuard(requiredRoles: string[]) {
  const { user } = useAuth();

  const allowed = useMemo(
    () => hasAnyRole(user?.role, requiredRoles),
    [user?.role, requiredRoles]
  );

  return {
    allowed,
    role: user?.role,
  };
}


