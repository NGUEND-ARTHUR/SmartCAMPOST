import { useAuth } from "../../context/AuthContext";

export default function AdminDashboard() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-50">
          Hello, {user?.fullName ?? "Administrator"}
        </h2>
        <p className="text-sm text-slate-400">
          Welcome to the SmartCAMPOST operations dashboard.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="Parcels today" value="128" />
        <StatCard label="In transit" value="342" />
        <StatCard label="Delivered today" value="97" />
        <StatCard label="Delayed (AI alerts)" value="5" variant="warning" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <h3 className="text-sm font-semibold text-slate-100 mb-2">
            Network activity (mock)
          </h3>
          <p className="text-xs text-slate-400">
            Later we will plug real charts here (parcels by day, delay rates,
            hub performance, AI predictions, etc.).
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <h3 className="text-sm font-semibold text-slate-100 mb-2">
            Recent events (mock)
          </h3>
          <ul className="text-xs text-slate-300 space-y-1">
            <li>CAM-2025-000123 &mdash; DELIVERED in Douala Bonanjo</li>
            <li>CAM-2025-000124 &mdash; OUT_FOR_DELIVERY in Yaoundé Centre</li>
            <li>CAM-2025-000125 &mdash; ARRIVED_DEST_AGENCY in Bafoussam</li>
            <li>CAM-2025-000126 &mdash; IN_TRANSIT to Garoua</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  variant?: "default" | "warning";
}

function StatCard({ label, value, variant = "default" }: StatCardProps) {
  const isWarning = variant === "warning";
  return (
    <div
      className={`rounded-xl border p-4 ${
        isWarning
          ? "border-amber-500/60 bg-amber-950/40"
          : "border-slate-800 bg-slate-900/60"
      }`}
    >
      <p
        className={`text-xs ${
          isWarning ? "text-amber-300" : "text-slate-400"
        }`}
      >
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-slate-50">{value}</p>
    </div>
  );
}
