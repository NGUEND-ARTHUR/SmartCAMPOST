import { ReactNode } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { hasAnyRole } from "../config/roles";

interface GuardProps {
  children?: ReactNode;
}

export function AuthGuard({ children }: GuardProps) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname + location.search }}
      />
    );
  }

  return children ?? <Outlet />;
}

interface RoleGuardProps extends GuardProps {
  allowedRoles: string[];
}

export function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const { user } = useAuth();

  if (!hasAnyRole(user?.role, allowedRoles)) {
    return <Navigate to="/forbidden" replace />;
  }

  return children ?? <Outlet />;
}


