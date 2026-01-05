export default function ClientDashboard() {
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold text-slate-50">Client Dashboard</h2>
      <p className="text-sm text-slate-400">
        From here, clients can track parcels, request pickups, see history, payments and notifications.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card title="Parcels in progress" value="2" />
        <Card title="Delivered" value="14" />
        <Card title="Pickup requests" value="1" />
      </div>
    </div>
  );
}

function Card({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <p className="text-xs text-slate-400">{title}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-50">{value}</p>
    </div>
  );
}
