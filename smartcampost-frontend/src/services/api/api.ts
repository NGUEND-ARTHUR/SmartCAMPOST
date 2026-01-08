import axios from "axios";
import { getToken, clearAuthStorage } from "../../utils/storage";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    // Si backend renvoie 401 => logout automatique
    if (err?.response?.status === 401) {
      clearAuthStorage();
    }
    return Promise.reject(err);
  }
);
