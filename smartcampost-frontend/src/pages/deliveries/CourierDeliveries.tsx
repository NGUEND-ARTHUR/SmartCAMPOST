import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Package, Loader2, Map, List } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
// Tabs not used in this view
import { EmptyState } from "@/components/EmptyState";
import { CourierNavigationMap } from "@/components/maps";
import { useMyParcels } from "@/hooks";
import { toast } from "sonner";

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
  // Note: Ideally there would be a dedicated courier deliveries endpoint
  // Using myParcels as a placeholder - backend should provide courier-specific endpoint
  const { data, isLoading, error } = useMyParcels(page, 20);

  const parcels = data?.content ?? [];
  const totalPages = data?.totalPages ?? 0;

  // Filter to show only deliveries assigned to courier (OUT_FOR_DELIVERY status)
  const deliveries = parcels.filter(
    (p) => p.status === "OUT_FOR_DELIVERY" || p.status === "IN_TRANSIT",
  );

  // Convert deliveries to map stops format (memoized to avoid impure calls on every render)
  // Stable pseudo-random generator based on id to avoid Math.random() during render
  const stableRandom = (s: string) => {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619) >>> 0;
    }
    return (h % 1000) / 1000;
  };

  const mapStops = useMemo(
    () =>
      deliveries.map((d, index) => {
        const r = stableRandom(d.id + String(index));
        return {
          id: d.id,
          type: "DELIVERY" as const,
          location: {
            lat: 4.0511 + r * 0.1,
            lng: 9.7679 + r * 0.1,
            address: t("deliveries.courier.deliveryLocation", {
              index: index + 1,
            }),
          },
          parcelId: d.id,
          trackingCode: d.trackingRef || d.id.slice(0, 10),
          clientName: "Customer",
          clientPhone: "+237 XXX XXX XXX",
          priority: 1,
        };
      }),
    [deliveries, t],
  );

  const handleStopComplete = (stopId: string) => {
    toast.success(
      t("deliveries.courier.toasts.markedComplete", {
        id: stopId.slice(0, 8),
      }),
    );
    // Would call API to update delivery status
  };

  const handleNavigate = (stop: { location: { lat: number; lng: number } }) => {
    // Open Google Maps or native navigation
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
                      Recipient • Unknown city
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
