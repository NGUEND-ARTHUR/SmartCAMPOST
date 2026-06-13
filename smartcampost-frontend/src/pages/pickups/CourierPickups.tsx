import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Truck, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/EmptyState";
import { useCourierPickups } from "@/hooks";
import CourierNavigationMap from "@/components/maps/CourierNavigationMap";

const statusColors: Record<string, string> = {
  REQUESTED: "bg-yellow-100 text-yellow-800",
  ASSIGNED: "bg-blue-100 text-blue-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
};

export default function CourierPickups() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [page, setPage] = useState(0);
  const { data, isLoading, error } = useCourierPickups(page, 20);

  const pickups = data?.content ?? [];
  const totalPages = data?.totalPages ?? 0;

  const stops = pickups
    .filter(
      (p) =>
        p.state === "ASSIGNED" &&
        typeof p.pickupLatitude === "number" &&
        typeof p.pickupLongitude === "number",
    )
    .map((p) => ({
      id: p.id,
      type: "PICKUP" as const,
      location: {
        lat: p.pickupLatitude as number,
        lng: p.pickupLongitude as number,
      },
      parcelId: p.parcelId,
      trackingCode: p.trackingRef ?? p.parcelId?.slice(0, 8) ?? "—",
      clientName: p.clientName ?? p.clientId?.slice(0, 8) ?? "—",
      clientPhone: p.clientPhone ?? "—",
    }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("nav.myPickups")}</h1>
        <p className="text-muted-foreground">{t("pickups.courier.subtitle")}</p>
      </div>

      {stops.length > 0 && <CourierNavigationMap stops={stops} />}

      <Card>
        <CardHeader>
          <CardTitle>{t("pickups.courier.listTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <EmptyState
              icon={Truck}
              title={t("pickups.page.errorTitle")}
              description={
                error instanceof Error ? error.message : t("common.errorOccurred")
              }
            />
          ) : pickups.length === 0 ? (
            <EmptyState
              icon={Truck}
              title={t("pickups.courier.emptyTitle")}
              description={t("pickups.courier.emptyDescription")}
            />
          ) : (
            <>
              <div className="space-y-3">
                {pickups.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between border rounded-lg p-3 bg-white"
                  >
                    <div>
                      <div className="font-medium">
                        {t("pickups.page.pickupId", { id: p.id.slice(0, 8) })}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {p.trackingRef ?? p.parcelId?.slice(0, 8) ?? "—"} •{" "}
                        {p.requestedDate
                          ? new Date(p.requestedDate).toLocaleDateString()
                          : t("pickups.courier.noSchedule")}
                        {p.timeWindow ? ` (${p.timeWindow})` : ""}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge
                        className={
                          statusColors[p.state] ||
                          "bg-muted text-muted-foreground"
                        }
                      >
                        {p.state}
                      </Badge>
                      <Button
                        variant="outline"
                        onClick={() => navigate(`/courier/pickups/${p.id}`)}
                      >
                        {t("common.view")}
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
                    {t("common.previous")}
                  </Button>
                  <span className="text-sm text-muted-foreground self-center">
                    {t("common.pageOf", { page: page + 1, total: totalPages })}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages - 1}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    {t("common.next")}
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
