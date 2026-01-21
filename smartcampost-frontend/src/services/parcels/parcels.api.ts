/**
 * Parcel API Service
 */
import { httpClient, PaginatedResponse } from "../apiClient";

// ---- Types ----
export interface ParcelResponse {
  id: string;
  trackingRef: string;
  status: string;
  serviceType: string;
  deliveryOption: string;
  weight: number;
  clientId: string;
  senderAddressId: string;
  recipientAddressId: string;
  paymentOption?: string;
  photoUrl?: string;
  descriptionComment?: string;
  createdAt: string;
  expectedDeliveryAt?: string;
}

export interface ParcelDetailResponse {
  id: string;
  trackingRef: string;
  status: string;
  serviceType: string;
  deliveryOption: string;
  paymentOption?: string;
  descriptionComment?: string;
  weight: number;
  dimensions?: string;
  declaredValue?: number;
  fragile?: boolean;
  createdAt: string;
  expectedDeliveryAt?: string;
  // Client
  clientId: string;
  clientName?: string;
  // Sender Address
  senderAddressId: string;
  senderLabel?: string;
  senderCity?: string;
  senderRegion?: string;
  senderCountry?: string;
  // Recipient Address
  recipientAddressId: string;
  recipientLabel?: string;
  recipientCity?: string;
  recipientRegion?: string;
  recipientCountry?: string;
  // Agencies
  originAgencyId?: string;
  originAgencyName?: string;
  destinationAgencyId?: string;
  destinationAgencyName?: string;
  // Pricing
  lastAppliedPrice?: number;
  pricingHistory?: PricingDetailDto[];
}

export interface PricingDetailDto {
  id: string;
  amount: number;
  currency: string;
  createdAt: string;
}

export interface AddressDto {
  id: string;
  fullName: string;
  phone: string;
  addressLine: string;
  city: string;
  region?: string;
  country: string;
}

export interface ScanEventDto {
  id: string;
  eventType: string;
  agencyId?: string;
  agentId?: string;
  locationNote?: string;
  createdAt: string;
}

export interface CreateParcelRequest {
  senderAddressId?: string;
  senderAddress?: Partial<AddressDto>;
  recipientAddressId?: string;
  recipientAddress?: Partial<AddressDto>;
  weight: number;
  isFragile?: boolean;
  serviceType: string;
  deliveryOption: string;
  paymentOption: string;
  description?: string;
}

export interface UpdateParcelStatusRequest {
  status: string;
}

export interface ChangeDeliveryOptionRequest {
  deliveryOption: string;
}

export interface UpdateParcelMetadataRequest {
  photoUrl?: string;
  description?: string;
}

/**
 * Request for validating and accepting a parcel.
 * Used by agents/couriers to validate parcel details during acceptance.
 */
export interface AcceptParcelRequest {
  /** Validated weight (if different from declared) */
  validatedWeight?: number;
  /** Validated dimensions */
  validatedDimensions?: string;
  /** Photo URL of the parcel */
  photoUrl?: string;
  /** Validation notes from the agent */
  validationComment?: string;
  /** Agent confirms the description is accurate - REQUIRED to be true */
  descriptionConfirmed: boolean;
  /** If true and weight differs, recalculate price */
  recalculatePriceOnWeightChange?: boolean;
}

// ---- Service ----
export const parcelService = {
  create(data: CreateParcelRequest): Promise<ParcelResponse> {
    return httpClient.post("/parcels", data);
  },

  listMyParcels(
    page = 0,
    size = 20,
  ): Promise<PaginatedResponse<ParcelResponse>> {
    return httpClient.get(`/parcels/me?page=${page}&size=${size}`);
  },

  listAll(page = 0, size = 20): Promise<PaginatedResponse<ParcelResponse>> {
    return httpClient.get(`/parcels?page=${page}&size=${size}`);
  },

  getById(id: string): Promise<ParcelDetailResponse> {
    return httpClient.get(`/parcels/${id}`);
  },

  getByTracking(trackingRef: string): Promise<ParcelDetailResponse> {
    return httpClient.get(`/parcels/tracking/${trackingRef}`);
  },

  updateStatus(
    id: string,
    data: UpdateParcelStatusRequest,
  ): Promise<ParcelResponse> {
    return httpClient.patch(`/parcels/${id}/status`, data);
  },

  /** Simple accept (no validation details) */
  accept(id: string): Promise<ParcelResponse> {
    return httpClient.patch(`/parcels/${id}/accept`);
  },

  /**
   * Accept with full validation - Agent/Courier validates parcel details.
   * This endpoint allows the agent to:
   * - Confirm the parcel description is accurate
   * - Validate/correct the weight
   * - Add a photo of the parcel
   * - Add validation comments
   */
  validateAndAccept(
    id: string,
    data: AcceptParcelRequest,
  ): Promise<ParcelResponse> {
    return httpClient.patch(`/parcels/${id}/validate`, data);
  },

  changeDeliveryOption(
    id: string,
    data: ChangeDeliveryOptionRequest,
  ): Promise<ParcelResponse> {
    return httpClient.patch(`/parcels/${id}/delivery-option`, data);
  },

  updateMetadata(
    id: string,
    data: UpdateParcelMetadataRequest,
  ): Promise<ParcelResponse> {
    return httpClient.patch(`/parcels/${id}/metadata`, data);
  },
};
