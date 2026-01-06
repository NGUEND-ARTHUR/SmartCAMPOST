import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function getHomeByRole(role?: string) {
  switch (role) {
    case "ADMIN":
    case "STAFF":
      return "/admin/dashboard";
    case "AGENT":
      return "/agent/dashboard";
    case "COURIER":
      return "/courier/dashboard";
    case "CLIENT":
      return "/client/dashboard";
    case "FINANCE":
      return "/finance/dashboard";
    case "RISK":
      return "/risk/dashboard";
    default:
      return "/auth/login";
  }
}

export function PrivateRoute() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }

  return <Outlet />;
}
