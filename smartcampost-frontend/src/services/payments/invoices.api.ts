/**
 * Invoice API Service
 */
import { httpClient } from "../apiClient";
import { axiosInstance } from "@/lib/axiosClient";

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

  async downloadPdf(invoiceId: string): Promise<void> {
    const res = await axiosInstance.get(`/invoices/${invoiceId}/pdf`, {
      responseType: "blob",
    });
    const blob = new Blob([res.data], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `invoice-${invoiceId}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  },
};
