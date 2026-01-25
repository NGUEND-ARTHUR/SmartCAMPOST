import axios from "axios";

const rawBase = import.meta.env.VITE_API_URL as string | undefined;

function normalizeBase(url?: string) {
  if (!url) return "https://smartcampost-backend.onrender.com/api";
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
