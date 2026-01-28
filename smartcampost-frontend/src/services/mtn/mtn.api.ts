import apiClient from "@/lib/api";

export async function getMtnToken(): Promise<any> {
  // Preferred: backend should handle token exchange. Try backend endpoint first.
  try {
    return apiClient.post("/payments/mtn/token");
  } catch (err) {
    // Fallback: return a stub indicating missing backend
    return { ok: false, message: "Backend token endpoint unavailable" };
  }
}

export async function initMtnPayment(payload: {
  amount: number;
  msisdn: string;
  externalId?: string;
}) {
  // Calls backend to initiate a payment request.
  try {
    return apiClient.post("/payments/mtn/init", payload);
  } catch (err) {
    return { ok: false, message: "Backend init endpoint unavailable" };
  }
}

export default { getMtnToken, initMtnPayment };
