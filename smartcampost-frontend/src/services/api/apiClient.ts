import axios from "axios";

const API_BASE_URL = "http://localhost:8080/api"; // 🔁 change if needed

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

// Attach token automatically if present
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("smartcampost_token");
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
