import api from "./api";
import type { ScanEventCreateRequest, ScanEventResponse } from "../types/Scan";

export async function recordScanEvent(payload: ScanEventCreateRequest) {
  const { data } = await api.post<ScanEventResponse>("/scan-events", payload);
  return data;
}

export async function getParcelScanHistory(parcelId: string) {
  const { data } = await api.get<ScanEventResponse[]>(
    `/scan-events/parcel/${parcelId}`
  );
  return data;
}
