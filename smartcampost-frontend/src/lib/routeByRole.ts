export type AppRole =
  | "CLIENT"
  | "AGENT"
  | "COURIER"
  | "STAFF"
  | "ADMIN"
  | "FINANCE"
  | "RISK";

export function routeByRole(role?: string | null): string {
  switch (role) {
    case "CLIENT":
      return "/client";
    case "AGENT":
      return "/agent";
    case "COURIER":
      return "/courier";
    case "STAFF":
      return "/staff";
    case "ADMIN":
      return "/admin";
    case "FINANCE":
      return "/finance";
    case "RISK":
      return "/risk";
    // legacy/backend fallbacks
    case "admin":
      return "/admin";
    case "user":
      return "/client";
    default:
      return "/client";
  }
}
