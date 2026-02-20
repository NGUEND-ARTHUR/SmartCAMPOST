import { useEffect, useRef } from "react";
import { Marker, MarkerProps } from "react-leaflet";
import L from "leaflet";

type LatLngTuple = [number, number];

type SmoothMarkerProps = Omit<MarkerProps, "position"> & {
  position: LatLngTuple;
  durationMs?: number;
  enabled?: boolean;
};

export function SmoothMarker({
  position,
  durationMs = 900,
  enabled = true,
  ...props
}: SmoothMarkerProps) {
  const markerRef = useRef<L.Marker | null>(null);
  const previousRef = useRef<LatLngTuple | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const marker = markerRef.current;
    if (!marker) {
      previousRef.current = position;
      return;
    }

    const prev = previousRef.current;
    previousRef.current = position;

    if (!enabled || !prev) {
      marker.setLatLng(position);
      return;
    }

    const start = performance.now();
    const [fromLat, fromLng] = prev;
    const [toLat, toLng] = position;

    const step = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - t, 3);
      const lat = fromLat + (toLat - fromLat) * eased;
      const lng = fromLng + (toLng - fromLng) * eased;
      marker.setLatLng([lat, lng]);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(step);
      }
    };

    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(step);
  }, [durationMs, enabled, position]);

  return (
    <Marker
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore react-leaflet ref typing mismatch
      ref={markerRef}
      position={position}
      {...props}
    />
  );
}
