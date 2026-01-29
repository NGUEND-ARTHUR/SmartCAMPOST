import React, { useEffect, useState, useCallback } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Popup,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import useGeolocation from "../../hooks/useGeolocation";
import useScanSSE from "../../hooks/useScanSSE";

export default function CourierMapView() {
  const { position, getCurrent } = useGeolocation();
  const [locs, setLocs] = useState<any[]>([]);

  const fetchMy = React.useCallback(async () => {
    try {
      const res = await fetch(`/api/location/me`);
      if (res.ok) setLocs(await res.json());
    } catch (e) {
      console.warn(e);
    }
  }, []);

  useEffect(() => {
    // call asynchronously to avoid triggering sync setState inside effect
    let mounted = true;
    const timer = setTimeout(() => {
      if (!mounted) return;
      fetchMy();
    }, 0);
    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, [fetchMy]);

  useEffect(() => {
    // auto-post location every 10s if available
    let t = setInterval(async () => {
      try {
        const pos = await getCurrent();
        const payload = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          source: "GPS",
        };
        await fetch("/api/location/update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        fetchMy();
      } catch (e) {
        console.warn(e);
      }
    }, 10000);
    return () => clearInterval(t);
  }, [getCurrent, fetchMy]);

  const handleScan = useCallback(
    (evt: any) => {
      // If this courier has a parcel scanned, refresh list or add marker
      if (!evt) return;
      // simplistic: refresh remote list
      fetchMy();
    },
    [fetchMy],
  );

  useScanSSE(handleScan);

  const center: [number, number] = locs[0]
    ? [Number(locs[0].latitude), Number(locs[0].longitude)]
    : [3.848, 11.5021];
  const poly: Array<[number, number]> = locs
    .map((l) => [Number(l.latitude), Number(l.longitude)])
    .filter((p) => Array.isArray(p) && p.length === 2) as Array<
    [number, number]
  >;

  return (
    <div className="map-viewport">
      <MapContainer center={center} zoom={13} className="map-container">
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {locs.map((l, i) => (
          <Marker key={i} position={[l.latitude, l.longitude]}>
            <Popup>{l.timestamp}</Popup>
          </Marker>
        ))}
        {poly.length > 0 && <Polyline positions={poly} color="green" />}
      </MapContainer>
    </div>
  );
}
