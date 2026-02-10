/**
 * Centralized export for all React Query hooks
 */

// Module exports
export * from "./parcels";
export * from "./pickups";
export * from "./deliveries";
export * from "./dashboard";
export * from "./users";
export * from "./payments";
export * from "./support";
export * from "./notifications";
export * from "./compliance";
export * from "./ai";

// Utility hooks
export { default as useGeolocation } from "./useGeolocation";
export { default as useGpsLocation } from "./useGpsLocation";
export { default as useOfflineSync } from "./useOfflineSync";
export { default as useQrVerification } from "./useQrVerification";
export { default as useScanSSE } from "./useScanSSE";
