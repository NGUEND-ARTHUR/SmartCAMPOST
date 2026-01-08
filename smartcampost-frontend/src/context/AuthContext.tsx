import { createContext, useContext, useMemo, useState, ReactNode } from "react";
import type { AuthUser } from "../services/auth/authService";
import { getToken, getUser, setToken, setUser, clearAuthStorage } from "../utils/storage";

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  login: (user: AuthUser, token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [tokenState, setTokenState] = useState<string | null>(() => getToken());
  const [userState, setUserState] = useState<AuthUser | null>(() => getUser());

  const login = (u: AuthUser, t: string) => {
    setUserState(u);
    setTokenState(t);
    setUser(u);
    setToken(t);
  };

  const logout = () => {
    setUserState(null);
    setTokenState(null);
    clearAuthStorage();
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      user: userState,
      token: tokenState,
      login,
      logout,
      isAuthenticated: !!tokenState,
    }),
    [userState, tokenState]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
