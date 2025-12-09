export default function Dashboard() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">
        Dashboard Overview
      </h1>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl bg-white p-4 shadow-sm border border-slate-100">
          <p className="text-xs text-slate-500">Parcels in transit</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">124</p>
        </div>

        <div className="rounded-xl bg-white p-4 shadow-sm border border-slate-100">
          <p className="text-xs text-slate-500">Delivered today</p>
          <p className="mt-2 text-2xl font-semibold text-emerald-600">86</p>
        </div>

        <div className="rounded-xl bg-white p-4 shadow-sm border border-slate-100">
          <p className="text-xs text-slate-500">Delayed / issues</p>
          <p className="mt-2 text-2xl font-semibold text-amber-500">7</p>
        </div>
      </div>

      <div className="rounded-xl bg-white p-4 shadow-sm border border-slate-100">
        <p className="text-sm font-semibold text-slate-800 mb-2">
          Live Activity (mock data)
        </p>
        <p className="text-xs text-slate-500">
          Here we’ll later plug real charts, maps, and tracking from the
          backend.
        </p>
      </div>
    </div>
  );
}
