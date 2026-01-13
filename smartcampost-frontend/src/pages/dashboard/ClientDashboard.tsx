import { Package, TrendingUp, Clock, CheckCircle, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useMyParcels } from "@/hooks";
import { useMemo } from "react";

export function ClientDashboard() {
  const navigate = useNavigate();
  const { data, isLoading } = useMyParcels(0, 100);
  const parcels = data?.content ?? [];

  const stats = useMemo(() => {
    const inTransit = parcels.filter(
      (p) => p.status === "IN_TRANSIT" || p.status === "OUT_FOR_DELIVERY",
    ).length;
    const delivered = parcels.filter((p) => p.status === "DELIVERED").length;
    const pending = parcels.filter(
      (p) => p.status === "CREATED" || p.status === "PENDING",
    ).length;
    return { inTransit, delivered, pending, total: parcels.length };
  }, [parcels]);

  const recentParcels = parcels.slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back to SmartCAMPOST</p>
        </div>
        <Button onClick={() => navigate("/client/parcels/create")}>
          <Package className="w-4 h-4 mr-2" />
          Create Parcel
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  In Transit
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.inTransit}</div>
                <p className="text-xs text-muted-foreground">
                  Active shipments
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Delivered</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.delivered}</div>
                <p className="text-xs text-muted-foreground">Completed</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.pending}</div>
                <p className="text-xs text-muted-foreground">Awaiting pickup</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Parcels
                </CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
                <p className="text-xs text-muted-foreground">All time</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Parcels</CardTitle>
            </CardHeader>
            <CardContent>
              {recentParcels.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p>No recent parcels</p>
                  <Button
                    variant="link"
                    onClick={() => navigate("/client/parcels/create")}
                  >
                    Create your first parcel
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentParcels.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between border rounded-lg p-3"
                    >
                      <div>
                        <div className="font-medium">
                          {p.trackingRef || p.id.slice(0, 10)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {p.status?.replace(/_/g, " ")}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/client/parcels/${p.id}`)}
                      >
                        View
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
