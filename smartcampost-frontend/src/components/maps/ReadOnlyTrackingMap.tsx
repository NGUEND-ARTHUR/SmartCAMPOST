import { MapView } from "./MapView";

interface Props {
  trackingRef?: string;
}

export function ReadOnlyTrackingMap({ trackingRef }: Props) {
  return (
    <div className="space-y-1">
      <MapView height="260px" />
      <p className="text-[11px] text-slate-500">
        Read-only tracking map
        {trackingRef ? ` for ${trackingRef}` : ""} — plug parcel route and
        scan events once geolocation endpoints are available.
      </p>
    </div>
  );
}


