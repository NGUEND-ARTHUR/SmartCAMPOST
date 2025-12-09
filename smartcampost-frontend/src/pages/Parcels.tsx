const mockParcels = [
  { id: "SCM-0001", status: "IN_TRANSIT", origin: "Yaoundé", destination: "Douala" },
  { id: "SCM-0002", status: "DELIVERED", origin: "Bafoussam", destination: "Yaoundé" },
  { id: "SCM-0003", status: "OUT_FOR_DELIVERY", origin: "Garoua", destination: "Maroua" },
];

export default function Parcels() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Parcels</h1>

      <div className="rounded-xl bg-white p-4 shadow-sm border border-slate-100 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-slate-500 border-b">
              <th className="py-2 pr-4">Parcel ID</th>
              <th className="py-2 pr-4">Status</th>
              <th className="py-2 pr-4">Origin</th>
              <th className="py-2 pr-4">Destination</th>
            </tr>
          </thead>
          <tbody>
            {mockParcels.map((p) => (
              <tr key={p.id} className="border-b last:border-0">
                <td className="py-2 pr-4 font-mono text-xs text-slate-800">
                  {p.id}
                </td>
                <td className="py-2 pr-4">
                  <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-700">
                    {p.status}
                  </span>
                </td>
                <td className="py-2 pr-4 text-slate-700">{p.origin}</td>
                <td className="py-2 pr-4 text-slate-700">{p.destination}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
