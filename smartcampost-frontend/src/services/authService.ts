import { api } from "./api";

export type UserRole = "ADMIN" | "STAFF" | "AGENT" | "COURIER" | "CLIENT";

export interface AuthUser {
  id: string;
  fullName?: string;
  username?: string;
  email?: string;
  phone?: string;
  role: UserRole;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  user: AuthUser;
}

export async function login(payload: LoginRequest) {
  const { data } = await api.post<AuthResponse>("/api/auth/login", payload);
  return data;
}
