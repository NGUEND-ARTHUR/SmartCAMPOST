import type { ParcelStatus } from "../../types/Parcel";

export default function ParcelStatusBadge({ status }: { status: ParcelStatus }) {
  const base = "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold border";

  const styleByStatus: Record<ParcelStatus, string> = {
    CREATED: "bg-slate-900 text-slate-200 border-slate-700",
    ACCEPTED: "bg-blue-950 text-blue-200 border-blue-800",
    IN_TRANSIT: "bg-indigo-950 text-indigo-200 border-indigo-800",
    ARRIVED_HUB: "bg-purple-950 text-purple-200 border-purple-800",
    OUT_FOR_DELIVERY: "bg-amber-950 text-amber-200 border-amber-800",
    DELIVERED: "bg-emerald-950 text-emerald-200 border-emerald-800",
    RETURNED: "bg-orange-950 text-orange-200 border-orange-800",
    CANCELLED: "bg-red-950 text-red-200 border-red-800",
  };

  return <span className={`${base} ${styleByStatus[status]}`}>{status}</span>;
}
