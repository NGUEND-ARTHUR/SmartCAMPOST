import L from "leaflet";

// Approx Cameroon bounding box
// SW: (lat 1.65, lng 8.4)  NE: (lat 13.1, lng 16.3)
export const CAMEROON_BOUNDS = L.latLngBounds(
  L.latLng(1.65, 8.4),
  L.latLng(13.1, 16.3),
);

export const CAMEROON_CENTER: [number, number] = [7.3697, 12.3547];
export const CAMEROON_DEFAULT_ZOOM = 6;
export const CAMEROON_MIN_ZOOM = 6;
export const CAMEROON_MAX_ZOOM = 19;
