/**
 * Parcel chat (courier <-> client) React Query hooks
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { messagesService, ParcelMessage } from "@/services";

export const parcelMessageKeys = {
  all: ["parcel-messages"] as const,
  list: (parcelId: string) => [...parcelMessageKeys.all, parcelId] as const,
  unreadCount: (parcelId: string) =>
    [...parcelMessageKeys.all, parcelId, "unread-count"] as const,
};

export function useParcelMessages(parcelId: string) {
  return useQuery({
    queryKey: parcelMessageKeys.list(parcelId),
    queryFn: () => messagesService.list(parcelId),
    enabled: !!parcelId,
  });
}

export function useSendParcelMessage(parcelId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (content: string) => messagesService.send(parcelId, content),
    onSuccess: (message: ParcelMessage) => {
      queryClient.setQueryData<ParcelMessage[]>(
        parcelMessageKeys.list(parcelId),
        (old) => {
          if (!old) return [message];
          if (old.some((m) => m.id === message.id)) return old;
          return [...old, message];
        },
      );
    },
  });
}

export function useMarkParcelMessagesRead(parcelId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => messagesService.markRead(parcelId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: parcelMessageKeys.unreadCount(parcelId),
      });
    },
  });
}

export function useParcelMessagesUnreadCount(parcelId: string, enabled = true) {
  return useQuery({
    queryKey: parcelMessageKeys.unreadCount(parcelId),
    queryFn: () => messagesService.unreadCount(parcelId),
    enabled: !!parcelId && enabled,
    refetchInterval: 30000,
  });
}
