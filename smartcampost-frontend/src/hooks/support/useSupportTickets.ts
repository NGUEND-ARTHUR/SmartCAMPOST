/**
 * Support Ticket React Query Hooks
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  supportTicketService,
  CreateTicketRequest,
  TicketReplyRequest,
  UpdateTicketStatusRequest,
} from "@/services";

export const ticketKeys = {
  all: ["tickets"] as const,
  lists: () => [...ticketKeys.all, "list"] as const,
  list: (page: number, size: number) =>
    [...ticketKeys.lists(), { page, size }] as const,
  myList: (page: number, size: number) =>
    [...ticketKeys.all, "my", { page, size }] as const,
  details: () => [...ticketKeys.all, "detail"] as const,
  detail: (id: string) => [...ticketKeys.details(), id] as const,
};

export function useMyTickets(page = 0, size = 20) {
  return useQuery({
    queryKey: ticketKeys.myList(page, size),
    queryFn: () => supportTicketService.listMyTickets(page, size),
  });
}

export function useTickets(page = 0, size = 20) {
  return useQuery({
    queryKey: ticketKeys.list(page, size),
    queryFn: () => supportTicketService.listAll(page, size),
  });
}

export function useTicket(id: string) {
  return useQuery({
    queryKey: ticketKeys.detail(id),
    queryFn: () => supportTicketService.getById(id),
    enabled: !!id,
  });
}

export function useCreateTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTicketRequest) =>
      supportTicketService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ticketKeys.all });
    },
  });
}

export function useReplyToTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      ticketId,
      data,
    }: {
      ticketId: string;
      data: TicketReplyRequest;
    }) => supportTicketService.reply(ticketId, data),
    onSuccess: (_, { ticketId }) => {
      queryClient.invalidateQueries({ queryKey: ticketKeys.detail(ticketId) });
    },
  });
}

export function useUpdateTicketStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      ticketId,
      data,
    }: {
      ticketId: string;
      data: UpdateTicketStatusRequest;
    }) => supportTicketService.updateStatus(ticketId, data),
    onSuccess: (_, { ticketId }) => {
      queryClient.invalidateQueries({ queryKey: ticketKeys.detail(ticketId) });
      queryClient.invalidateQueries({ queryKey: ticketKeys.lists() });
    },
  });
}
