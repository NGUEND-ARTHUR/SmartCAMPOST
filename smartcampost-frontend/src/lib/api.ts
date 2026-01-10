import { LoginRequest, LoginResponse, RegisterRequest } from '@/types';

const API_BASE_URL = 'http://localhost:8080/api'; // backend URL

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    const res = await fetch(url, config);
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`HTTP ${res.status} ${res.statusText} ${text}`);
    }
    // Some endpoints return empty 200 responses (void). Safely handle empty body.
    const text = await res.text().catch(() => '');
    if (!text) {
      return {} as T;
    }
    try {
      return JSON.parse(text) as T;
    } catch {
      // Fallback: return raw text when JSON parsing fails
      return (text as unknown) as T;
    }
  }

  // Backend login expects { phone, password } and returns AuthResponse
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    // allow using email field as phone if user typed phone
    const payload = {
      phone: credentials.email,
      password: credentials.password,
    };

    const auth = await this.request<any>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    // map backend AuthResponse to frontend LoginResponse
    const user = {
      id: auth.userId || auth.entityId || '0',
      email: auth.phone || credentials.email || '',
      name: auth.fullName || '',
      role: auth.role || 'user',
    };

    return {
      user,
      token: auth.accessToken || auth.token || '',
    } as LoginResponse;
  }

  async register(data: RegisterRequest): Promise<any> {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async sendOtp(phone: string): Promise<void> {
    return this.request<void>('/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    });
  }

  async verifyOtp(phone: string, otp: string): Promise<boolean> {
    const res = await this.request<{ verified: boolean }>('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ phone, otp }),
    });
    return res.verified;
  }
}

export const apiClient = new ApiClient();