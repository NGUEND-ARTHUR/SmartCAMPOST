import { httpClient } from "../apiClient";

export interface DeliveryReceiptResponse {
  receiptId: string;
  receiptNumber: string;
  parcelId: string;
  trackingRef?: string;
  receiverName?: string;
  deliveryAddress?: string;
  deliveredAt?: string;
  courierName?: string;
  totalAmount?: number;
  paymentCollected?: boolean;
  paymentMethod?: string;
  pdfUrl?: string;
  generatedAt?: string;
}

export const receiptService = {
  getByParcel(parcelId: string): Promise<DeliveryReceiptResponse> {
    return httpClient.get(`/receipts/parcel/${parcelId}`);
  },

  getByNumber(receiptNumber: string): Promise<DeliveryReceiptResponse> {
    return httpClient.get(`/receipts/number/${receiptNumber}`);
  },
};
