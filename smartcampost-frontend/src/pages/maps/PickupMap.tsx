import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import LeafletMap from "@/components/maps/LeafletMap";
import { useCourierPickups, usePickups } from "@/hooks";
import { useAuthStore } from "@/store/authStore";
import { Loader2, Truck } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";

export default function PickupMap() {
  const { t } = useTranslation();
  const authUser = useAuthStore((s) => s.user);
  const isCourier = String(authUser?.role || "").toUpperCase() === "COURIER";

  const courierPickups = useCourierPickups(0, 100);
  const allPickups = usePickups(0, 100);
  const { data, isLoading, error } = isCourier ? courierPickups : allPickups;

  const markers = useMemo(
    () =>
      (data?.content || [])
        .filter(
          (p) =>
            typeof p.pickupLatitude === "number" &&
            typeof p.pickupLongitude === "number",
        )
        .map((p) => ({
          id: p.id,
          position: [p.pickupLatitude as number, p.pickupLongitude as number] as [
            number,
            number,
          ],
          label: `${p.clientName || p.trackingRef || p.id.slice(0, 8)} — ${p.state}`,
        })),
    [data],
  );

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">{t("maps.pickup.title")}</h1>
      <p className="mb-4 text-sm text-muted-foreground">
        {t("maps.pickup.subtitle")}
      </p>
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <EmptyState
          icon={Truck}
          title={t("maps.pickup.loadFailed", "Failed to load pickups")}
          description={error instanceof Error ? error.message : undefined}
        />
      ) : markers.length === 0 ? (
        <EmptyState
          icon={Truck}
          title={t("maps.pickup.empty", "No pickups with a location yet")}
        />
      ) : (
        <LeafletMap markers={markers} height="60vh" />
      )}
    </div>
  );
}
