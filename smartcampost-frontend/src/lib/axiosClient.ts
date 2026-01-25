import axios from "axios";

const rawBase = import.meta.env.VITE_API_URL as string | undefined;

function normalizeBase(url?: string) {
  // Prefer explicit VITE_API_URL from environment. If missing, fall back to localhost for dev.
  const fallback = "http://localhost:8080/api";
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

export default axiosInstance;
