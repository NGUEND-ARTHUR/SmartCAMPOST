import { useState } from "react";
import { Truck, Loader2, Search, Filter, UserPlus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/EmptyState";
import { usePickups, useAssignCourier, useCouriers } from "@/hooks";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  ASSIGNED: "bg-blue-100 text-blue-800",
  IN_PROGRESS: "bg-purple-100 text-purple-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
};

export default function PickupsManagement() {
  const [page, setPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedPickupId, setSelectedPickupId] = useState<string | null>(null);
  const [selectedCourierId, setSelectedCourierId] = useState<string>("");

  const { data, isLoading, error } = usePickups(page, 20);
  const { data: couriersData } = useCouriers(0, 100);
  const assignCourier = useAssignCourier();

  const pickups = data?.content ?? [];
  const totalPages = data?.totalPages ?? 0;
  const couriers = couriersData?.content ?? [];

  const filteredPickups = pickups.filter((pickup) => {
    const matchesSearch =
      !searchQuery.trim() ||
      pickup.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "ALL" || pickup.state === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleOpenAssign = (pickupId: string) => {
    setSelectedPickupId(pickupId);
    setSelectedCourierId("");
    setAssignDialogOpen(true);
  };

  const handleAssign = () => {
    if (!selectedPickupId || !selectedCourierId) {
      toast.error("Please select a courier");
      return;
    }
    assignCourier.mutate(
      { id: selectedPickupId, courierId: selectedCourierId },
      {
        onSuccess: () => {
          toast.success("Courier assigned");
          setAssignDialogOpen(false);
        },
        onError: (err) =>
          toast.error(
            err instanceof Error ? err.message : "Failed to assign courier",
          ),
      },
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Pickups Management</h1>
        <p className="text-muted-foreground">
          All pickup requests and courier assignment
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>All Pickups</CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search pickups..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-52"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-44" title="Filter by status">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="ASSIGNED">Assigned</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
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
              icon={Truck}
              title="Error loading pickups"
              description={
                error instanceof Error ? error.message : "An error occurred"
              }
            />
          ) : filteredPickups.length === 0 ? (
            <EmptyState
              icon={Truck}
              title="No pickups found"
              description={
                searchQuery || statusFilter !== "ALL"
                  ? "Try adjusting your search or filters"
                  : "Pickup requests will appear here"
              }
            />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pickup ID</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Parcel</TableHead>
                    <TableHead>State</TableHead>
                    <TableHead>Courier</TableHead>
                    <TableHead>Scheduled</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPickups.map((pickup) => (
                    <TableRow key={pickup.id}>
                      <TableCell className="font-medium">
                        {pickup.id.slice(0, 8)}
                      </TableCell>
                      <TableCell>
                        {pickup.clientName ?? pickup.clientId.slice(0, 8)}
                      </TableCell>
                      <TableCell>
                        {pickup.trackingRef ?? pickup.parcelId.slice(0, 8)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            statusColors[pickup.state] ||
                            "bg-gray-100 text-gray-800"
                          }
                        >
                          {pickup.state}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {pickup.courierName ??
                          (pickup.courierId
                            ? pickup.courierId.slice(0, 8)
                            : "—")}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {pickup.requestedDate
                          ? new Date(pickup.requestedDate).toLocaleDateString()
                          : "—"}
                        {pickup.timeWindow ? ` (${pickup.timeWindow})` : ""}
                      </TableCell>
                      <TableCell>
                        {pickup.state === "PENDING" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenAssign(pickup.id)}
                          >
                            <UserPlus className="w-4 h-4 mr-1" />
                            Assign
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
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

      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Courier</DialogTitle>
            <DialogDescription>
              Select a courier for this pickup request
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="courier">Courier</Label>
            <Select
              value={selectedCourierId}
              onValueChange={setSelectedCourierId}
            >
              <SelectTrigger id="courier">
                <SelectValue placeholder="Select a courier" />
              </SelectTrigger>
              <SelectContent>
                {couriers
                  .filter((c) => c.status === "AVAILABLE")
                  .map((courier) => (
                    <SelectItem key={courier.id} value={courier.id}>
                      {courier.fullName}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAssignDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleAssign} disabled={assignCourier.isPending}>
              Assign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
