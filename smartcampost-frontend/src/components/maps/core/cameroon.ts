/**
 * Cameroon geographic constants for MapLibre GL JS.
 *
 * CAMEROON_BOUNDS is [[westLng, southLat], [eastLng, northLat]] — the format
 * expected by MapLibre's maxBounds option.
 *
 * CAMEROON_CENTER stays as [lat, lng] for backward-compat with every component
 * that already passes center={[lat, lng]}.
 */

/** [[west, south], [east, north]] in [lng, lat] order for MapLibre */
export const CAMEROON_BOUNDS: [[number, number], [number, number]] = [
  [8.4, 1.65],
  [16.3, 13.1],
];

/** Centre of Cameroon as [latitude, longitude] (legacy order used by components) */
export const CAMEROON_CENTER: [number, number] = [7.3697, 12.3547];

export const CAMEROON_DEFAULT_ZOOM = 6;
export const CAMEROON_MIN_ZOOM = 6;
export const CAMEROON_MAX_ZOOM = 19;

/** Fast point-in-rectangle check replacing L.latLngBounds.contains() */
export function isWithinCameroon(lat: number, lng: number): boolean {
  return lat >= 1.65 && lat <= 13.1 && lng >= 8.4 && lng <= 16.3;
}
