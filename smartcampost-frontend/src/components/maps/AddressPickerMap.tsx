import type { Dispatch, SetStateAction } from "react";
import { MapView } from "./MapView";

interface LatLng {
  lat: number;
  lng: number;
}

interface Props {
  value?: LatLng | null;
  onChange?: Dispatch<SetStateAction<LatLng | null>>;
}

/**
 * Simple wrapper around MapView intended for address picking.
 * Currently renders only a placeholder; wire actual click/drag logic later.
 */
export function AddressPickerMap({ value }: Props) {
  return (
    <div className="space-y-1">
      <MapView height="260px" />
      {value && (
        <p className="text-[11px] text-slate-500">
          Selected: {value.lat.toFixed(5)}, {value.lng.toFixed(5)}
        </p>
      )}
    </div>
  );
}


