import { apiClient } from "./apiClient";

export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthUser {
  id: string;
  username: string;
  role: string;
}

export interface LoginResponse {
  accessToken: string;
  tokenType?: string;
  user: AuthUser;
}

export async function login(req: LoginRequest): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginResponse>("/auth/login", req);
  return data;
}
