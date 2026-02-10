/**
 * Audit API Service
 * Provides full accountability: who, when, where, what.
 */
import { httpClient } from "../apiClient";
import type { AuditRecord } from "../../types";

export interface ParcelAuditResponse {
  parcelId: string;
  trackingRef: string;
  currentStatus: string;
  createdAt: string;
  auditTrail: AuditRecord[];
  totalEvents: number;
}

export const auditService = {
  /**
   * Get complete audit trail for a parcel.
   * Admin/Staff/Risk only.
   */
  getParcelAuditTrail(parcelId: string): Promise<ParcelAuditResponse> {
    return httpClient.get(`/audit/parcel/${parcelId}`);
  },

  /**
   * Get audit records for a specific actor.
   * Admin/Risk only.
   */
  getAuditByActor(actorId: string): Promise<AuditRecord[]> {
    return httpClient.get(`/audit/actor/${actorId}`);
  },

  /**
   * Get audit records for a specific agency.
   * Admin/Risk only.
   */
  getAuditByAgency(agencyId: string): Promise<AuditRecord[]> {
    return httpClient.get(`/audit/agency/${agencyId}`);
  },
};
