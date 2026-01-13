/**
 * Finance API Service
 */
import { httpClient, PaginatedResponse } from "../apiClient";
import { RefundResponse } from "./refunds.api";

// ---- Service ----
export const financeService = {
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
