export type ScanEventType =
  | "ACCEPTED"
  | "ARRIVED_HUB"
  | "IN_TRANSIT"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "RETURNED";

export interface ScanEventCreateRequest {
  parcelId: string; // UUID
  eventType: string; // backend expects string (ScanEventType.name())
  agencyId?: string;
  agentId?: string;
  locationNote?: string;
}

export interface ScanEventResponse {
  id: string;
  parcelId?: string;
  eventType: string;
  createdAt: string;

  agencyId?: string;
  agentId?: string;
  locationNote?: string;
}
