import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Package,
  Search,
  Filter,
  Plus,
  Loader2,
  Bell,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
import { StatusBadge } from "@/components/StatusBadge";
import { EmptyState } from "@/components/EmptyState";
import NotificationsDrawer from "@/components/NotificationsDrawer";
import { exportToCsv, exportToJson, exportToPdf, exportToXlsx } from "@/lib/exportCsv";
import { useMyParcels } from "@/hooks";

export function ParcelList() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [page, setPage] = useState(0);
  const [exportFormat, setExportFormat] = useState<
    "CSV" | "JSON" | "XLSX" | "PDF"
  >(
    "CSV",
  );

  const { data, isLoading, error } = useMyParcels(page, 20);

  const parcels = data?.content ?? [];
  const totalPages = data?.totalPages ?? 0;

  const filteredParcels = parcels.filter((parcel) => {
    const matchesSearch = parcel.trackingRef
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "ALL" || parcel.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{t("parcelList.title")}</h1>
          <p className="text-muted-foreground">{t("parcelList.subtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          <NotificationsDrawer />
          <Select
            value={exportFormat}
            onValueChange={(value: string) =>
              setExportFormat(value as "CSV" | "JSON" | "XLSX" | "PDF")
            }
          >
            <SelectTrigger className="w-28" title="Export format">
              <SelectValue placeholder="CSV" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CSV">CSV</SelectItem>
              <SelectItem value="JSON">JSON</SelectItem>
              <SelectItem value="XLSX">XLSX</SelectItem>
              <SelectItem value="PDF">PDF</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="ghost"
            onClick={async () => {
              const rows = filteredParcels.map((p) => ({
                id: p.id,
                trackingRef: p.trackingRef,
                status: p.status,
                serviceType: p.serviceType,
                deliveryOption: p.deliveryOption,
                createdAt: p.createdAt,
              }));

              if (exportFormat === "JSON") {
                exportToJson("parcels_export.json", rows);
                return;
              }

              if (exportFormat === "XLSX") {
                await exportToXlsx("parcels_export.xlsx", rows, "parcels");
                return;
              }

              if (exportFormat === "PDF") {
                await exportToPdf("parcels_export.pdf", rows, "Parcels Export");
                return;
              }

              exportToCsv("parcels_export.csv", rows);
            }}
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => navigate("/client/parcels/create")}>
            <Plus className="w-4 h-4 mr-2" />
            {t("parcelList.createParcel")}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex-1 w-full sm:w-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder={t("parcelList.searchPlaceholder")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger
                  className="w-full sm:w-44"
                  title={t("parcelList.filterByStatus")!}
                >
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder={t("parcelList.filterByStatus")!} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">
                    {t("parcelList.status.all")}
                  </SelectItem>
                  <SelectItem value="CREATED">
                    {t("parcelList.status.created")}
                  </SelectItem>
                  <SelectItem value="ACCEPTED">
                    {t("parcelList.status.accepted")}
                  </SelectItem>
                  <SelectItem value="IN_TRANSIT">
                    {t("parcelList.status.inTransit")}
                  </SelectItem>
                  <SelectItem value="ARRIVED_HUB">
                    {t("parcelList.status.arrivedHub")}
                  </SelectItem>
                  <SelectItem value="OUT_FOR_DELIVERY">
                    {t("parcelList.status.outForDelivery")}
                  </SelectItem>
                  <SelectItem value="DELIVERED">
                    {t("parcelList.status.delivered")}
                  </SelectItem>
                  <SelectItem value="RETURNED">
                    {t("parcelList.status.returned")}
                  </SelectItem>
                  <SelectItem value="CANCELLED">
                    {t("parcelList.status.cancelled")}
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
              title={t("parcelList.errorLoading")}
              description={
                error instanceof Error
                  ? error.message
                  : t("common.errorOccurred")
              }
            />
          ) : filteredParcels.length === 0 ? (
            <EmptyState
              icon={Package}
              title={t("parcelList.noParcelsFound")}
              description={
                searchQuery || statusFilter !== "ALL"
                  ? t("parcelList.tryAdjustingSearch")
                  : t("parcelList.createFirstParcel")
              }
              actionLabel={
                !searchQuery && statusFilter === "ALL"
                  ? t("parcelList.createParcel")
                  : undefined
              }
              onAction={() => navigate("/client/parcels/create")}
            />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("parcelList.table.tracking")}</TableHead>
                    <TableHead>{t("parcelList.table.service")}</TableHead>
                    <TableHead>{t("parcelList.table.delivery")}</TableHead>
                    <TableHead>{t("parcelList.table.status")}</TableHead>
                    <TableHead>{t("parcelList.table.created")}</TableHead>
                    <TableHead>{t("parcelList.table.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredParcels.map((parcel) => (
                    <TableRow key={parcel.id}>
                      <TableCell className="font-medium">
                        {parcel.trackingRef}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm capitalize">
                          {parcel.serviceType.toLowerCase()}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm capitalize">
                          {parcel.deliveryOption.toLowerCase()}
                        </span>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={parcel.status} />
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(parcel.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              navigate(`/client/parcels/${parcel.id}`)
                            }
                          >
                            {t("parcelList.actions.viewDetails")}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              navigate(`/client/parcels/${parcel.id}#tracking`)
                            }
                          >
                            {t("parcelList.actions.track")}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              window.open(
                                `/client/parcels/${parcel.id}/print-label`,
                                "_blank",
                              )
                            }
                          >
                            {t("parcelList.actions.printLabel")}
                          </Button>
                        </div>
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
