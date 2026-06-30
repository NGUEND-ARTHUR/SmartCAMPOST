/**
 * Parcel chat (courier <-> client) API service
 */
import { httpClient } from "../apiClient";

export interface ParcelMessage {
  id: string;
  parcelId: string;
  senderAccountId: string;
  senderRole: string;
  senderName: string;
  content: string;
  createdAt: string;
  mine: boolean;
  read: boolean;
}

export const messagesService = {
  list(parcelId: string): Promise<ParcelMessage[]> {
    return httpClient.get(`/parcels/${parcelId}/messages`);
  },

  send(parcelId: string, content: string): Promise<ParcelMessage> {
    return httpClient.post(`/parcels/${parcelId}/messages`, { content });
  },

  markRead(parcelId: string): Promise<void> {
    return httpClient.post(`/parcels/${parcelId}/messages/read`);
  },

  unreadCount(parcelId: string): Promise<{ count: number }> {
    return httpClient.get(`/parcels/${parcelId}/messages/unread-count`);
  },
};
