export default function AgentDashboard() {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-slate-50">
        Agent Dashboard
      </h2>
      <p className="text-xs text-slate-400">
        This view will show today&apos;s parcels, scans and pickups for the
        connected agency. Wire it to /api/parcels and /api/pickups when ready.
      </p>
    </div>
  );
}


