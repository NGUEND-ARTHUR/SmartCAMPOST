/**
 * Finance API Service
 */
import { httpClient } from "./apiClient";
import type { PaginatedResponse } from "./apiClient";

export interface FinanceRecord {
  id?: string;
  name: string;
  description: string;
  initialBalance: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface FinanceStats {
  totalRevenue: number;
  pendingPayments: number;
  completedPayments: number;
  refundsPending: number;
  revenueGrowth: number;
}

export interface RefundRecord {
  id?: string;
  status?: string;
  amount?: number;
  reason?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export const financeService = {
  /**
   * Create a new finance record
   */
  createFinance(data: FinanceRecord): Promise<FinanceRecord> {
    return httpClient.post("/finance", data);
  },

  /**
   * Get finance statistics
   */
  getStats(): Promise<FinanceStats> {
    return httpClient.get("/finance/stats");
  },

  /**
   * Get refunds list
   */
  async getRefunds(page = 0, size = 20): Promise<RefundRecord[]> {
    const response = await httpClient.get<PaginatedResponse<RefundRecord>>(
      `/finance/refunds?page=${page}&size=${size}`,
    );
    return response?.content || [];
  },

  /**
   * Update refund status
   */
  updateRefundStatus(refundId: string, status: string): Promise<any> {
    return httpClient.patch(`/finance/refunds/${refundId}/status`, { status });
  },
};
