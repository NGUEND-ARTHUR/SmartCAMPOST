import { LoginRequest, LoginResponse, RegisterRequest } from "@/types";

const API_BASE_URL = "http://localhost:8080/api"; // backend URL

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

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

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
      case 400: return "VALIDATION_ERROR";
      case 401: return "INVALID_CREDENTIALS";
      case 403: return "UNAUTHORIZED";
      case 404: return "NOT_FOUND";
      case 409: return "CONFLICT";
      case 423: return "ACCOUNT_LOCKED";
      case 500: return "INTERNAL_ERROR";
      case 503: return "SERVICE_UNAVAILABLE";
      default: return "UNKNOWN_ERROR";
    }
  }

  private getDefaultMessage(status: number): string {
    switch (status) {
      case 400: return "Invalid request data";
      case 401: return "Invalid credentials";
      case 403: return "Access denied";
      case 404: return "Resource not found";
      case 409: return "Resource already exists";
      case 423: return "Account is locked";
      case 500: return "Server error";
      case 503: return "Service temporarily unavailable";
      default: return "An error occurred";
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    const config: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    };

    let res: Response;
    try {
      res = await fetch(url, config);
    } catch (networkError) {
      // Network error (no connection, DNS failure, etc.)
      const error: ApiError = {
        code: "NETWORK_ERROR",
        message: "Unable to connect to server. Please check your internet connection.",
        status: 0,
      };
      throw error;
    }

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      const error = this.parseErrorResponse(res.status, text);
      throw error;
    }
    
    // Some endpoints return empty 200 responses (void). Safely handle empty body.
    const text = await res.text().catch(() => "");
    if (!text) {
      return {} as T;
    }
    try {
      return JSON.parse(text) as T;
    } catch {
      // Fallback: return raw text when JSON parsing fails
      return text as unknown as T;
    }
  }

  // Backend login expects { phone, password } and returns AuthResponse
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    // allow using email field as phone if user typed phone
    const payload = {
      phone: credentials.email,
      password: credentials.password,
    };

    const auth = await this.request<any>("/auth/login", {
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

  async register(data: RegisterRequest): Promise<any> {
    return this.request("/auth/register", {
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
}

export const apiClient = new ApiClient();
