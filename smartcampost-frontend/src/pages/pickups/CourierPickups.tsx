import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Truck, Loader2 } from "lucide-react";
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
      trackingCode: p.trackingRef ?? p.parcelId.slice(0, 8),
      clientName: p.clientName ?? p.clientId.slice(0, 8),
      clientPhone: p.clientPhone ?? "—",
    }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Pickups</h1>
        <p className="text-muted-foreground">Assigned pickup requests</p>
      </div>

      {stops.length > 0 && <CourierNavigationMap stops={stops} />}

      <Card>
        <CardHeader>
          <CardTitle>Pickups</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <EmptyState
              icon={Truck}
              title="Error loading pickups"
              description={
                error instanceof Error ? error.message : "An error occurred"
              }
            />
          ) : pickups.length === 0 ? (
            <EmptyState
              icon={Truck}
              title="No pickups"
              description="Pickups assigned to you will appear here"
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
                        Pickup #{p.id.slice(0, 8)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {p.trackingRef ?? p.parcelId.slice(0, 8)} •{" "}
                        {p.requestedDate
                          ? new Date(p.requestedDate).toLocaleDateString()
                          : "No schedule"}
                        {p.timeWindow ? ` (${p.timeWindow})` : ""}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge
                        className={
                          statusColors[p.state] || "bg-gray-100 text-gray-800"
                        }
                      >
                        {p.state}
                      </Badge>
                      <Button
                        variant="outline"
                        onClick={() => navigate(`/courier/pickups/${p.id}`)}
                      >
                        Open
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
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
