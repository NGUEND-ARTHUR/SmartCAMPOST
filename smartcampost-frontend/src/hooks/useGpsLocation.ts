import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import i18n from "@/i18n";
import type { LocationData } from "../types";

interface UseGpsLocationOptions {
  autoWatch?: boolean;
  highAccuracy?: boolean;
  maximumAge?: number;
  timeout?: number;
}

interface UseGpsLocationResult {
  location: LocationData | null;
  error: string | null;
  isLoading: boolean;
  isSupported: boolean;
  getCurrentPosition: () => Promise<LocationData>;
  clearLocation: () => void;
}

function toLocationData(position: GeolocationPosition): LocationData {
  return {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    accuracy: position.coords.accuracy,
    timestamp: new Date(position.timestamp).toISOString(),
    source: "DEVICE_GPS",
  };
}

function geolocationErrorMessage(err: GeolocationPositionError): string {
  switch (err.code) {
    case err.PERMISSION_DENIED:
      return i18n.t("errors.gpsPermissionDenied");
    case err.POSITION_UNAVAILABLE:
      return i18n.t("errors.gpsPositionUnavailable");
    case err.TIMEOUT:
      return i18n.t("errors.gpsTimeout");
    default:
      return i18n.t("errors.gpsError", { message: err.message });
  }
}

export function useGpsLocation(
  options: UseGpsLocationOptions = {},
): UseGpsLocationResult {
  const {
    autoWatch = false,
    highAccuracy = true,
    maximumAge = 10_000,
    timeout = 30_000,
  } = options;

  const [location, setLocation] = useState<LocationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const watchIdRef = useRef<number | null>(null);

  const isSupported =
    typeof navigator !== "undefined" && "geolocation" in navigator;

  const positionOptions: PositionOptions = useMemo(
    () => ({
      enableHighAccuracy: highAccuracy,
      maximumAge,
      timeout,
    }),
    [highAccuracy, maximumAge, timeout],
  );

  const handleSuccess = useCallback((position: GeolocationPosition) => {
    setLocation(toLocationData(position));
    setError(null);
    setIsLoading(false);
  }, []);

  const handleError = useCallback((err: GeolocationPositionError) => {
    setError(geolocationErrorMessage(err));
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!isSupported || !autoWatch) return;

    watchIdRef.current = navigator.geolocation.watchPosition(
      handleSuccess,
      handleError,
      positionOptions,
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [autoWatch, isSupported, handleSuccess, handleError, positionOptions]);

  const getCurrentPosition = useCallback(async (): Promise<LocationData> => {
    if (!isSupported) {
      throw new Error(i18n.t("errors.gpsUnavailable"));
    }

    setIsLoading(true);
    setError(null);

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const next = toLocationData(position);
          setLocation(next);
          setError(null);
          setIsLoading(false);
          resolve(next);
        },
        (err) => {
          const message = geolocationErrorMessage(err);
          setError(message);
          setIsLoading(false);
          reject(new Error(message));
        },
        positionOptions,
      );
    });
  }, [isSupported, positionOptions]);

  const clearLocation = useCallback(() => {
    setLocation(null);
    setError(null);
  }, []);

  return {
    location,
    error,
    isLoading,
    isSupported,
    getCurrentPosition,
    clearLocation,
  };
}

export default useGpsLocation;
