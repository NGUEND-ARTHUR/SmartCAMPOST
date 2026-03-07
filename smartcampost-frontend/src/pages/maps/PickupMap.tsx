import React from "react";
import { useTranslation } from "react-i18next";
import LeafletMap from "@/components/maps/LeafletMap";

export default function PickupMap() {
  const { t } = useTranslation();
  const markers: Array<{
    id: string;
    position: [number, number];
    label?: string;
  }> = [
    { id: "pickup-1", position: [3.8465, 11.5045], label: "Pickup A" },
    { id: "pickup-2", position: [3.852, 11.508], label: "Pickup B" },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">{t("maps.pickup.title")}</h1>
      <p className="mb-4 text-sm text-muted-foreground">
        {t("maps.pickup.subtitle")}
      </p>
      <LeafletMap
        markers={markers}
        height="60vh"
        showCircle={{ center: [3.8465, 11.5045], radius: 400 }}
      />
    </div>
  );
}
