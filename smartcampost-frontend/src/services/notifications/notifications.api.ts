/**
 * Notification API Service
 */
import { httpClient, PaginatedResponse } from "../apiClient";

// ---- Types ----
export interface NotificationResponse {
  id: string;
  recipientId: string;
  channel: string;
  subject?: string;
  message: string;
  status: string;
  parcelId?: string;
  pickupId?: string;
  createdAt: string;
  sentAt?: string;
  readAt?: string;
  read: boolean;
}

export interface TriggerNotificationRequest {
  recipientId: string;
  channel: string;
  subject?: string;
  message: string;
  parcelId?: string;
  pickupId?: string;
}

// ---- Service ----
export const notificationService = {
  trigger(data: TriggerNotificationRequest): Promise<NotificationResponse> {
    return httpClient.post("/notifications/trigger", data);
  },

  getById(id: string): Promise<NotificationResponse> {
    return httpClient.get(`/notifications/${id}`);
  },

  listAll(
    page = 0,
    size = 20,
  ): Promise<PaginatedResponse<NotificationResponse>> {
    return httpClient.get(`/notifications?page=${page}&size=${size}`);
  },

  retry(id: string): Promise<NotificationResponse> {
    return httpClient.post(`/notifications/${id}/retry`);
  },

  listForParcel(parcelId: string): Promise<NotificationResponse[]> {
    return httpClient.get(`/notifications/parcel/${parcelId}`);
  },

  listForPickup(pickupId: string): Promise<NotificationResponse[]> {
    return httpClient.get(`/notifications/pickup/${pickupId}`);
  },

  listMy(
    page = 0,
    size = 20,
  ): Promise<PaginatedResponse<NotificationResponse>> {
    return httpClient.get(`/notifications/me?page=${page}&size=${size}`);
  },

  markAsRead(id: string): Promise<NotificationResponse> {
    return httpClient.put(`/notifications/${id}/read`);
  },

  markAllAsRead(): Promise<void> {
    return httpClient.put("/notifications/read-all");
  },

  getUnreadCount(): Promise<number> {
    return httpClient.get("/notifications/me/unread-count");
  },
};
