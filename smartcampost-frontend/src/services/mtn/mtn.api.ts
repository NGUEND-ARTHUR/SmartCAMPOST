import apiClient from "@/lib/api";

export async function getMtnToken(): Promise<any> {
  return apiClient.post("/payments/mtn/token");
}

export async function initMtnPayment(payload: {
  amount: number;
  msisdn: string;
  externalId?: string;
}) {
  return apiClient.post("/payments/mtn/init", payload);
}

export default { getMtnToken, initMtnPayment };
