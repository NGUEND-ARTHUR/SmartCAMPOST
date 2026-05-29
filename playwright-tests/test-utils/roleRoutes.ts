export const roleRoutes = {
  ADMIN: "/admin",
  ADMIN_ACCOUNTS: "/admin/accounts",
  ADMIN_FINANCE: "/admin/finance",
  ADMIN_FINANCE_CREATE: "/admin/finance/create",
  ADMIN_RISK: "/admin/risk",
  ADMIN_RISK_CREATE: "/admin/risk/create",
  CLIENT: "/client",
  AGENT: "/agent",
  AGENT_SCAN: "/agent/scan",
  COURIER: "/courier",
  COURIER_DELIVERIES: "/courier/deliveries",
  COURIER_DELIVERY_DETAIL_PREFIX: "/courier/deliveries/",
  STAFF: "/staff",
  FINANCE: "/finance",
  RISK: "/risk",
} as const;

export const roleHeadings = {
  ADMIN: "Admin Dashboard",
  ADMIN_ACCOUNTS: "User Account Management",
  CLIENT: "Client Dashboard",
  AGENT: "Agent Dashboard",
  COURIER: "Courier Dashboard",
  STAFF: "Staff Dashboard",
  FINANCE: "Finance Dashboard",
  RISK: "Risk Dashboard",
  SCAN: "Scan Console",
  CREATE_FINANCE: "Create Finance",
  CREATE_RISK: "Create Risk",
} as const;

export function roleRoute(role: keyof typeof roleRoutes) {
  return roleRoutes[role];
}
