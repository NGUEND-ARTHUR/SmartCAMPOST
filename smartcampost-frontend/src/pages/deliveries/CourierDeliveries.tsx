import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Package, Loader2, Map, List, Sparkles, Clock, RotateCcw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/EmptyState";
import { CourierNavigationMap } from "@/components/maps";
import { useMyParcels } from "@/hooks";
import { toast } from "sonner";
import { deliveryService } from "@/services";
import { aiService, type RouteOptimizationResponse } from "@/services/ai/ai.api";
import type { ParcelResponse } from "@/services/parcels/parcels.api";

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
  const [aiRoute, setAiRoute] = useState<RouteOptimizationResponse | null>(null);
  const [aiRouteLoading, setAiRouteLoading] = useState(false);

  // Fetch parcels assigned to the current user (courier view)
  const { data, isLoading, error, refetch } = useMyParcels(page, 20);

  const parcels = data?.content ?? [];
  const totalPages = data?.totalPages ?? 0;

  // Filter to show only deliveries assigned to courier (OUT_FOR_DELIVERY status)
  const deliveries = parcels.filter(
    (p) => p.status === "OUT_FOR_DELIVERY" || p.status === "IN_TRANSIT",
  );

  const deliveryParcels = deliveries as ParcelResponse[];

  // Convert deliveries to map stops using real data from API response
  const mapStops = useMemo(
    () =>
      deliveryParcels.map((d, index) => ({
        id: d.id,
        type: "DELIVERY" as const,
        location: {
          lat: d.recipientLatitude ?? 4.0511,
          lng: d.recipientLongitude ?? 9.7679,
          address:
            [d.recipientCity, d.recipientRegion].filter(Boolean).join(", ") ||
            t("deliveries.courier.deliveryLocation", { index: index + 1 }),
        },
        parcelId: d.id,
        trackingCode: d.trackingRef || d.id.slice(0, 10),
        clientName: d.clientName || t("deliveries.courier.recipient"),
        clientPhone: d.clientPhone || "",
        priority: 1,
      })),
    [deliveryParcels, t],
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
          t("deliveries.courier.toasts.completeFailed") ||
            "Failed to complete delivery",
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

  const handleAiOptimize = useCallback(async () => {
    if (deliveryParcels.length === 0) {
      toast.error("No deliveries to optimize");
      return;
    }
    setAiRouteLoading(true);
    try {
      // Get courier location for better optimization
      const position = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
      ).catch(() => null);

      const stops = deliveryParcels.map((d, i) => ({
        id: d.id,
        type: "DELIVERY" as const,
        latitude: d.recipientLatitude ?? 4.0511,
        longitude: d.recipientLongitude ?? 9.7679,
        address: [d.recipientCity, d.recipientRegion].filter(Boolean).join(", ") || `Stop ${i + 1}`,
        priority: 1,
      }));

      const result = await aiService.optimizeRoute({
        stops,
        courierLat: position?.coords.latitude,
        courierLng: position?.coords.longitude,
        optimizationStrategy: "BALANCED",
      });

      setAiRoute(result);
      toast.success(`Route optimized — ${result.totalDistanceKm.toFixed(1)} km total, saves ~${result.fuelSavingsPercent.toFixed(0)}% vs unordered`);
    } catch {
      toast.error("Could not optimize route. Showing map with local optimization.");
    } finally {
      setAiRouteLoading(false);
    }
  }, [deliveryParcels]);

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
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => void handleAiOptimize()}
            disabled={aiRouteLoading || deliveries.length === 0}
            className="gap-1.5"
          >
            {aiRouteLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 text-blue-500" />
            )}
            AI Route
          </Button>
          {aiRoute && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAiRoute(null)}
              className="gap-1.5 text-muted-foreground"
            >
              <RotateCcw className="w-3 h-3" />
              Clear
            </Button>
          )}
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
          title={t("deliveries.courier.noDeliveries")}
          description={t("deliveries.courier.noDeliveriesDescription")}
        />
      ) : viewMode === "map" ? (
        <div className="space-y-4">
          {aiRoute && (
            <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-500" />
                  AI Optimized Route
                  <span className="text-xs font-normal text-muted-foreground ml-auto">
                    {aiRoute.totalDistanceKm.toFixed(1)} km · ~{aiRoute.estimatedDurationMinutes} min · saves {aiRoute.fuelSavingsPercent.toFixed(0)}%
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="space-y-2">
                  {aiRoute.optimizedRoute.map((stop, idx) => {
                    const parcel = deliveryParcels.find((d) => d.id === stop.id);
                    return (
                      <li key={stop.id} className="flex items-start gap-3 text-sm">
                        <div className="shrink-0 w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold mt-0.5">
                          {idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">
                            {stop.address || parcel?.trackingRef || stop.id.slice(0, 8)}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            <span>Arrive ~{stop.arrivalTime}</span>
                            <span>·</span>
                            <span>{stop.distanceFromPrevious.toFixed(1)} km from prev</span>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs shrink-0">
                          +{stop.etaMinutes} min
                        </Badge>
                      </li>
                    );
                  })}
                </ol>
              </CardContent>
            </Card>
          )}
          <CourierNavigationMap
            stops={mapStops}
            onStopComplete={handleStopComplete}
            onNavigate={handleNavigate}
          />
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{t("deliveries.courier.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {deliveries.map((d) => (
                <div
                  key={d.id}
                  className="flex items-center justify-between border rounded-lg p-3 bg-card"
                >
                  <div>
                    <div className="font-medium">
                      {d.trackingRef || d.id.slice(0, 10)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {d.recipientCity ||
                        d.recipientRegion ||
                        t("deliveries.courier.unknownDestination") ||
                        "Unknown destination"}
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
