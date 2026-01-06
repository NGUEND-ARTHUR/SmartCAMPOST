import { MapView } from "./MapView";

export function AgencyMarkersMap() {
  return (
    <div className="space-y-1">
      <MapView height="260px" />
      <p className="text-[11px] text-slate-500">
        Agency markers placeholder — show agencies from /api/agencies once
        wired.
      </p>
    </div>
  );
}


