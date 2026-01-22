import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
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
  const parcels = useMemo(() => data?.content ?? [], [data]);
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
    toast.success(t("parcelManagement.flagged"), { description: trackingRef });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("parcelManagement.title")}</h1>
        <p className="text-muted-foreground">
          {t("parcelManagement.subtitle")}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("parcelManagement.stats.total")}
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.all}</div>
            <p className="text-xs text-muted-foreground">
              {t("parcelManagement.stats.allStatuses")}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("parcelManagement.stats.active")}
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.inTransit}</div>
            <p className="text-xs text-muted-foreground">
              {t("parcelManagement.stats.inTransit")}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("parcelManagement.stats.delivered")}
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.delivered}</div>
            <p className="text-xs text-muted-foreground">
              {t("parcelManagement.stats.completed")}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("parcelManagement.stats.exceptions")}
            </CardTitle>
            <ShieldAlert className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.exceptions}</div>
            <p className="text-xs text-muted-foreground">
              {t("parcelManagement.stats.needAttention")}
            </p>
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
                  placeholder={t("parcelManagement.searchPlaceholder")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select
                value={statusFilter}
                onValueChange={(v: string) =>
                  setStatusFilter(v as "ALL" | AdminParcelStatus)
                }
              >
                <SelectTrigger
                  className="w-52"
                  title={t("parcelManagement.filterByStatus")!}
                >
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue
                    placeholder={t("parcelManagement.filterByStatus")!}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">
                    {t("parcelManagement.status.all")}
                  </SelectItem>
                  <SelectItem value="CREATED">
                    {t("parcelManagement.status.created")}
                  </SelectItem>
                  <SelectItem value="IN_TRANSIT">
                    {t("parcelManagement.status.inTransit")}
                  </SelectItem>
                  <SelectItem value="OUT_FOR_DELIVERY">
                    {t("parcelManagement.status.outForDelivery")}
                  </SelectItem>
                  <SelectItem value="DELIVERED">
                    {t("parcelManagement.status.delivered")}
                  </SelectItem>
                  <SelectItem value="RETURNED">
                    {t("parcelManagement.status.returned")}
                  </SelectItem>
                  <SelectItem value="EXCEPTION">
                    {t("parcelManagement.status.exception")}
                  </SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={serviceFilter}
                onValueChange={(v: string) =>
                  setServiceFilter(v as "ALL" | "EXPRESS" | "STANDARD")
                }
              >
                <SelectTrigger
                  className="w-44"
                  title={t("parcelManagement.filterByService")!}
                >
                  <SelectValue
                    placeholder={t("parcelManagement.filterByService")!}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">
                    {t("parcelManagement.service.all")}
                  </SelectItem>
                  <SelectItem value="EXPRESS">
                    {t("parcelManagement.service.express")}
                  </SelectItem>
                  <SelectItem value="STANDARD">
                    {t("parcelManagement.service.standard")}
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
              icon={Package}
              title={t("parcelManagement.errorLoading")}
              description={
                error instanceof Error
                  ? error.message
                  : t("common.errorOccurred")
              }
            />
          ) : filteredParcels.length === 0 ? (
            <EmptyState
              icon={Package}
              title={t("parcelManagement.noParcelsFound")}
              description={
                searchQuery || statusFilter !== "ALL" || serviceFilter !== "ALL"
                  ? t("parcelManagement.tryAdjustingSearch")
                  : t("parcelManagement.operationalParcelsAppearHere")
              }
            />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      {t("parcelManagement.table.tracking")}
                    </TableHead>
                    <TableHead>{t("parcelManagement.table.client")}</TableHead>
                    <TableHead>{t("parcelManagement.table.service")}</TableHead>
                    <TableHead>{t("parcelManagement.table.status")}</TableHead>
                    <TableHead>
                      {t("parcelManagement.table.lastUpdate")}
                    </TableHead>
                    <TableHead>{t("parcelManagement.table.actions")}</TableHead>
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
                            {t(
                              `parcelManagement.status.${status.toLowerCase()}`,
                            )}
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
                              {t("parcelManagement.actions.view")}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleFlag(trackingRef)}
                            >
                              {t("parcelManagement.actions.flag")}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                window.open(
                                  `/dashboard/parcels/${p.id}#tracking`,
                                  "_blank",
                                )
                              }
                            >
                              {t("parcelManagement.actions.track")}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                window.open(
                                  `/dashboard/parcels/${p.id}?print=label`,
                                  "_blank",
                                )
                              }
                            >
                              {t("parcelManagement.actions.printLabel")}
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
