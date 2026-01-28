import React, { useEffect, useState, useCallback } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Popup,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import useScanSSE from "../../hooks/useScanSSE";

export default function ParcelMapView({
  trackingNumber,
}: {
  trackingNumber: string;
}) {
  const [data, setData] = useState<any>(null);

  const fetchData = React.useCallback(async () => {
    try {
      const res = await fetch(
        `/api/track/parcel/${encodeURIComponent(trackingNumber)}`,
      );
      if (res.ok) setData(await res.json());
    } catch (e) {
      console.warn(e);
    }
  }, [trackingNumber]);

  useEffect(() => {
    let mounted = true;
    const timer = setTimeout(() => {
      if (!mounted) return;
      fetchData();
    }, 0);
    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, [fetchData]);

  const handleScanEvent = useCallback(
    (evt: any) => {
      try {
        if (!evt || evt.parcelId == null) return;
        if (String(evt.parcelId) !== String(data?.parcelId)) return;
        // append to timeline and update current location
        setData((prev: any) => {
          const timeline = [evt, ...(prev?.timeline || [])];
          const currentLocation = evt.latitude
            ? { lat: evt.latitude, lng: evt.longitude, source: evt.source }
            : prev.currentLocation;
          return { ...prev, timeline, currentLocation };
        });
      } catch (e) {
        console.warn(e);
      }
    },
    [data],
  );

  useScanSSE(handleScanEvent);

  if (!data) return <div>Loading map…</div>;

  const center: [number, number] = data.currentLocation?.lat
    ? [Number(data.currentLocation.lat), Number(data.currentLocation.lng)]
    : [3.848, 11.5021];
  const poly: Array<[number, number]> = (data.timeline || [])
    .map((t: any) => [Number(t.latitude), Number(t.longitude)])
    .filter((p: any) => Array.isArray(p) && p.length === 2) as Array<
    [number, number]
  >;

  return (
    <div className="map-viewport">
      <MapContainer center={center} zoom={13} className="map-container">
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {data.currentLocation?.lat && (
          <Marker
            position={[data.currentLocation.lat, data.currentLocation.lng]}
          >
            <Popup>Current location</Popup>
          </Marker>
        )}
        {poly.length > 0 && <Polyline positions={poly} color="blue" />}
      </MapContainer>
    </div>
  );
}
