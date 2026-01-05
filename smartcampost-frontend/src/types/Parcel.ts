export type ParcelStatus =
  | "CREATED"
  | "ACCEPTED"
  | "IN_TRANSIT"
  | "ARRIVED_HUB"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "RETURNED"
  | "CANCELLED";

export type DeliveryOption = "AGENCY" | "HOME";

export interface ParcelResponse {
  id: string; // UUID string from backend
  trackingRef: string;
  status: ParcelStatus;

  senderName?: string;
  senderPhone?: string;

  receiverName?: string;
  receiverPhone?: string;

  originAgencyId?: string; // UUID string
  destinationAgencyId?: string; // UUID string

  deliveryOption?: DeliveryOption;

  weightKg?: number; // backend can return BigDecimal/Double -> number in TS
  declaredValue?: number; // backend can return BigDecimal -> number in TS

  createdAt?: string; // ISO string
  updatedAt?: string; // ISO string
}

export interface ParcelTimelineItem {
  id: string; // UUID string
  eventType: string; // could be ScanEventType (string)
  createdAt: string; // ISO string

  agencyId?: string; // UUID string
  agentId?: string; // UUID string
  locationNote?: string;
}

export interface ParcelDetailResponse extends ParcelResponse {
  description?: string;
  note?: string;

  pickupId?: string; // UUID string
  deliveryId?: string; // UUID string

  timeline?: ParcelTimelineItem[];
}

// ===== Requests =====
export interface CreateParcelRequest {
  receiverName: string;
  receiverPhone: string;
  destinationAgencyId: string; // UUID string

  senderName?: string;
  senderPhone?: string;

  weightKg?: number;
  declaredValue?: number;
  description?: string;

  deliveryOption?: DeliveryOption; // AGENCY | HOME
}

export interface UpdateParcelStatusRequest {
  status: ParcelStatus;
}

export interface ChangeDeliveryOptionRequest {
  deliveryOption: DeliveryOption; // AGENCY | HOME
}

export interface UpdateParcelMetadataRequest {
  photoUrl?: string;
  comment?: string;
}
