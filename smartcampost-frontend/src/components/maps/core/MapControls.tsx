import { useCallback, useState } from "react";
import { useMap } from "react-map-gl/maplibre";
import { Button } from "@/components/ui/button";
import { Box, LocateFixed, Minus, Plus, RefreshCw } from "lucide-react";
import {
  CAMEROON_CENTER,
  CAMEROON_DEFAULT_ZOOM,
  isWithinCameroon,
} from "./cameroon";

export function MapControls({
  showReset = true,
  showLocate = true,
  show3DToggle = true,
}: {
  showReset?: boolean;
  showLocate?: boolean;
  show3DToggle?: boolean;
}) {
  const { current: map } = useMap();
  const [isLocating, setIsLocating] = useState(false);

  const flyReset = useCallback(() => {
    map?.flyTo({
      center: [CAMEROON_CENTER[1], CAMEROON_CENTER[0]],
      zoom: CAMEROON_DEFAULT_ZOOM,
      pitch: 0,
      bearing: 0,
      duration: 900,
    });
  }, [map]);

  const locate = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        const within = isWithinCameroon(lat, lng);
        const nextZoom = within
          ? Math.max(map?.getZoom?.() ?? 6, 14)
          : (map?.getZoom?.() ?? 6);
        map?.flyTo({ center: [lng, lat], zoom: nextZoom, duration: 900 });
        setIsLocating(false);
      },
      () => setIsLocating(false),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, [map]);

  const toggle3D = useCallback(() => {
    const pitch = map?.getPitch?.() ?? 0;
    if (pitch > 0) {
      map?.easeTo({ pitch: 0, bearing: 0, duration: 800 });
    } else {
      map?.easeTo({ pitch: 50, bearing: -15, duration: 800 });
    }
  }, [map]);

  const btnClass = "pointer-events-auto";

  return (
    <div className="pointer-events-none absolute right-3 top-3 z-2 flex flex-col gap-2">
      <Button
        type="button"
        size="icon"
        variant="secondary"
        className={btnClass}
        onClick={() => map?.zoomIn({ duration: 300 })}
        aria-label="Zoom in"
      >
        <Plus className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        size="icon"
        variant="secondary"
        className={btnClass}
        onClick={() => map?.zoomOut({ duration: 300 })}
        aria-label="Zoom out"
      >
        <Minus className="h-4 w-4" />
      </Button>

      {show3DToggle && (
        <Button
          type="button"
          size="icon"
          variant="secondary"
          className={btnClass}
          onClick={toggle3D}
          aria-label="Toggle 3D view"
        >
          <Box className="h-4 w-4" />
        </Button>
      )}

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
