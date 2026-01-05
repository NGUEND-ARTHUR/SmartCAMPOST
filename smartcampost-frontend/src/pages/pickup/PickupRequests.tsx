import { useEffect, useState } from "react";
import { listPickupRequests } from "../../services/pickupService";
import type { PickupRequest } from "../../types/Pickup";

export default function PickupRequests() {
  const [items, setItems] = useState<PickupRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listPickupRequests()
      .then(setItems)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-slate-50">Pickup Requests</h2>

      <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-x-auto">
        <table className="min-w-full text-xs">
          <thead className="bg-slate-900/80 border-b border-slate-800">
            <tr className="text-slate-400 text-[11px] uppercase">
              <th className="px-4 py-2 text-left">Client</th>
              <th className="px-4 py-2 text-left">Phone</th>
              <th className="px-4 py-2 text-left">City</th>
              <th className="px-4 py-2 text-left">Time slot</th>
              <th className="px-4 py-2 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="px-4 py-3 text-slate-300" colSpan={5}>Loading...</td></tr>
            ) : items.length === 0 ? (
              <tr><td className="px-4 py-3 text-slate-300" colSpan={5}>No pickup requests.</td></tr>
            ) : (
              items.map((p) => (
                <tr key={p.id} className="border-b border-slate-800/70 hover:bg-slate-900/80">
                  <td className="px-4 py-2 text-slate-200">{p.senderName}</td>
                  <td className="px-4 py-2 text-slate-300">{p.phone}</td>
                  <td className="px-4 py-2 text-slate-200">{p.city}</td>
                  <td className="px-4 py-2 text-slate-200">{p.preferredTimeSlot ?? "-"}</td>
                  <td className="px-4 py-2 text-amber-200">{p.status}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
