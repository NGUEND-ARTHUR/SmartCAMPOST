/**
 * Finance API Service
 */
import { httpClient, PaginatedResponse } from "../apiClient";
import { RefundResponse } from "./refunds.api";

export interface FinanceStats {
  totalRevenue: number;
  pendingPayments: number;
  completedPayments: number;
  refundsPending: number;
  revenueGrowth: number;
}

// ---- Service ----
export const financeService = {
  getStats(): Promise<FinanceStats> {
    return httpClient.get("/finance/stats");
  },

  listRefunds(page = 0, size = 20): Promise<PaginatedResponse<RefundResponse>> {
    return httpClient.get(`/finance/refunds?page=${page}&size=${size}`);
  },

  updateRefundStatus(
    refundId: string,
    status: string,
  ): Promise<RefundResponse> {
    return httpClient.patch(`/finance/refunds/${refundId}/status`, { status });
  },
};
