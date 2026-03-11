export interface User {
  id: string;
  phone: string;
  email?: string;
  name: string;
  role:
    | "CLIENT"
    | "AGENT"
    | "COURIER"
    | "STAFF"
    | "ADMIN"
    | "FINANCE"
    | "RISK";
}

export interface LoginRequest {
  phone: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface RegisterRequest {
  fullName: string;
  phone: string;
  email?: string;
  preferredLanguage?: string;
  password: string;
  otp?: string;
}

// Minimal placeholder types used by newly added pages
export interface Address {
  id: string;
  label?: string;
  line1?: string;
  street?: string;
  city?: string;
  region?: string;
  postcode?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
}

export type ParcelStatus = "created" | "in_transit" | "delivered" | "returned";

export interface Parcel {
  id: string;
  trackingNumber?: string;
  trackingRef?: string;
  status?: string;
  locked?: boolean;
  qrStatus?: QrStatus;
  finalQrCode?: string;
  partialQrCode?: string;
  weight?: number;
  dimensions?: string;
  declaredValue?: number;
  fragile?: boolean;
  serviceType?: string;
  deliveryOption?: string;
  paymentOption?: string;
  descriptionComment?: string;
  expectedDeliveryAt?: string;
  createdAt?: string;
  senderAddressId?: string;
  senderLabel?: string;
  senderCity?: string;
  senderRegion?: string;
  senderCountry?: string;
  recipientAddressId?: string;
  recipientLabel?: string;
  recipientCity?: string;
  recipientRegion?: string;
  recipientCountry?: string;
  clientName?: string;
  clientId?: string;
  originAgencyId?: string;
  originAgencyName?: string;
  destinationAgencyId?: string;
  destinationAgencyName?: string;
  photoUrl?: string;
  creationLatitude?: number;
  creationLongitude?: number;
  currentLatitude?: number;
  currentLongitude?: number;
  locationUpdatedAt?: string;
  locationMode?: string;
  validatedWeight?: number;
  validatedDimensions?: string;
  validationComment?: string;
  descriptionConfirmed?: boolean;
  validatedAt?: string;
  validatedByStaffId?: string;
  validatedByStaffName?: string;
  lastAppliedPrice?: number;
  [key: string]: unknown;
}

export interface ScanEvent {
  id: string;
  timestamp: string;
  eventType: string;
  parcelId?: string;
  agencyId?: string;
  agencyName?: string;
  agentId?: string;
  agentName?: string;
  actorId?: string;
  actorRole?: string;
  latitude?: number;
  longitude?: number;
  locationNote?: string;
  locationSource?: LocationSource;
  comment?: string;
  proofPhotoUrl?: string;
  synced?: boolean;
}

export interface Payment {
  id: string;
  parcelId?: string;
  parcelTrackingRef?: string;
  amount: number;
  currency?: string;
  method?: string;
  status?: string;
  reversed?: boolean;
  externalRef?: string;
  timestamp?: string;
}

export type PaymentStatus = Payment["status"];

export interface PickupRequest {
  id: string;
  parcelId?: string;
  address?: Address | string;
  items?: unknown[];
  requestedDate?: string;
  timeWindow?: string;
  courierId?: string;
  comment?: string;
  createdAt?: string;
  state?: string;
}

export type PickupState = "REQUESTED" | "ASSIGNED" | "COMPLETED" | "CANCELLED";

export interface SupportTicket {
  id: string;
  subject: string;
  description?: string;
  category?: TicketCategory;
  status?: TicketStatus;
  priority?: TicketPriority;
  clientId?: string;
  parcelId?: string;
  assignedStaffId?: string;
  createdAt?: string;
}

export type TicketStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
export type TicketCategory =
  | "DELIVERY"
  | "PAYMENT"
  | "DAMAGED"
  | "LOST"
  | "OTHER";
export type TicketPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

// --------------------------------------------------
//  QR Code Two-Step Logic
// --------------------------------------------------
export type QrStatus = "PARTIAL" | "FINAL";
export type LocationMode = "GPS_DEFAULT" | "MANUAL_OVERRIDE";
export type LocationSource =
  | "DEVICE_GPS"
  | "MANUAL_ENTRY"
  | "NETWORK"
  | "UNKNOWN";

// --------------------------------------------------
//  Extended Parcel Status (Backend-Aligned)
// --------------------------------------------------
export type ParcelStatusExtended =
  | "CREATED"
  | "ACCEPTED"
  | "TAKEN_IN_CHARGE"
  | "IN_TRANSIT"
  | "ARRIVED_HUB"
  | "ARRIVED_DEST_AGENCY"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "PICKED_UP_AT_AGENCY"
  | "RETURNED_TO_SENDER"
  | "RETURNED"
  | "CANCELLED";

// --------------------------------------------------
//  GPS Location Data
// --------------------------------------------------
export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp?: string;
  source?: LocationSource;
}

// --------------------------------------------------
//  Audit Record
// --------------------------------------------------
export interface AuditRecord {
  recordId: string;
  parcelId: string;
  trackingRef: string;
  actorId?: string;
  actorRole?: string;
  actorName?: string;
  timestamp: string;
  deviceTimestamp?: string;
  latitude?: number;
  longitude?: number;
  locationNote?: string;
  locationSource?: LocationSource;
  action: string;
  eventType: string;
  previousStatus?: string;
  newStatus?: string;
  comment?: string;
  proofUrl?: string;
  agencyId?: string;
  agencyName?: string;
}

// --------------------------------------------------
//  Congestion Alert (Self-Healing)
// --------------------------------------------------
export interface CongestionAlert {
  agencyId: string;
  agencyName: string;
  parcelCount: number;
  threshold: number;
  congestionLevel: number;
  detectedAt: string;
  suggestedActions: string[];
}

// --------------------------------------------------
//  Self-Healing Action
// --------------------------------------------------
export interface SelfHealingAction {
  actionId: string;
  actionType: string;
  description: string;
  sourceAgencyId?: string;
  targetAgencyId?: string;
  affectedParcels?: string[];
  priority: string;
  requiresConfirmation: boolean;
  status: string;
}

// --------------------------------------------------
//  Offline Sync
// --------------------------------------------------
export interface OfflineScanEvent {
  parcelId: string;
  eventType: string;
  latitude: number;
  longitude: number;
  locationSource?: string;
  deviceTimestamp: string;
  locationNote?: string;
  proofUrl?: string;
  comment?: string;
}

export interface OfflineSyncResult {
  batchId: string;
  totalEvents: number;
  successCount: number;
  failureCount: number;
  failures: Array<{
    eventIndex: number;
    parcelId: string;
    eventType: string;
    errorMessage: string;
  }>;
  syncedAt: string;
}
