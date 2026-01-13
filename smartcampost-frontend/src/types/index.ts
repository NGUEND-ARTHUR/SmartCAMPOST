export interface User {
  id: string;
  email: string;
  name: string;
  role:
    | "CLIENT"
    | "AGENT"
    | "COURIER"
    | "STAFF"
    | "ADMIN"
    | "FINANCE"
    | "RISK"
    | "admin"
    | "user";
}

export interface LoginRequest {
  email: string;
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
  status?: string;
  [key: string]: any;
}

export interface ScanEvent {
  id: string;
  timestamp: string;
  eventType: string;
  location?: string;
  locationNote?: string;
  parcelId?: string;
  agencyId?: string;
  agentId?: string;
}

export interface Payment {
  id: string;
  parcelId?: string;
  amount: number;
  currency?: string;
  method?: string;
  status?: string;
  reversed?: boolean;
  externalRef?: string;
  createdAt?: string;
}

export type PaymentStatus = Payment["status"];

export interface PickupRequest {
  id: string;
  parcelId?: string;
  address?: Address | string;
  items?: any[];
  requestedDate?: string;
  timeWindow?: string;
  courierId?: string;
  comment?: string;
  createdAt?: string;
  state?: string;
}

export type PickupState = string;

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
