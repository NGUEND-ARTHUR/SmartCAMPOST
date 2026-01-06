import { MapView } from "./MapView";

interface Props {
  fromLabel?: string;
  toLabel?: string;
}

export function RoutePreviewMap({ fromLabel, toLabel }: Props) {
  return (
    <div className="space-y-1">
      <MapView height="260px" />
      <p className="text-[11px] text-slate-500">
        Route preview
        {fromLabel && toLabel
          ? `: ${fromLabel} → ${toLabel}`
          : " — plug in distance/duration once maps are integrated."}
      </p>
    </div>
  );
}


