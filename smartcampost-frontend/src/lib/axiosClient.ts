import axios from "axios";

const rawBase = import.meta.env.VITE_API_URL as string | undefined;

function normalizeBase(url?: string) {
  const fallback = "http://localhost:8082/api";
  if (!url) return fallback;
  const trimmed = url.replace(/\/+$/, "");
  if (trimmed.endsWith("/api")) return trimmed;
  return `${trimmed}/api`;
}

export const axiosInstance = axios.create({
  baseURL: normalizeBase(rawBase),
  timeout: 60_000,
  headers: {
    "Content-Type": "application/json",
  },
});

// ── Retry logic for cold-start / sleeping backends ──
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 3000;
const RETRYABLE_CODES = ["ECONNABORTED", "ERR_NETWORK", "ETIMEDOUT"];

function shouldRetry(error: any, retryCount: number): boolean {
  if (retryCount >= MAX_RETRIES) return false;
  if (error.response) return false;
  const code = error.code || "";
  return RETRYABLE_CODES.includes(code) || error.message?.includes("timeout");
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

axiosInstance.interceptors.request.use((config) => {
  try {
    const stored = localStorage.getItem("auth-storage");
    if (stored) {
      const parsed = JSON.parse(stored);
      const token = parsed?.state?.token || parsed?.token || null;
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
  } catch {
    // ignore
  }
  (config as any).__retryCount = (config as any).__retryCount || 0;
  return config;
});

axiosInstance.interceptors.response.use(
  (res) => res,
  async (error) => {
    const config = error.config;

    // Retry on network/timeout errors (backend cold start)
    if (config && shouldRetry(error, (config as any).__retryCount || 0)) {
      (config as any).__retryCount = ((config as any).__retryCount || 0) + 1;
      console.warn(
        `[axios] Retry ${(config as any).__retryCount}/${MAX_RETRIES} for ${config.url} (${error.code || error.message})`,
      );
      await delay(RETRY_DELAY_MS);
      return axiosInstance(config);
    }

    // 401 = token expired/revoked → clear session
    if (error?.response?.status === 401) {
      try {
        const stored = localStorage.getItem("auth-storage");
        const hadToken = stored && JSON.parse(stored)?.state?.token;
        if (hadToken) {
          localStorage.removeItem("auth-storage");
          if (
            typeof window !== "undefined" &&
            !window.location.pathname.startsWith("/auth")
          ) {
            window.location.href = "/auth/login";
          }
        }
      } catch {
        // ignore
      }
    }

    const serverMessage = error?.response?.data?.message;
    if (serverMessage && typeof serverMessage === "string") {
      return Promise.reject(new Error(serverMessage));
    }

    // Better error message for timeout/network errors
    if (!error.response) {
      const msg =
        error.code === "ECONNABORTED"
          ? "Server is starting up — please try again in a few seconds"
          : "Network error — check your internet connection";
      return Promise.reject(new Error(msg));
    }

    return Promise.reject(error);
  },
);

export default axiosInstance;
