import React from "react";
import LeafletMap from "@/components/maps/LeafletMap";

export default function TrackingMap() {
  // Example tracking polyline could be added; for now show origin + current
  const markers: Array<{
    id: string;
    position: [number, number];
    label?: string;
  }> = [
    { id: "origin", position: [3.84, 11.495], label: "Origin" },
    { id: "current", position: [3.856, 11.506], label: "Current" },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Parcel Tracking Map</h1>
      <p className="mb-4 text-sm text-muted-foreground">
        Track parcels in real-time.
      </p>
      <LeafletMap markers={markers} height="60vh" />
    </div>
  );
}
