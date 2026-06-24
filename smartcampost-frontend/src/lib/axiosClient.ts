import axios from "axios";

const rawBase = import.meta.env.VITE_API_URL as string | undefined;

function normalizeBase(url?: string) {
  // Prefer explicit VITE_API_URL from environment. If missing, fall back to localhost for dev.
  const fallback = "http://localhost:8082/api";
  if (!url) return fallback;
  const trimmed = url.replace(/\/+$/, "");
  if (trimmed.endsWith("/api")) return trimmed;
  return `${trimmed}/api`;
}

export const axiosInstance = axios.create({
  baseURL: normalizeBase(rawBase),
  headers: {
    "Content-Type": "application/json",
  },
});

axiosInstance.interceptors.request.use((config) => {
  try {
    const stored = localStorage.getItem("auth-storage");
    if (stored) {
      const parsed = JSON.parse(stored);
      const token = parsed?.state?.token || parsed?.token || null;
      if (token && config.headers) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
  } catch {
    // ignore
  }
  return config;
});

axiosInstance.interceptors.response.use(
  (res) => res,
  (error) => {
    // A 401 while we believe we're authenticated means the token was revoked or expired
    // server-side (e.g. logout elsewhere, frozen account). Clear the stale session so the
    // UI doesn't keep acting as if the user is still logged in.
    if (error?.response?.status === 401) {
      try {
        const stored = localStorage.getItem("auth-storage");
        const hadToken = stored && JSON.parse(stored)?.state?.token;
        if (hadToken) {
          localStorage.removeItem("auth-storage");
          if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
            window.location.href = "/login";
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
    return Promise.reject(error);
  },
);

export default axiosInstance;
