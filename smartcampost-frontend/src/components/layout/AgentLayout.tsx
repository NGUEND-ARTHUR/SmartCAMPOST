import { api } from "./api";
import type { PageResponse } from "../types/Common";
import type {
  ParcelResponse,
  ParcelDetailResponse,
  CreateParcelRequest,
  UpdateParcelStatusRequest,
  ChangeDeliveryOptionRequest,
  UpdateParcelMetadataRequest,
} from "../types/Parcel";

export async function createParcel(payload: CreateParcelRequest) {
  const { data } = await api.post<ParcelResponse>("/api/parcels", payload);
  return data;
}

export async function listMyParcels(page = 0, size = 20) {
  const { data } = await api.get<PageResponse<ParcelResponse>>("/api/parcels/me", {
    params: { page, size },
  });
  return data;
}

export async function listParcels(page = 0, size = 20) {
  const { data } = await api.get<PageResponse<ParcelResponse>>("/api/parcels", {
    params: { page, size },
  });
  return data;
}

export async function getParcelById(parcelId: string) {
  const { data } = await api.get<ParcelDetailResponse>(`/api/parcels/${parcelId}`);
  return data;
}

export async function getParcelByTracking(trackingRef: string) {
  const { data } = await api.get<ParcelDetailResponse>(`/api/parcels/tracking/${trackingRef}`);
  return data;
}

export async function updateParcelStatus(parcelId: string, payload: UpdateParcelStatusRequest) {
  const { data } = await api.patch<ParcelResponse>(`/api/parcels/${parcelId}/status`, payload);
  return data;
}

export async function acceptParcel(parcelId: string) {
  const { data } = await api.patch<ParcelResponse>(`/api/parcels/${parcelId}/accept`);
  return data;
}

export async function changeDeliveryOption(parcelId: string, payload: ChangeDeliveryOptionRequest) {
  const { data } = await api.patch<ParcelResponse>(`/api/parcels/${parcelId}/delivery-option`, payload);
  return data;
}

export async function updateParcelMetadata(parcelId: string, payload: UpdateParcelMetadataRequest) {
  const { data } = await api.patch<ParcelResponse>(`/api/parcels/${parcelId}/metadata`, payload);
  return data;
}import { api } from "./api";
import type { PageResponse } from "../types/Common";
import type {
  ParcelResponse,
  ParcelDetailResponse,
  CreateParcelRequest,
  UpdateParcelStatusRequest,
  ChangeDeliveryOptionRequest,
  UpdateParcelMetadataRequest,
} from "../types/Parcel";

export async function createParcel(payload: CreateParcelRequest) {
  const { data } = await api.post<ParcelResponse>("/api/parcels", payload);
  return data;
}

export async function listMyParcels(page = 0, size = 20) {
  const { data } = await api.get<PageResponse<ParcelResponse>>("/api/parcels/me", {
    params: { page, size },
  });
  return data;
}

export async function listParcels(page = 0, size = 20) {
  const { data } = await api.get<PageResponse<ParcelResponse>>("/api/parcels", {
    params: { page, size },
  });
  return data;
}

export async function getParcelById(parcelId: string) {
  const { data } = await api.get<ParcelDetailResponse>(`/api/parcels/${parcelId}`);
  return data;
}

export async function getParcelByTracking(trackingRef: string) {
  const { data } = await api.get<ParcelDetailResponse>(`/api/parcels/tracking/${trackingRef}`);
  return data;
}

export async function updateParcelStatus(parcelId: string, payload: UpdateParcelStatusRequest) {
  const { data } = await api.patch<ParcelResponse>(`/api/parcels/${parcelId}/status`, payload);
  return data;
}

export async function acceptParcel(parcelId: string) {
  const { data } = await api.patch<ParcelResponse>(`/api/parcels/${parcelId}/accept`);
  return data;
}

export async function changeDeliveryOption(parcelId: string, payload: ChangeDeliveryOptionRequest) {
  const { data } = await api.patch<ParcelResponse>(`/api/parcels/${parcelId}/delivery-option`, payload);
  return data;
}

export async function updateParcelMetadata(parcelId: string, payload: UpdateParcelMetadataRequest) {
  const { data } = await api.patch<ParcelResponse>(`/api/parcels/${parcelId}/metadata`, payload);
  return data;
}import { api } from "./api";
import type { PageResponse } from "../types/Common";
import type {
  ParcelResponse,
  ParcelDetailResponse,
  CreateParcelRequest,
  UpdateParcelStatusRequest,
  ChangeDeliveryOptionRequest,
  UpdateParcelMetadataRequest,
} from "../types/Parcel";

export async function createParcel(payload: CreateParcelRequest) {
  const { data } = await api.post<ParcelResponse>("/api/parcels", payload);
  return data;
}

export async function listMyParcels(page = 0, size = 20) {
  const { data } = await api.get<PageResponse<ParcelResponse>>("/api/parcels/me", {
    params: { page, size },
  });
  return data;
}

export async function listParcels(page = 0, size = 20) {
  const { data } = await api.get<PageResponse<ParcelResponse>>("/api/parcels", {
    params: { page, size },
  });
  return data;
}

export async function getParcelById(parcelId: string) {
  const { data } = await api.get<ParcelDetailResponse>(`/api/parcels/${parcelId}`);
  return data;
}

export async function getParcelByTracking(trackingRef: string) {
  const { data } = await api.get<ParcelDetailResponse>(`/api/parcels/tracking/${trackingRef}`);
  return data;
}

export async function updateParcelStatus(parcelId: string, payload: UpdateParcelStatusRequest) {
  const { data } = await api.patch<ParcelResponse>(`/api/parcels/${parcelId}/status`, payload);
  return data;
}

export async function acceptParcel(parcelId: string) {
  const { data } = await api.patch<ParcelResponse>(`/api/parcels/${parcelId}/accept`);
  return data;
}

export async function changeDeliveryOption(parcelId: string, payload: ChangeDeliveryOptionRequest) {
  const { data } = await api.patch<ParcelResponse>(`/api/parcels/${parcelId}/delivery-option`, payload);
  return data;
}

export async function updateParcelMetadata(parcelId: string, payload: UpdateParcelMetadataRequest) {
  const { data } = await api.patch<ParcelResponse>(`/api/parcels/${parcelId}/metadata`, payload);
  return data;
}import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { agentMenu } from "../app/config/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "./common/useApiClient";
import * as complianceService from "../services/complianceService";
import * as refundService from "../services/refundService";
import * as userService from "../services/userService";
import type { ResolveRiskAlertRequest } from "../types/Compliance";
import type { CreateRefundRequest, UpdateRefundStatusRequest } from "../types/Refund";

export default function AgentLayout() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-100">
      <aside className="w-60 bg-slate-900 border-r border-slate-800 flex flex-col">
        <div className="h-16 flex items-center px-4 border-b border-slate-800">
          <span className="font-bold text-sm">
            Smart<span className="text-amber-400">CAMPOST</span> Agent
          </span>
        </div>
        <nav className="flex-1 py-4 space-y-1 text-sm">
          {agentMenu.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `block px-4 py-2 rounded-r-full ${
                  isActive
                    ? "bg-amber-500 text-slate-900 font-semibold"
                    : "text-slate-300 hover:bg-slate-800"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-slate-800 p-4 text-[11px] text-slate-400">
          <p className="font-semibold text-slate-200">
            {user?.fullName ?? "Agent"}
          </p>
          <p>{user?.role ?? "AGENT"}</p>
        </div>
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="h-16 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-950/70 backdrop-blur">
          <h1 className="text-sm font-semibold text-slate-100">
            Agent Workspace
          </h1>
        </header>
        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export function useListAlerts(page = 0, size = 20) {
  return useQuery({
    queryKey: ["alerts", page, size],
    queryFn: () => complianceService.listAlerts(page, size),
  });
}

export function useGetAlert(alertId: string) {
  return useQuery({
    queryKey: ["alert", alertId],
    queryFn: () => complianceService.getAlertById(alertId),
    enabled: !!alertId,
  });
}

export function useResolveAlert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ alertId, payload }: { alertId: string; payload: ResolveRiskAlertRequest }) =>
      complianceService.resolveAlert(alertId, payload),
    onSuccess: (_, { alertId }) => {
      qc.invalidateQueries({ queryKey: ["alert", alertId] });
      qc.invalidateQueries({ queryKey: ["alerts"] });
    },
  });
}

export function useGetComplianceReports(from: string, to: string) {
  return useQuery({
    queryKey: ["compliance", "reports", from, to],
    queryFn: () => complianceService.getComplianceReports(from, to),
    enabled: !!from && !!to,
  });
}

export function useFreezeAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => complianceService.freezeAccount(userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useUnfreezeAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => complianceService.unfreezeAccount(userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useListAllRefunds(page = 0, size = 20) {
  return useQuery({
    queryKey: ["refunds", page, size],
    queryFn: () => refundService.listAllRefunds(page, size),
  });
}

export function useGetRefund(refundId: string) {
  return useQuery({
    queryKey: ["refund", refundId],
    queryFn: () => refundService.getRefundById(refundId),
    enabled: !!refundId,
  });
}

export function useGetRefundsForPayment(paymentId: string) {
  return useQuery({
    queryKey: ["refunds", "payment", paymentId],
    queryFn: () => refundService.getRefundsForPayment(paymentId),
    enabled: !!paymentId,
  });
}

export function useCreateRefund() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateRefundRequest) => refundService.createRefund(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["refunds"] });
    },
  });
}

export function useUpdateRefundStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ refundId, payload }: { refundId: string; payload: UpdateRefundStatusRequest }) =>
      refundService.updateRefundStatus(refundId, payload),
    onSuccess: (_, { refundId }) => {
      qc.invalidateQueries({ queryKey: ["refund", refundId] });
      qc.invalidateQueries({ queryKey: ["refunds"] });
    },
  });
}

export function useListUsers(page = 0, size = 20, role?: string) {
  return useQuery({
    queryKey: ["users", page, size, role],
    queryFn: () => userService.listUsers(page, size, role),
  });
}

export function useFreezeUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, frozen }: { userId: string; frozen: boolean }) =>
      userService.freezeUser(userId, frozen),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
    },
  });
}


