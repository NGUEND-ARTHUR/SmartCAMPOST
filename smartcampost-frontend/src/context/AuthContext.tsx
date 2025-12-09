import {
  createContext,
  useContext,
  useState,
  ReactNode,
} from "react";
import type { AuthUser } from "../services/authService";

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  login: (user: AuthUser, token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// 🔹 Lazy init from localStorage instead of useEffect
function getInitialToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("smartcampost_token");
}

function getInitialUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const storedUser = localStorage.getItem("smartcampost_user");
  if (!storedUser) return null;
  try {
    return JSON.parse(storedUser) as AuthUser;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => getInitialToken());
  const [user, setUser] = useState<AuthUser | null>(() => getInitialUser());

  const login = (u: AuthUser, t: string) => {
    setUser(u);
    setToken(t);
    localStorage.setItem("smartcampost_token", t);
    localStorage.setItem("smartcampost_user", JSON.stringify(u));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("smartcampost_token");
    localStorage.removeItem("smartcampost_user");
  };

  return (
    <AuthContext.Provider
      value={{ user, token, login, logout, isAuthenticated: !!token }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return ctx;
}
