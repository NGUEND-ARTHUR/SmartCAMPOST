export const ROLES = {
  ADMIN: "ADMIN",
  STAFF: "STAFF",
  AGENT: "AGENT",
  COURIER: "COURIER",
  CLIENT: "CLIENT",
  FINANCE: "FINANCE",
  RISK: "RISK",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES] | string | undefined;

export function hasAnyRole(
  role: Role,
  allowed: readonly string[] | string[]
): boolean {
  if (!role) return false;
  return allowed.includes(role);
}

export function getHomeByRole(role?: string) {
  switch (role) {
    case ROLES.ADMIN:
    case ROLES.STAFF:
      return "/admin/dashboard";
    case ROLES.AGENT:
      return "/agent/dashboard";
    case ROLES.COURIER:
      return "/courier/dashboard";
    case ROLES.CLIENT:
      return "/client/dashboard";
    case ROLES.FINANCE:
      return "/finance/dashboard";
    case ROLES.RISK:
      return "/risk/dashboard";
    default:
      return "/auth/login";
  }
}


