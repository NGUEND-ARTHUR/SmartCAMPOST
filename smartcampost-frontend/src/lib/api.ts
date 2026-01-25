import { LoginRequest, LoginResponse, RegisterRequest } from "@/types";
import axiosInstance from "@/lib/axiosClient";

// Error codes mapped to i18n keys
export const API_ERROR_CODES: Record<string, string> = {
  // Authentication errors
  INVALID_CREDENTIALS: "errors.invalidCredentials",
  USER_NOT_FOUND: "errors.userNotFound",
  ACCOUNT_LOCKED: "errors.accountLocked",
  ACCOUNT_DISABLED: "errors.accountDisabled",
  INVALID_OTP: "errors.invalidOtp",
  OTP_EXPIRED: "errors.otpExpired",

  // Validation errors
  VALIDATION_ERROR: "errors.validationError",
  INVALID_INPUT: "errors.invalidInput",
  DUPLICATE_ENTRY: "errors.duplicateEntry",

  // Resource errors
  NOT_FOUND: "errors.notFound",
  CONFLICT: "errors.conflict",

  // Server errors
  INTERNAL_ERROR: "errors.serverError",
  SERVICE_UNAVAILABLE: "errors.serviceUnavailable",

  // Network errors
  NETWORK_ERROR: "errors.networkError",
  TIMEOUT: "errors.timeout",
};

export interface ApiError {
  code: string;
  message: string;
  status: number;
  details?: Record<string, string>;
}

type RawAuth = {
  role?: string;
  userId?: string;
  entityId?: string;
  phone?: string;
  fullName?: string;
  accessToken?: string;
  token?: string;
};

class ApiClient {

  private parseErrorResponse(status: number, responseText: string): ApiError {
    // Try to parse as JSON first
    try {
      const json = JSON.parse(responseText);
      return {
        code: json.code || json.error || this.getErrorCodeFromStatus(status),
        message: json.message || json.error || responseText,
        status,
        details: json.details || json.errors,
      };
    } catch {
      // Not JSON, use status-based error
      return {
        code: this.getErrorCodeFromStatus(status),
        message: responseText || this.getDefaultMessage(status),
        status,
      };
    }
  }

  private getErrorCodeFromStatus(status: number): string {
    switch (status) {
      case 400:
        return "VALIDATION_ERROR";
      case 401:
        return "INVALID_CREDENTIALS";
      case 403:
        return "UNAUTHORIZED";
      case 404:
        return "NOT_FOUND";
      case 409:
        return "CONFLICT";
      case 423:
        return "ACCOUNT_LOCKED";
      case 500:
        return "INTERNAL_ERROR";
      case 503:
        return "SERVICE_UNAVAILABLE";
      default:
        return "UNKNOWN_ERROR";
    }
  }

  private getDefaultMessage(status: number): string {
    switch (status) {
      case 400:
        return "Invalid request data";
      case 401:
        return "Invalid credentials";
      case 403:
        return "Access denied";
      case 404:
        return "Resource not found";
      case 409:
        return "Resource already exists";
      case 423:
        return "Account is locked";
      case 500:
        return "Server error";
      case 503:
        return "Service temporarily unavailable";
      default:
        return "An error occurred";
    }
  }

  private async request<T>(endpoint: string, options: Record<string, unknown> = {}): Promise<T> {
    try {
      const res = await axiosInstance.request<T>({ url: endpoint, ...(options as any) });
      return res.data as T;
    } catch (err: any) {
      if (err.response) {
        const status = err.response.status;
        const data = err.response.data;
        const msg = typeof data === "string" ? data : JSON.stringify(data);
        throw this.parseErrorResponse(status, msg);
      }
      const networkErr: ApiError = {
        code: "NETWORK_ERROR",
        message: "Unable to connect to server. Please check your internet connection.",
        status: 0,
      };
      throw networkErr;
    }
  }

  // Backend login expects { phone, password } and returns AuthResponse
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    // allow using email field as phone if user typed phone
    const payload = {
      phone: credentials.email,
      password: credentials.password,
    };

    const auth = await this.request<RawAuth>("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    // map backend AuthResponse to frontend LoginResponse
    const rawRole = String(auth.role || "").trim();
    const normalizedRole = (() => {
      if (!rawRole) return "CLIENT";
      const upper = rawRole.toUpperCase();
      if (
        upper === "CLIENT" ||
        upper === "AGENT" ||
        upper === "COURIER" ||
        upper === "STAFF" ||
        upper === "ADMIN" ||
        upper === "FINANCE" ||
        upper === "RISK"
      ) {
        return upper;
      }
      if (rawRole === "admin") return "ADMIN";
      if (rawRole === "user") return "CLIENT";
      return "CLIENT";
    })();

    const user = {
      id: auth.userId || auth.entityId || "0",
      email: auth.phone || credentials.email || "",
      name: auth.fullName || "",
      role: normalizedRole,
    };

    return {
      user,
      token: auth.accessToken || auth.token || "",
    } as LoginResponse;
  }

  async requestOtpLogin(payload: {
    identifier: string;
  }): Promise<{ message?: string }> {
    return this.request<{ message?: string }>("/auth/login/otp/request", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async confirmOtpLogin(payload: {
    identifier: string;
    otp: string;
  }): Promise<LoginResponse> {
    return this.request<LoginResponse>("/auth/login/otp/confirm", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async requestPasswordReset(payload: {
    identifier: string;
  }): Promise<{ message?: string }> {
    return this.request<{ message?: string }>("/auth/password/reset/request", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async confirmPasswordReset(payload: {
    identifier: string;
    otp: string;
    newPassword: string;
  }): Promise<{ message?: string }> {
    return this.request<{ message?: string }>("/auth/password/reset/confirm", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async register(data: RegisterRequest): Promise<unknown> {
    return this.request<unknown>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async sendOtp(phone: string): Promise<{ otp?: string }> {
    // In DEV, backend returns { otp: "123456" }, otherwise empty object
    return this.request<{ otp?: string }>("/auth/send-otp", {
      method: "POST",
      body: JSON.stringify({ phone }),
    });
  }

  async verifyOtp(phone: string, otp: string): Promise<boolean> {
    const res = await this.request<{ verified: boolean }>("/auth/verify-otp", {
      method: "POST",
      body: JSON.stringify({ phone, otp }),
    });
    return res.verified;
  }

  // Convenience HTTP helpers
  public async get<T = unknown>(endpoint: string) {
    return this.request<T>(endpoint, { method: "GET" });
  }

  public async post<T = unknown>(endpoint: string, body?: unknown) {
    return this.request<T>(endpoint, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  public async put<T = unknown>(endpoint: string, body?: unknown) {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  public async patch<T = unknown>(endpoint: string, body?: unknown) {
    return this.request<T>(endpoint, {
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  public async delete<T = unknown>(endpoint: string) {
    return this.request<T>(endpoint, { method: "DELETE" });
  }
}

export const apiClient = new ApiClient();

export default apiClient;
