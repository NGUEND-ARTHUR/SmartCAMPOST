import { useState } from "react";
import { useTranslation } from "react-i18next";
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
  REQUESTED: "bg-yellow-100 text-yellow-800",
  ASSIGNED: "bg-blue-100 text-blue-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
};

export default function PickupsManagement() {
  const { t } = useTranslation();
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
      toast.error(t("pickups.management.toasts.selectCourier"));
      return;
    }
    assignCourier.mutate(
      { id: selectedPickupId, courierId: selectedCourierId },
      {
        onSuccess: () => {
          toast.success(t("pickups.management.toasts.courierAssigned"));
          setAssignDialogOpen(false);
        },
        onError: (err) =>
          toast.error(
            err instanceof Error
              ? err.message
              : t("pickups.management.toasts.assignFailed"),
          ),
      },
    );
  };

  const stateLabel = (state: string) =>
    t(`pickups.management.state.${state.toLowerCase()}`, {
      defaultValue: state,
    });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("pickups.management.title")}</h1>
        <p className="text-muted-foreground">
          {t("pickups.management.subtitle")}
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>{t("pickups.management.allPickups")}</CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t("pickups.management.searchPlaceholder")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-52"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger
                  className="w-44"
                  title={t("pickups.management.filterByStatus")}
                >
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue
                    placeholder={t("pickups.management.filterByStatus")}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">
                    {t("pickups.management.status.all")}
                  </SelectItem>
                  <SelectItem value="REQUESTED">
                    {t("pickups.management.status.requested")}
                  </SelectItem>
                  <SelectItem value="ASSIGNED">
                    {t("pickups.management.status.assigned")}
                  </SelectItem>
                  <SelectItem value="COMPLETED">
                    {t("pickups.management.status.completed")}
                  </SelectItem>
                  <SelectItem value="CANCELLED">
                    {t("pickups.management.status.cancelled")}
                  </SelectItem>
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
              title={t("pickups.management.states.errorTitle")}
              description={
                error instanceof Error ? error.message : t("common.error")
              }
            />
          ) : filteredPickups.length === 0 ? (
            <EmptyState
              icon={Truck}
              title={t("pickups.management.states.emptyTitle")}
              description={
                searchQuery || statusFilter !== "ALL"
                  ? t("pickups.management.states.emptyFiltered")
                  : t("pickups.management.states.emptyDefault")
              }
            />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      {t("pickups.management.table.pickupId")}
                    </TableHead>
                    <TableHead>
                      {t("pickups.management.table.client")}
                    </TableHead>
                    <TableHead>
                      {t("pickups.management.table.parcel")}
                    </TableHead>
                    <TableHead>{t("pickups.management.table.state")}</TableHead>
                    <TableHead>
                      {t("pickups.management.table.courier")}
                    </TableHead>
                    <TableHead>
                      {t("pickups.management.table.scheduled")}
                    </TableHead>
                    <TableHead>{t("common.actions")}</TableHead>
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
                          {stateLabel(pickup.state)}
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
                        {pickup.state === "REQUESTED" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenAssign(pickup.id)}
                          >
                            <UserPlus className="w-4 h-4 mr-1" />
                            {t("pickups.management.assign")}
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
                    {t("common.previous")}
                  </Button>
                  <span className="text-sm text-muted-foreground self-center">
                    {t("pickups.management.pagination", {
                      page: page + 1,
                      totalPages,
                    })}
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

      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("pickups.management.dialog.title")}</DialogTitle>
            <DialogDescription>
              {t("pickups.management.dialog.description")}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="courier">
              {t("pickups.management.dialog.courier")}
            </Label>
            <Select
              value={selectedCourierId}
              onValueChange={setSelectedCourierId}
            >
              <SelectTrigger id="courier">
                <SelectValue
                  placeholder={t("pickups.management.dialog.selectCourier")}
                />
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
              {t("common.cancel")}
            </Button>
            <Button onClick={handleAssign} disabled={assignCourier.isPending}>
              {t("pickups.management.assign")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
