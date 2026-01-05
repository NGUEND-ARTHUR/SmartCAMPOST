export type PickupStatus = "REQUESTED" | "ASSIGNED" | "COLLECTED" | "CANCELLED";

export interface PickupRequest {
  id: string;
  senderName: string;
  phone: string;
  addressText: string;
  city: string;
  preferredDate?: string;
  preferredTimeSlot?: string;
  status: PickupStatus;
  latitude?: number;
  longitude?: number;
  createdAt: string;
}
