/**
 * Notification React Query Hooks
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notificationService, TriggerNotificationRequest } from "@/services";

export const notificationKeys = {
  all: ["notifications"] as const,
  lists: () => [...notificationKeys.all, "list"] as const,
  list: (page: number, size: number) =>
    [...notificationKeys.lists(), { page, size }] as const,
  details: () => [...notificationKeys.all, "detail"] as const,
  detail: (id: string) => [...notificationKeys.details(), id] as const,
  forParcel: (parcelId: string) =>
    [...notificationKeys.all, "parcel", parcelId] as const,
  forPickup: (pickupId: string) =>
    [...notificationKeys.all, "pickup", pickupId] as const,
};

export function useNotifications(page = 0, size = 20) {
  return useQuery({
    queryKey: notificationKeys.list(page, size),
    queryFn: () => notificationService.listAll(page, size),
  });
}

export function useNotification(id: string) {
  return useQuery({
    queryKey: notificationKeys.detail(id),
    queryFn: () => notificationService.getById(id),
    enabled: !!id,
  });
}

export function useNotificationsForParcel(parcelId: string) {
  return useQuery({
    queryKey: notificationKeys.forParcel(parcelId),
    queryFn: () => notificationService.listForParcel(parcelId),
    enabled: !!parcelId,
  });
}

export function useNotificationsForPickup(pickupId: string) {
  return useQuery({
    queryKey: notificationKeys.forPickup(pickupId),
    queryFn: () => notificationService.listForPickup(pickupId),
    enabled: !!pickupId,
  });
}

export function useTriggerNotification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: TriggerNotificationRequest) =>
      notificationService.trigger(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

export function useRetryNotification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationService.retry(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
    },
  });
}
