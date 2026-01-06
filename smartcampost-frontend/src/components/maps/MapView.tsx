interface Props {
  height?: string;
}

/**
 * Generic map container placeholder.
 * Replace inner content with an actual map provider (e.g. Google Maps / Leaflet).
 */
export function MapView({ height = "300px" }: Props) {
  return (
    <div
      className="w-full rounded-xl border border-slate-800 bg-slate-900/60 flex items-center justify-center text-xs text-slate-400"
      style={{ height }}
    >
      Map placeholder — connect to maps provider
    </div>
  );
}


