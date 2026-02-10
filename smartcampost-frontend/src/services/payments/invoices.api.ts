/**
 * Invoice API Service
 */
import { httpClient } from "../apiClient";

export interface InvoiceResponse {
  id: string;
  paymentId?: string;
  parcelId?: string;
  parcelTrackingRef?: string;
  invoiceNumber: string;
  totalAmount: number;
  issuedAt: string;
  pdfLink?: string;
}

export const invoiceService = {
  listMine(): Promise<InvoiceResponse[]> {
    return httpClient.get("/invoices/me");
  },

  listByParcel(parcelId: string): Promise<InvoiceResponse[]> {
    return httpClient.get(`/invoices/by-parcel/${parcelId}`);
  },

  getById(invoiceId: string): Promise<InvoiceResponse> {
    return httpClient.get(`/invoices/${invoiceId}`);
  },

  pdfUrl(invoiceId: string): string {
    // direct browser download should hit backend path
    return `/api/invoices/${invoiceId}/pdf`;
  },
};
