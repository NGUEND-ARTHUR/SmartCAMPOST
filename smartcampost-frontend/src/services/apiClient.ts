import axiosInstance from "@/lib/axiosClient";

export interface PaginatedResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

class AxiosHttpClient {
  async request<T = unknown>(
    endpoint: string,
    config: Record<string, unknown> = {},
  ): Promise<T> {
    const res = await axiosInstance.request<T>({
      url: endpoint,
      ...(config as any),
    });
    return res.data as T;
  }

  get<T = unknown>(endpoint: string) {
    return this.request<T>(endpoint, { method: "GET" });
  }

  post<T = unknown>(endpoint: string, body?: unknown) {
    return this.request<T>(endpoint, { method: "POST", data: body });
  }

  put<T = unknown>(endpoint: string, body?: unknown) {
    return this.request<T>(endpoint, { method: "PUT", data: body });
  }

  patch<T = unknown>(endpoint: string, body?: unknown) {
    return this.request<T>(endpoint, { method: "PATCH", data: body });
  }

  delete<T = unknown>(endpoint: string) {
    return this.request<T>(endpoint, { method: "DELETE" });
  }
}

export const httpClient = new AxiosHttpClient();
