import { useEffect, useState } from "react";

export default function useGeolocation(autoWatch = false) {
  const [position, setPosition] = useState<GeolocationPosition | null>(null);
  const [error, setError] = useState<string | null>(null);
  const watchIdRef = React.useRef<number | null>(null);

  useEffect(() => {
    if (autoWatch && "geolocation" in navigator) {
      const id = navigator.geolocation.watchPosition(
        (pos) => setPosition(pos),
        (err) => setError(err.message),
        { enableHighAccuracy: true, maximumAge: 5000 },
      );
      // store id in ref for cleanup
      watchIdRef.current = id as unknown as number;
      return () => {
        if (watchIdRef.current != null)
          navigator.geolocation.clearWatch(watchIdRef.current);
      };
    }
  }, [autoWatch]);

  const getCurrent = () =>
    new Promise<GeolocationPosition>((resolve, reject) => {
      if (!("geolocation" in navigator))
        return reject(new Error("Geolocation not available"));
      navigator.geolocation.getCurrentPosition(
        resolve,
        (e) => {
          setError(e.message);
          reject(e);
        },
        { enableHighAccuracy: true },
      );
    });

  return { position, error, getCurrent };
}
