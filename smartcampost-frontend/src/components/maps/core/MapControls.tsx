import { useCallback, useMemo, useState } from "react";
import { useMap } from "react-leaflet";
import { Button } from "@/components/ui/button";
import { LocateFixed, Minus, Plus, RefreshCw } from "lucide-react";
import L from "leaflet";
import {
  CAMEROON_CENTER,
  CAMEROON_DEFAULT_ZOOM,
  CAMEROON_BOUNDS,
  CAMEROON_MAX_ZOOM,
  CAMEROON_MIN_ZOOM,
} from "./cameroon";

export function MapControls({
  showReset = true,
  showLocate = true,
}: {
  showReset?: boolean;
  showLocate?: boolean;
}) {
  const map = useMap();
  const [isLocating, setIsLocating] = useState(false);

  const zoom = map.getZoom();
  const zoomInDisabled = zoom >= CAMEROON_MAX_ZOOM;
  const zoomOutDisabled = zoom <= CAMEROON_MIN_ZOOM;

  const flyReset = useCallback(() => {
    map.flyTo(CAMEROON_CENTER, CAMEROON_DEFAULT_ZOOM, { duration: 0.9 });
  }, [map]);

  const locate = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const within = CAMEROON_BOUNDS.contains(L.latLng(lat, lng));
        const nextZoom = within ? Math.max(map.getZoom(), 14) : map.getZoom();
        map.flyTo([lat, lng], nextZoom, { duration: 0.9 });
        setIsLocating(false);
      },
      () => {
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, [map]);

  const containerClass = useMemo(
    () =>
      "pointer-events-none absolute right-3 top-3 z-[500] flex flex-col gap-2",
    [],
  );

  const btnClass = "pointer-events-auto";

  return (
    <div className={containerClass}>
      <Button
        type="button"
        size="icon"
        variant="secondary"
        className={btnClass}
        onClick={() => map.zoomIn(undefined, { animate: true })}
        disabled={zoomInDisabled}
        aria-label="Zoom in"
      >
        <Plus className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        size="icon"
        variant="secondary"
        className={btnClass}
        onClick={() => map.zoomOut(undefined, { animate: true })}
        disabled={zoomOutDisabled}
        aria-label="Zoom out"
      >
        <Minus className="h-4 w-4" />
      </Button>

      {showLocate && (
        <Button
          type="button"
          size="icon"
          variant="secondary"
          className={btnClass}
          onClick={locate}
          disabled={isLocating}
          aria-label="Locate"
        >
          <LocateFixed className="h-4 w-4" />
        </Button>
      )}

      {showReset && (
        <Button
          type="button"
          size="icon"
          variant="secondary"
          className={btnClass}
          onClick={flyReset}
          aria-label="Reset view"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
