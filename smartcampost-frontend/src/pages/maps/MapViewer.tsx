import React from "react";
import LeafletMap from "@/components/maps/LeafletMap";

export default function MapViewer() {
  // Example markers for demo; can be replaced with real data
  const markers: Array<{
    id: string;
    position: [number, number];
    label?: string;
  }> = [
    { id: "pickup-1", position: [3.848, 11.5021], label: "Main Hub" },
    { id: "pickup-2", position: [3.86, 11.51], label: "Agency B" },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Map Viewer</h1>
      <p className="text-sm text-muted-foreground mb-4">
        OpenStreetMap powered map. Use it for pickup, tracking, and location.
      </p>
      <LeafletMap markers={markers} height="600px" showSearch />
    </div>
  );
}
