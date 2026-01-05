import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function getHomeByRole(role?: string) {
  switch (role) {
    case "ADMIN":
    case "STAFF":
      return "/";
    case "AGENT":
      return "/agent";
    case "COURIER":
      return "/courier";
    case "CLIENT":
      return "/client";
    default:
      return "/login";
  }
}

export function PrivateRoute() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
