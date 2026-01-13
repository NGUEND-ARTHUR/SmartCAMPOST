import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Filter, Package, Search, ShieldAlert, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/EmptyState";
import { useParcels } from "@/hooks";

type AdminParcelStatus =
  | "CREATED"
  | "IN_TRANSIT"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "RETURNED"
  | "EXCEPTION";

const statusBadge: Record<AdminParcelStatus, string> = {
  CREATED: "bg-gray-100 text-gray-800",
  IN_TRANSIT: "bg-blue-100 text-blue-800",
  OUT_FOR_DELIVERY: "bg-yellow-100 text-yellow-800",
  DELIVERED: "bg-green-100 text-green-800",
  RETURNED: "bg-orange-100 text-orange-800",
  EXCEPTION: "bg-red-100 text-red-800",
};

export default function ParcelManagement() {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | AdminParcelStatus>(
    "ALL",
  );
  const [serviceFilter, setServiceFilter] = useState<
    "ALL" | "EXPRESS" | "STANDARD"
  >("ALL");

  const { data, isLoading, error } = useParcels(page, 50);
  const parcels = data?.content ?? [];
  const totalPages = data?.totalPages ?? 0;

  const filteredParcels = useMemo(() => {
    return parcels.filter((p) => {
      const trackingRef = (p.trackingRef ?? "").toString();
      const matchesSearch =
        !searchQuery.trim() ||
        trackingRef.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.clientId ?? "")
          .toString()
          .toLowerCase()
          .includes(searchQuery.toLowerCase());
      const matchesStatus =
        statusFilter === "ALL" ||
        (p.status as AdminParcelStatus) === statusFilter;
      const matchesService =
        serviceFilter === "ALL" ||
        (p.serviceType as "EXPRESS" | "STANDARD") === serviceFilter;
      return matchesSearch && matchesStatus && matchesService;
    });
  }, [parcels, searchQuery, statusFilter, serviceFilter]);

  const totals = useMemo(() => {
    const all = parcels.length;
    const inTransit = parcels.filter(
      (p) => p.status === "IN_TRANSIT" || p.status === "OUT_FOR_DELIVERY",
    ).length;
    const delivered = parcels.filter((p) => p.status === "DELIVERED").length;
    const exceptions = parcels.filter((p) => p.status === "EXCEPTION").length;
    return { all, inTransit, delivered, exceptions };
  }, [parcels]);

  const handleView = (parcelId: string) => {
    navigate(`/client/parcels/${parcelId}`);
  };

  const handleFlag = (trackingRef: string) => {
    toast.success("Flagged for review", { description: trackingRef });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Parcel Management</h1>
        <p className="text-muted-foreground">
          Search, triage and take action on operational parcels
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Parcels</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.all}</div>
            <p className="text-xs text-muted-foreground">Across all statuses</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.inTransit}</div>
            <p className="text-xs text-muted-foreground">
              In transit / out for delivery
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Delivered</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.delivered}</div>
            <p className="text-xs text-muted-foreground">Completed shipments</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Exceptions</CardTitle>
            <ShieldAlert className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.exceptions}</div>
            <p className="text-xs text-muted-foreground">Need attention</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by tracking # or client…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select
                value={statusFilter}
                onValueChange={(v: string) => setStatusFilter(v as any)}
              >
                <SelectTrigger className="w-52" title="Filter by status">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="CREATED">Created</SelectItem>
                  <SelectItem value="IN_TRANSIT">In Transit</SelectItem>
                  <SelectItem value="OUT_FOR_DELIVERY">
                    Out for Delivery
                  </SelectItem>
                  <SelectItem value="DELIVERED">Delivered</SelectItem>
                  <SelectItem value="RETURNED">Returned</SelectItem>
                  <SelectItem value="EXCEPTION">Exception</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={serviceFilter}
                onValueChange={(v: string) => setServiceFilter(v as any)}
              >
                <SelectTrigger className="w-44" title="Filter by service">
                  <SelectValue placeholder="Service" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Service</SelectItem>
                  <SelectItem value="EXPRESS">Express</SelectItem>
                  <SelectItem value="STANDARD">Standard</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <EmptyState
              icon={Package}
              title="Error loading parcels"
              description={
                error instanceof Error ? error.message : "An error occurred"
              }
            />
          ) : filteredParcels.length === 0 ? (
            <EmptyState
              icon={Package}
              title="No parcels found"
              description={
                searchQuery || statusFilter !== "ALL" || serviceFilter !== "ALL"
                  ? "Try adjusting your search or filters"
                  : "Operational parcels will appear here"
              }
            />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tracking</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Update</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredParcels.map((p) => {
                    const trackingRef = (p.trackingRef ?? p.id).toString();
                    const status = (p.status ?? "CREATED") as AdminParcelStatus;
                    const updatedAt = (p.createdAt ?? "").toString();

                    return (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">
                          {trackingRef}
                        </TableCell>
                        <TableCell className="text-sm">
                          {(p.clientId ?? "—").toString().slice(0, 8)}
                        </TableCell>
                        <TableCell className="text-sm capitalize">
                          {(p.serviceType ?? "—").toString().toLowerCase()}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              statusBadge[status] || "bg-gray-100 text-gray-800"
                            }
                          >
                            {status.toString().replace(/_/g, " ")}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {updatedAt
                            ? new Date(updatedAt).toLocaleString()
                            : "—"}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleView(p.id)}
                            >
                              View
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleFlag(trackingRef)}
                            >
                              Flag
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
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
