import { LoginRequest, LoginResponse, RegisterRequest } from "@/types";

const API_BASE_URL = "http://localhost:8080/api"; // backend URL

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
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

    const res = await fetch(url, config);
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`HTTP ${res.status} ${res.statusText} ${text}`);
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

  async sendOtp(phone: string): Promise<void> {
    return this.request<void>("/auth/send-otp", {
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
