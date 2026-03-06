import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Package, Loader2, Map, List } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/EmptyState";
import { CourierNavigationMap } from "@/components/maps";
import { useMyParcels } from "@/hooks";
import { useStartDelivery } from "@/hooks";
import { toast } from "sonner";
import { deliveryService } from "@/services";

const statusColors: Record<string, string> = {
  OUT_FOR_DELIVERY: "bg-yellow-100 text-yellow-800",
  DELIVERED: "bg-green-100 text-green-800",
  IN_TRANSIT: "bg-blue-100 text-blue-800",
  EXCEPTION: "bg-red-100 text-red-800",
};

export default function CourierDeliveries() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [viewMode, setViewMode] = useState<"list" | "map">("map");
  const [completingId, setCompletingId] = useState<string | null>(null);

  // Fetch parcels assigned to the current user (courier view)
  const { data, isLoading, error, refetch } = useMyParcels(page, 20);

  const parcels = data?.content ?? [];
  const totalPages = data?.totalPages ?? 0;

  // Filter to show only deliveries assigned to courier (OUT_FOR_DELIVERY status)
  const deliveries = parcels.filter(
    (p) => p.status === "OUT_FOR_DELIVERY" || p.status === "IN_TRANSIT",
  );

  // Convert deliveries to map stops using real data from API response
  const mapStops = useMemo(
    () =>
      deliveries.map((d, index) => ({
        id: d.id,
        type: "DELIVERY" as const,
        location: {
          lat: d.recipientLatitude ?? 4.0511,
          lng: d.recipientLongitude ?? 9.7679,
          address: [d.recipientCity, d.recipientRegion].filter(Boolean).join(", ") ||
            t("deliveries.courier.deliveryLocation", { index: index + 1 }),
        },
        parcelId: d.id,
        trackingCode: d.trackingRef || d.id.slice(0, 10),
        clientName: d.clientName || t("deliveries.courier.recipient"),
        clientPhone: d.clientPhone || "",
        priority: 1,
      })),
    [deliveries, t],
  );

  // Handle marking a stop as complete — call the real backend delivery API
  const handleStopComplete = useCallback(
    async (stopId: string) => {
      setCompletingId(stopId);
      try {
        // Get current GPS position
        const position = await new Promise<GeolocationPosition>(
          (resolve, reject) =>
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 10000,
            }),
        ).catch(() => null);

        const lat = position?.coords.latitude ?? 0;
        const lng = position?.coords.longitude ?? 0;

        await deliveryService.completeDelivery({
          parcelId: stopId,
          latitude: lat,
          longitude: lng,
          notes: "Completed via courier map view",
        });

        toast.success(
          t("deliveries.courier.toasts.markedComplete", {
            id: stopId.slice(0, 8),
          }),
        );
        // Refresh the list after completion
        refetch();
      } catch (err) {
        toast.error(
          t("deliveries.courier.toasts.completeFailed") || "Failed to complete delivery",
          {
            description: err instanceof Error ? err.message : "Unknown error",
          },
        );
      } finally {
        setCompletingId(null);
      }
    },
    [t, refetch],
  );

  const handleNavigate = (stop: { location: { lat: number; lng: number } }) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${stop.location.lat},${stop.location.lng}`;
    window.open(url, "_blank");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            {t("deliveries.courier.title")}
          </h1>
          <p className="text-muted-foreground">
            {t("deliveries.courier.subtitle", { count: deliveries.length })}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={viewMode === "map" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("map")}
          >
            <Map className="w-4 h-4 mr-1" />
            {t("deliveries.courier.mapView")}
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("list")}
          >
            <List className="w-4 h-4 mr-1" />
            {t("deliveries.courier.listView")}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <EmptyState
          icon={Package}
          title={t("deliveries.courier.errorTitle")}
          description={
            error instanceof Error ? error.message : t("common.error")
          }
        />
      ) : deliveries.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No deliveries"
          description="Deliveries assigned to you will appear here"
        />
      ) : viewMode === "map" ? (
        <CourierNavigationMap
          stops={mapStops}
          onStopComplete={handleStopComplete}
          onNavigate={handleNavigate}
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Deliveries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {deliveries.map((d) => (
                <div
                  key={d.id}
                  className="flex items-center justify-between border rounded-lg p-3 bg-white"
                >
                  <div>
                    <div className="font-medium">
                      {d.trackingRef || d.id.slice(0, 10)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {d.recipientCity || d.recipientRegion || t("deliveries.courier.unknownDestination") || "Unknown destination"}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      className={
                        statusColors[d.status || ""] ||
                        "bg-muted text-muted-foreground"
                      }
                    >
                      {(d.status || "UNKNOWN").replace(/_/g, " ")}
                    </Badge>
                    <Button
                      onClick={() => navigate(`/courier/deliveries/${d.id}`)}
                    >
                      Start
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground self-center">
                  Page {page + 1} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
