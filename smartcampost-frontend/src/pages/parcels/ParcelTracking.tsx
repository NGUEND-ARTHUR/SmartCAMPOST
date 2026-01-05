import { FormEvent, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { getParcelByTracking } from "../../services/parcelService";
import ParcelStatusBadge from "../../components/parcel/ParcelStatusBadge";
import axios from "axios";

export default function ParcelTracking() {
  const [trackingRef, setTrackingRef] = useState("");
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => getParcelByTracking(trackingRef.trim()),
    onError: (err: unknown) => {
      let message = "Tracking failed.";
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 401) {
          message =
            "Tracking endpoint is protected (401). If you want public tracking, permit /api/parcels/tracking/** in SecurityConfig.";
        } else {
          const data = err.response?.data;
          if (typeof data === "string") message = data;
          else if (data && typeof data === "object") {
            message =
              (data as { message?: string; error?: string }).message ||
              (data as { message?: string; error?: string }).error ||
              message;
          } else if (err.message) message = err.message;
        }
      } else if (err instanceof Error) {
        message = err.message;
      }
      setError(message);
    },
    onSuccess: () => setError(null),
  });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    mutation.mutate();
  };

  const parcel = mutation.data;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-2xl p-6">
        <h1 className="text-xl font-bold">Track Parcel</h1>
        <p className="mt-1 text-xs text-slate-400">
          Enter a tracking reference (example: CAM-2025-000123)
        </p>

        <form onSubmit={onSubmit} className="mt-6 flex gap-2">
          <input
            className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-amber-500/60"
            value={trackingRef}
            onChange={(e) => setTrackingRef(e.target.value)}
            placeholder="Tracking reference"
            required
          />
          <button
            type="submit"
            disabled={mutation.isPending}
            className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-400 disabled:opacity-60"
          >
            {mutation.isPending ? "Searching…" : "Track"}
          </button>
        </form>

        {error && (
          <div className="mt-4 text-xs text-red-200 bg-red-950/40 border border-red-900 rounded-md px-3 py-2">
            {error}
          </div>
        )}

        {parcel && (
          <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950 p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold">{parcel.trackingRef}</p>
                <p className="text-xs text-slate-400 mt-1">
                  Destination: {parcel.destinationCity ?? "-"}
                </p>
              </div>
              <ParcelStatusBadge status={parcel.status} />
            </div>

            <div className="mt-3 text-xs text-slate-300">
              Receiver: {parcel.receiverName ?? "-"} ({parcel.receiverPhone ?? "-"})
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
