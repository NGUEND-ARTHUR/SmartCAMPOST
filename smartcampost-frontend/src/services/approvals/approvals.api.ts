import { httpClient } from "../apiClient";

export interface ApprovalRequestDto {
  id: string;
  toolName: string;
  actorId?: string;
  actorRole?: string;
  parametersJson?: string;
  reason?: string;
  approved?: boolean;
  processed?: boolean;
  createdAt?: string;
}

export const approvalsApi = {
  pending(): Promise<ApprovalRequestDto[]> {
    return httpClient.get("/approvals/pending");
  },
  approve(id: string) {
    return httpClient.post(`/approvals/${id}/approve`);
  },
  deny(id: string) {
    return httpClient.post(`/approvals/${id}/deny`);
  },
};
