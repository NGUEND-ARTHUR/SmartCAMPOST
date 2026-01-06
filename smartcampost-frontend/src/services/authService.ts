import { api } from "./api";

export type UserRole =
  | "ADMIN"
  | "STAFF"
  | "AGENT"
  | "COURIER"
  | "CLIENT"
  | "FINANCE"
  | "RISK";

export interface AuthUser {
  id: string;
  fullName?: string;
  email?: string;
  phone: string;
  role: UserRole;
}

// ---- Password login ----
export interface LoginRequest {
  phone: string;
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

// ---- OTP login & password reset ----

export interface SendOtpRequest {
  phone: string;
}

export interface LoginOtpConfirmRequest {
  phone: string;
  otp: string;
}

export async function requestLoginOtp(payload: SendOtpRequest) {
  await api.post("/api/auth/login/otp/request", payload);
}

export async function confirmLoginOtp(payload: LoginOtpConfirmRequest) {
  const { data } = await api.post<AuthResponse>(
    "/api/auth/login/otp/confirm",
    payload
  );
  return data;
}

export interface ResetPasswordRequest {
  phone: string;
  otp: string;
  newPassword: string;
}

export async function requestPasswordReset(payload: SendOtpRequest) {
  await api.post("/api/auth/password/reset/request", payload);
}

export async function confirmPasswordReset(payload: ResetPasswordRequest) {
  await api.post("/api/auth/password/reset/confirm", payload);
}

