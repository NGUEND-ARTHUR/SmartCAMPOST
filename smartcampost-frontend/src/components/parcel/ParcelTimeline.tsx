import type { ScanEventResponse } from "../../types/Scan";

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export default function ParcelTimeline({
  items,
  loading,
}: {
  items: ScanEventResponse[];
  loading?: boolean;
}) {
  if (loading) {
    return <p className="text-sm text-slate-300">Loading timeline…</p>;
  }

  if (!items || items.length === 0) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
        <p className="text-sm text-slate-400">No scan events yet.</p>
      </div>
    );
  }

  const sorted = [...items].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950">
      <div className="border-b border-slate-800 px-4 py-3">
        <h3 className="text-sm font-semibold text-slate-100">Timeline</h3>
        <p className="text-xs text-slate-400">
          Latest scans appear first.
        </p>
      </div>

      <ul className="divide-y divide-slate-900">
        {sorted.map((e) => (
          <li key={e.id} className="px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-100">
                  {e.eventType}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  {formatDate(e.createdAt)}
                </p>
                {e.locationNote && (
                  <p className="mt-1 text-xs text-slate-300">
                    {e.locationNote}
                  </p>
                )}
              </div>

              <div className="text-right">
                {e.agencyId && (
                  <p className="text-[11px] text-slate-400">Agency: {e.agencyId}</p>
                )}
                {e.agentId && (
                  <p className="text-[11px] text-slate-400">Agent: {e.agentId}</p>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
