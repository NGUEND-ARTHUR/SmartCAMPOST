import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  acceptParcel,
  changeDeliveryOption,
  getParcelById,
  updateParcelMetadata,
  updateParcelStatus,
} from "../../services/parcelService";
import type { DeliveryOption, ParcelStatus } from "../../types/Parcel";
import ParcelStatusBadge from "../../components/parcel/ParcelStatusBadge";
import axios from "axios";

// ✅ Phase 4 imports
import { getParcelScanHistory } from "../../services/scanEventService";
import ParcelTimeline from "../../components/parcel/ParcelTimeline";
import QRGenerator from "../../components/qr/QRGenerator";

const STATUSES: ParcelStatus[] = [
  "CREATED",
  "ACCEPTED",
  "IN_TRANSIT",
  "ARRIVED_HUB",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "RETURNED",
  "CANCELLED",
];

const DELIVERY_OPTIONS: DeliveryOption[] = ["AGENCY", "HOME"];

export default function ParcelDetails() {
  const { parcelId } = useParams<{ parcelId: string }>();
  const { user } = useAuth();
  const qc = useQueryClient();

  const canManage = useMemo(() => {
    const r = user?.role;
    return r === "ADMIN" || r === "STAFF" || r === "AGENT";
  }, [user?.role]);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["parcel", parcelId],
    queryFn: () => getParcelById(String(parcelId)),
    enabled: !!parcelId,
  });

  // ✅ Phase 4: timeline query
  const {
    data: timelineData,
    isLoading: isTimelineLoading,
    isError: isTimelineError,
  } = useQuery({
    queryKey: ["parcelTimeline", parcelId],
    queryFn: () => getParcelScanHistory(String(parcelId)),
    enabled: !!parcelId,
    staleTime: 5_000,
  });

  const [status, setStatus] = useState<ParcelStatus>("CREATED");
  const [deliveryOption, setDeliveryOption] = useState<DeliveryOption>("AGENCY");
  const [comment, setComment] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  // ✅ sync local state when parcel loads (useEffect instead of useMemo)
  useEffect(() => {
    if (data) {
      setStatus(data.status);
      if (data.deliveryOption) setDeliveryOption(data.deliveryOption);
      setComment((data as unknown as { comment?: string })?.comment ?? "");
      setPhotoUrl((data as unknown as { photoUrl?: string })?.photoUrl ?? "");
    }
  }, [data]);

  const refresh = async () => {
    await qc.invalidateQueries({ queryKey: ["parcel", parcelId] });
    await qc.invalidateQueries({ queryKey: ["parcels"] });
    await qc.invalidateQueries({ queryKey: ["myParcels"] });

    // ✅ Phase 4: refresh timeline too
    await qc.invalidateQueries({ queryKey: ["parcelTimeline", parcelId] });
  };

  const acceptMut = useMutation({
    mutationFn: () => acceptParcel(String(parcelId)),
    onSuccess: async () => {
      setMsg("Parcel accepted.");
      setErrMsg(null);
      await refresh();
    },
    onError: (e: unknown) => handleError(e),
  });

  const statusMut = useMutation({
    mutationFn: () => updateParcelStatus(String(parcelId), { status }),
    onSuccess: async () => {
      setMsg("Status updated.");
      setErrMsg(null);
      await refresh();
    },
    onError: (e: unknown) => handleError(e),
  });

  const deliveryMut = useMutation({
    mutationFn: () => changeDeliveryOption(String(parcelId), { deliveryOption }),
    onSuccess: async () => {
      setMsg("Delivery option updated.");
      setErrMsg(null);
      await refresh();
    },
    onError: (e: unknown) => handleError(e),
  });

  const metadataMut = useMutation({
    mutationFn: () =>
      updateParcelMetadata(String(parcelId), { comment, photoUrl }),
    onSuccess: async () => {
      setMsg("Metadata updated.");
      setErrMsg(null);
      await refresh();
    },
    onError: (e: unknown) => handleError(e),
  });

  function handleError(e: unknown) {
    let m = "Request failed.";
    if (axios.isAxiosError(e)) {
      const data = e.response?.data;
      if (typeof data === "string") m = data;
      else if (data && typeof data === "object") {
        m =
          (data as { message?: string; error?: string }).message ||
          (data as { message?: string; error?: string }).error ||
          m;
      } else if (e.message) m = e.message;
    } else if (e instanceof Error) {
      m = e.message;
    }
    setErrMsg(m);
    setMsg(null);
  }

  if (isLoading) return <div className="p-4 text-slate-300">Loading parcel…</div>;

  if (isError) {
    return (
      <div className="p-4 text-red-400">
        {(error as Error).message || "Failed to load parcel"}
      </div>
    );
  }

  if (!data) return <div className="p-4 text-slate-300">Parcel not found.</div>;

  return (
    <div className="p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-100">Parcel Details</h2>
          <p className="text-xs text-slate-400 mt-1">Tracking: {data.trackingRef}</p>
        </div>
        <ParcelStatusBadge status={data.status} />
      </div>

      {/* ✅ Phase 4: QR + Timeline added (no structure broken) */}
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <QRGenerator value={data.trackingRef} title="Tracking QR" />
        </div>

        <div className="lg:col-span-2">
          {isTimelineError ? (
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
              <p className="text-sm text-red-400">Failed to load timeline.</p>
            </div>
          ) : (
            <ParcelTimeline
              items={timelineData ?? []}
              loading={isTimelineLoading}
            />
          )}
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
          <h3 className="text-sm font-semibold text-slate-200">Receiver</h3>
          <p className="text-sm text-slate-300 mt-2">{data.receiverName ?? "-"}</p>
          <p className="text-xs text-slate-400">{data.receiverPhone ?? "-"}</p>
          <p className="text-xs text-slate-500 mt-2">
            Destination: {(data as unknown as { destinationCity?: string })?.destinationCity ?? "-"}
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
          <h3 className="text-sm font-semibold text-slate-200">Delivery</h3>
          <p className="text-xs text-slate-400 mt-2">
            Option: <span className="text-slate-200">{data.deliveryOption ?? "-"}</span>
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Comment: {(data as unknown as { comment?: string })?.comment ?? "-"}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            PhotoURL: {(data as unknown as { photoUrl?: string })?.photoUrl ?? "-"}
          </p>
        </div>
      </div>

      {(msg || errMsg) && (
        <div className="mt-4">
          {msg && (
            <div className="text-xs text-emerald-200 bg-emerald-950/40 border border-emerald-900 rounded-md px-3 py-2">
              {msg}
            </div>
          )}
          {errMsg && (
            <div className="text-xs text-red-200 bg-red-950/40 border border-red-900 rounded-md px-3 py-2">
              {errMsg}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      {canManage && (
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
            <h3 className="text-sm font-semibold text-slate-200">Accept Parcel</h3>
            <p className="text-xs text-slate-400 mt-1">CREATED → ACCEPTED</p>
            <button
              disabled={acceptMut.isPending}
              onClick={() => acceptMut.mutate()}
              className="mt-3 rounded-lg bg-amber-500 px-3 py-2 text-xs font-semibold text-slate-950 hover:bg-amber-400 disabled:opacity-60"
            >
              {acceptMut.isPending ? "Accepting…" : "Accept"}
            </button>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
            <h3 className="text-sm font-semibold text-slate-200">Update Status</h3>
            <select
              className="mt-3 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100"
              value={status}
              onChange={(e) => setStatus(e.target.value as ParcelStatus)}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            <button
              disabled={statusMut.isPending}
              onClick={() => statusMut.mutate()}
              className="mt-3 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-100 hover:bg-slate-800 disabled:opacity-60"
            >
              {statusMut.isPending ? "Saving…" : "Save status"}
            </button>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
            <h3 className="text-sm font-semibold text-slate-200">Delivery Option</h3>
            <select
              className="mt-3 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100"
              value={deliveryOption}
              onChange={(e) => setDeliveryOption(e.target.value as DeliveryOption)}
            >
              {DELIVERY_OPTIONS.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>

            <button
              disabled={deliveryMut.isPending}
              onClick={() => deliveryMut.mutate()}
              className="mt-3 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-100 hover:bg-slate-800 disabled:opacity-60"
            >
              {deliveryMut.isPending ? "Saving…" : "Save option"}
            </button>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 lg:col-span-3">
            <h3 className="text-sm font-semibold text-slate-200">Metadata</h3>

            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <div>
                <label className="block text-xs text-slate-400">Comment</label>
                <input
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400">Photo URL</label>
                <input
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100"
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                />
              </div>
            </div>

            <button
              disabled={metadataMut.isPending}
              onClick={() => metadataMut.mutate()}
              className="mt-3 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-100 hover:bg-slate-800 disabled:opacity-60"
            >
              {metadataMut.isPending ? "Saving…" : "Save metadata"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
