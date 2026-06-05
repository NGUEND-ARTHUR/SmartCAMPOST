import type { ReactNode } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";

type Props = {
  allowedRoles?: string[];
  children?: ReactNode;
};

function readPersistedAuth() {
  try {
    const raw = localStorage.getItem("auth-storage");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.state || parsed;
  } catch {
    return null;
  }
}

export function ProtectedRoute({ allowedRoles }: Props) {
  const { isAuthenticated, user, hydrated } = useAuthStore();
  console.info(
    "[ProtectedRoute] hydrated:",
    hydrated,
    "isAuthenticated:",
    isAuthenticated,
    "storeUserRole:",
    user?.role,
  );

  // Wait for the persisted auth store to finish hydrating before making
  // redirect decisions. This avoids a race where the app redirects to login
  // before Zustand restores the persisted auth state.
  if (!hydrated) return null;

  if (
    allowedRoles?.length &&
    (!user?.role || !allowedRoles.includes(user.role))
  ) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

export function ProtectedWrapper({ allowedRoles, children }: Props) {
  const { isAuthenticated, user, hydrated } = useAuthStore();

  if (!hydrated) {
    const persisted = readPersistedAuth();
    if (persisted?.isAuthenticated && persisted?.user?.role) {
      if (!allowedRoles?.length || allowedRoles.includes(persisted.user.role)) {
        return <>{children}</>;
      }
    }
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }

  if (
    allowedRoles?.length &&
    (!user?.role || !allowedRoles.includes(user.role))
  ) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
