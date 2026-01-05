import { useEffect, useState } from "react";
import { listMyDeliveryTasks } from "../../services/deliveryService";
import type { DeliveryTask } from "../../types/Delivery";
import DeliveryConfirmationForm from "../../components/forms/DeliveryConfirmationForm";

export default function DeliveryList() {
  const [tasks, setTasks] = useState<DeliveryTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listMyDeliveryTasks()
      .then(setTasks)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-slate-50">My Delivery Tasks</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-x-auto">
          <table className="min-w-full text-xs">
            <thead className="bg-slate-900/80 border-b border-slate-800">
              <tr className="text-slate-400 text-[11px] uppercase">
                <th className="px-4 py-2 text-left">Tracking</th>
                <th className="px-4 py-2 text-left">Receiver</th>
                <th className="px-4 py-2 text-left">City</th>
                <th className="px-4 py-2 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td className="px-4 py-3 text-slate-300" colSpan={4}>Loading...</td></tr>
              ) : tasks.length === 0 ? (
                <tr><td className="px-4 py-3 text-slate-300" colSpan={4}>No delivery tasks.</td></tr>
              ) : (
                tasks.map((t) => (
                  <tr key={t.id} className="border-b border-slate-800/70 hover:bg-slate-900/80">
                    <td className="px-4 py-2 font-mono text-[11px] text-slate-100">{t.trackingNumber}</td>
                    <td className="px-4 py-2 text-slate-200">{t.receiverName}</td>
                    <td className="px-4 py-2 text-slate-200">{t.city}</td>
                    <td className="px-4 py-2 text-amber-200">{t.status}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <DeliveryConfirmationForm />
      </div>
    </div>
  );
}
