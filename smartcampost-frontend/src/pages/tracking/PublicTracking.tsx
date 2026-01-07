import { FormEvent, useState } from "react";
import { getParcelByTracking } from "../../services/parcelService";
import type { ParcelDetailResponse } from "../../types/Parcel";
import ParcelStatusBadge from "../../components/parcel/ParcelStatusBadge";

export default function PublicTracking() {
  const [tracking, setTracking] = useState("");
  const [parcel, setParcel] = useState<ParcelDetailResponse | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setMsg(null);
    setParcel(null);
    setLoading(true);
    try {
      const p = await getParcelByTracking(tracking.trim());
      setParcel(p);
    } catch {
      setMsg("Parcel not found. Check tracking number.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-4">
      <h2 className="text-lg font-semibold text-slate-50">Track your parcel</h2>

      <form onSubmit={submit} className="flex gap-2">
        <input
          value={tracking}
          onChange={(e) => setTracking(e.target.value)}
          placeholder="CAM-2025-000123"
          className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-50 outline-none"
        />
        <button
          disabled={!tracking.trim() || loading}
          className="px-4 rounded-lg bg-amber-500 text-slate-950 text-sm font-semibold hover:bg-amber-400 disabled:opacity-60"
        >
          {loading ? "..." : "Track"}
        </button>
      </form>

      {msg && (
        <p className="text-xs text-red-300 bg-red-950/40 border border-red-900 rounded-md px-2 py-1">
          {msg}
        </p>
      )}

      {parcel && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <p className="font-mono text-sm">{parcel.trackingRef}</p>
            <ParcelStatusBadge status={parcel.status} />
          </div>
        </div>
      )}
    </div>
  );
}
