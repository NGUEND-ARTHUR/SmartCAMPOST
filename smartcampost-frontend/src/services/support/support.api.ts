/**
 * Support Ticket API Service
 */
import { httpClient, PaginatedResponse } from "../apiClient";

// ---- Types ----
export interface TicketResponse {
  id: string;
  clientId: string;
  clientName?: string;
  subject: string;
  message: string;
  category?: string;
  status: string;
  createdAt: string;
  updatedAt?: string;
}

export interface TicketReplyDto {
  id: string;
  ticketId: string;
  authorId: string;
  message: string;
  createdAt: string;
}

export interface CreateTicketRequest {
  subject: string;
  message: string;
  category?: string;
}

export interface TicketReplyRequest {
  message: string;
}

export interface UpdateTicketStatusRequest {
  status: string;
}

// ---- Service ----
export const supportTicketService = {
  create(data: CreateTicketRequest): Promise<TicketResponse> {
    return httpClient.post("/support/tickets", data);
  },

  getById(id: string): Promise<TicketResponse> {
    return httpClient.get(`/support/tickets/${id}`);
  },

  listMyTickets(
    page = 0,
    size = 20,
  ): Promise<PaginatedResponse<TicketResponse>> {
    return httpClient.get(`/support/tickets/me?page=${page}&size=${size}`);
  },

  listAll(page = 0, size = 20): Promise<PaginatedResponse<TicketResponse>> {
    return httpClient.get(`/support/tickets?page=${page}&size=${size}`);
  },

  reply(ticketId: string, data: TicketReplyRequest): Promise<TicketResponse> {
    return httpClient.post(`/support/tickets/${ticketId}/reply`, data);
  },

  updateStatus(
    ticketId: string,
    data: UpdateTicketStatusRequest,
  ): Promise<TicketResponse> {
    return httpClient.patch(`/support/tickets/${ticketId}/status`, data);
  },
};
