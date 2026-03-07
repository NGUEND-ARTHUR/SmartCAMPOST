import React from "react";
import { useTranslation } from "react-i18next";
import LeafletMap from "@/components/maps/LeafletMap";

export default function TrackingMap() {
  const { t } = useTranslation();
  // Example tracking polyline could be added; for now show origin + current
  const markers: Array<{
    id: string;
    position: [number, number];
    label?: string;
  }> = [
    {
      id: "origin",
      position: [3.84, 11.495],
      label: t("maps.tracking.origin"),
    },
    {
      id: "current",
      position: [3.856, 11.506],
      label: t("maps.tracking.current"),
    },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">{t("maps.tracking.title")}</h1>
      <p className="mb-4 text-sm text-muted-foreground">
        {t("maps.tracking.subtitle")}
      </p>
      <LeafletMap markers={markers} height="60vh" />
    </div>
  );
}
