export type DeliveryStatus = "PENDING" | "OUT_FOR_DELIVERY" | "DELIVERED" | "FAILED";

export interface DeliveryTask {
  id: string;
  parcelId: string;
  trackingNumber: string;
  receiverName: string;
  addressText: string;
  city: string;
  status: DeliveryStatus;
  eta?: string;
}
