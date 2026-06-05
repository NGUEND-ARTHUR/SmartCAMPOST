import { create } from "zustand";
import { persist } from "zustand/middleware";
import { AuthState, User, LoginRequest, LoginResponse } from "@/types";
import { apiClient } from "@/lib/api";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8082";

interface AuthStore extends AuthState {
  tokenExpiresAt: number | null;    // Unix ms timestamp when access token expires
  refreshTokenValue: string | null; // Stored refresh token
  login: (credentials: LoginRequest) => Promise<LoginResponse>;
  loginWithGoogle: (idToken: string) => Promise<LoginResponse>;
  setAuth: (user: User, token: string, refreshToken?: string) => void;
  logout: () => void;
  refreshToken: () => Promise<void>;
  setLoading: (loading: boolean) => void;
  hydrated: boolean;
}

/** Parse JWT expiry from token payload without verifying signature */
function parseTokenExpiry(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp ? payload.exp * 1000 : null; // Convert to ms
  } catch {
    return null;
  }
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      hydrated: false,
      user: null,
      token: null,
      tokenExpiresAt: null,
      refreshTokenValue: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (credentials: LoginRequest) => {
        set({ isLoading: true });
        try {
          const res = await apiClient.login(credentials);
          const expiresAt = res.token ? parseTokenExpiry(res.token) : null;
          set({
            user: res.user,
            token: res.token,
            tokenExpiresAt: expiresAt,
            refreshTokenValue: res.refreshToken ?? null,
            isAuthenticated: true,
            isLoading: false,
          });
          return res;
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      loginWithGoogle: async (idToken: string) => {
        set({ isLoading: true });
        try {
          const res = await apiClient.loginWithGoogle(idToken);
          const expiresAt = res.token ? parseTokenExpiry(res.token) : null;
          set({
            user: res.user,
            token: res.token,
            tokenExpiresAt: expiresAt,
            refreshTokenValue: res.refreshToken ?? null,
            isAuthenticated: true,
            isLoading: false,
          });
          return res;
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      setAuth: (user: User, token: string, refreshToken?: string) => {
        const expiresAt = parseTokenExpiry(token);
        set({
          user,
          token,
          tokenExpiresAt: expiresAt,
          refreshTokenValue: refreshToken ?? null,
          isAuthenticated: true,
          isLoading: false,
        });
      },

      /**
       * Silently refresh the access token using the stored refresh token.
       * Rotates both access and refresh tokens.
       */
      refreshToken: async () => {
        const currentRefreshToken = get().refreshTokenValue;
        if (!currentRefreshToken) {
          throw new Error("No refresh token available");
        }

        const response = await fetch(`${API_BASE}/api/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken: currentRefreshToken }),
        });

        if (!response.ok) {
          // Refresh failed — clear session
          get().logout();
          throw new Error("Session expired. Please log in again.");
        }

        const data = await response.json();
        const expiresAt = data.accessToken ? parseTokenExpiry(data.accessToken) : null;

        set({
          token: data.accessToken,
          tokenExpiresAt: expiresAt,
          refreshTokenValue: data.refreshToken ?? currentRefreshToken,
        });
      },

      logout: () => {
        const token = get().token;
        const refreshTokenVal = get().refreshTokenValue;

        // Notify backend to blacklist both tokens (fire-and-forget)
        if (token) {
          fetch(`${API_BASE}/api/auth/logout`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
          }).catch(() => {});
        }
        // Also blacklist refresh token if held
        if (refreshTokenVal) {
          fetch(`${API_BASE}/api/auth/logout`, {
            method: "POST",
            headers: { Authorization: `Bearer ${refreshTokenVal}` },
          }).catch(() => {});
        }

        set({
          user: null,
          token: null,
          tokenExpiresAt: null,
          refreshTokenValue: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        tokenExpiresAt: state.tokenExpiresAt,
        refreshTokenValue: state.refreshTokenValue,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        try {
          setTimeout(() => {
            try {
              (useAuthStore as any).setState({ hydrated: true });
              console.info("[authStore] rehydrate complete, hydrated flag set");
            } catch (e) {
              console.warn("[authStore] inner setState error", String(e));
            }
          }, 0);
        } catch (e) {
          console.warn("[authStore] onRehydrateStorage error", String(e));
        }
    },
  )
);
