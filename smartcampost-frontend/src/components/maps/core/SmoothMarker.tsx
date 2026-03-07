import React, { useCallback, useEffect, useRef, useState } from "react";
import { Marker } from "react-map-gl/maplibre";

type SmoothMarkerProps = {
  /** [lat, lng] position — converted to MapLibre [lng, lat] internally */
  position: [number, number];
  durationMs?: number;
  enabled?: boolean;
  children?: React.ReactNode;
  anchor?: "center" | "top" | "bottom" | "left" | "right";
};

export function SmoothMarker({
  position,
  durationMs = 900,
  enabled = true,
  children,
  anchor = "center",
}: SmoothMarkerProps) {
  const [animated, setAnimated] = useState<[number, number]>(position);
  const prevRef = useRef<[number, number]>(position);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  useEffect(() => {
    const prev = prevRef.current;
    prevRef.current = position;

    if (!enabled) {
      const id = requestAnimationFrame(() => setAnimated(position));
      return () => cancelAnimationFrame(id);
    }

    const start = performance.now();
    const [fromLat, fromLng] = prev;
    const [toLat, toLng] = position;

    const step = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - t, 3);
      setAnimated([
        fromLat + (toLat - fromLat) * eased,
        fromLng + (toLng - fromLng) * eased,
      ]);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(step);
      }
    };

    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(step);
  }, [durationMs, enabled, position]);

  return (
    <Marker longitude={animated[1]} latitude={animated[0]} anchor={anchor}>
      {children}
    </Marker>
  );
}

/* ------------------------------------------------------------------ */
/* useRouteAnimation — cycle a marker along an array of waypoints     */
/* ------------------------------------------------------------------ */

/** Interpolate between waypoints along cumulative distance for fluid motion. */
function interpolateRoute(
  waypoints: [number, number][],
  progress: number, // 0→1 over total route
): [number, number] {
  if (waypoints.length === 0) return [0, 0];
  if (waypoints.length === 1 || progress <= 0) return waypoints[0];
  if (progress >= 1) return waypoints[waypoints.length - 1];

  // Build cumulative distances
  const dists = [0];
  for (let i = 1; i < waypoints.length; i++) {
    const [aLat, aLng] = waypoints[i - 1];
    const [bLat, bLng] = waypoints[i];
    dists.push(
      dists[i - 1] + Math.sqrt((bLat - aLat) ** 2 + (bLng - aLng) ** 2),
    );
  }

  const total = dists[dists.length - 1];
  const target = progress * total;

  // find segment
  let seg = 0;
  for (let i = 1; i < dists.length; i++) {
    if (dists[i] >= target) {
      seg = i - 1;
      break;
    }
  }

  const segLen = dists[seg + 1] - dists[seg];
  const t = segLen > 0 ? (target - dists[seg]) / segLen : 0;
  // easeInOutCubic for smooth acceleration/deceleration on each segment
  const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

  const [aLat, aLng] = waypoints[seg];
  const [bLat, bLng] = waypoints[seg + 1];

  return [aLat + (bLat - aLat) * eased, aLng + (bLng - aLng) * eased];
}

export type RouteAnimationState = {
  /** Current interpolated [lat, lng] */
  position: [number, number];
  /** 0→1 overall progress */
  progress: number;
  /** Index of the nearest passed waypoint */
  segmentIndex: number;
  /** Whether animation is actively running */
  playing: boolean;
};

/**
 * Hook that animates a position along a list of waypoints.
 *
 * @param waypoints  Array of [lat, lng] points forming the route
 * @param enabled    Whether animation should play
 * @param durationMs Total duration of one full pass (default 8 s)
 * @param loop       Whether to restart after reaching the end (default true)
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useRouteAnimation(
  waypoints: [number, number][],
  enabled: boolean,
  durationMs = 8000,
  loop = true,
): RouteAnimationState {
  const [state, setState] = useState<RouteAnimationState>(() => ({
    position: waypoints[0] ?? [0, 0],
    progress: 0,
    segmentIndex: 0,
    playing: false,
  }));

  const rafRef = useRef<number | null>(null);
  const startRef = useRef(0);
  const pausedAt = useRef(0);

  const cancel = useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  useEffect(() => () => cancel(), [cancel]);

  useEffect(() => {
    if (!enabled || waypoints.length < 2) {
      cancel();
      // Defer state update to avoid synchronous setState in effect body
      const finalPos: [number, number] =
        waypoints.length > 0 ? waypoints[waypoints.length - 1] : [0, 0];
      const id = requestAnimationFrame(() => {
        setState((prev) => ({
          ...prev,
          playing: false,
          position: finalPos,
          progress: 1,
          segmentIndex: Math.max(0, waypoints.length - 1),
        }));
      });
      return () => cancelAnimationFrame(id);
    }

    startRef.current = performance.now() - pausedAt.current * durationMs;

    const tick = (now: number) => {
      const elapsed = now - startRef.current;
      let raw = elapsed / durationMs;

      if (raw >= 1) {
        if (loop) {
          startRef.current = now;
          raw = 0;
        } else {
          raw = 1;
        }
      }

      const progress = Math.min(1, Math.max(0, raw));
      const position = interpolateRoute(waypoints, progress);

      // Compute segment index
      let segmentIndex = 0;
      const frac = progress * (waypoints.length - 1);
      segmentIndex = Math.min(Math.floor(frac), waypoints.length - 2);

      setState({
        position,
        progress,
        segmentIndex,
        playing: progress < 1 || loop,
      });

      if (progress < 1 || loop) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => cancel();
  }, [cancel, durationMs, enabled, loop, waypoints]);

  // Save progress on pause so we can resume
  useEffect(() => {
    if (!enabled) {
      pausedAt.current = state.progress;
    }
  }, [enabled, state.progress]);

  return state;
}

/**
 * A marker that moves along a route using requestAnimationFrame.
 * Built on top of useRouteAnimation.
 */
export function AnimatedRouteMarker({
  waypoints,
  enabled,
  durationMs = 8000,
  loop = true,
  children,
  anchor = "center",
  onProgress,
}: {
  waypoints: [number, number][];
  enabled: boolean;
  durationMs?: number;
  loop?: boolean;
  children?: React.ReactNode;
  anchor?: "center" | "top" | "bottom" | "left" | "right";
  onProgress?: (state: RouteAnimationState) => void;
}) {
  const animState = useRouteAnimation(waypoints, enabled, durationMs, loop);

  // Notify parent of progress
  const onProgressRef = useRef(onProgress);
  useEffect(() => {
    onProgressRef.current = onProgress;
  });
  useEffect(() => {
    onProgressRef.current?.(animState);
  }, [animState]);

  return (
    <Marker
      longitude={animState.position[1]}
      latitude={animState.position[0]}
      anchor={anchor}
    >
      {children}
    </Marker>
  );
}
