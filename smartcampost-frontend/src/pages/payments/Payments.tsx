import { useState } from "react";
import { useTranslation } from "react-i18next";
import { CreditCard, Filter, Receipt, Search, Loader2 } from "lucide-react";
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
import { usePayments } from "@/hooks";

const statusColors: Record<string, string> = {
  INIT: "bg-muted text-muted-foreground",
  PENDING:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  SUCCESS:
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  FAILED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  CANCELLED: "bg-muted text-muted-foreground",
};

const methodLabels: Record<string, string> = {
  CASH: "cash",
  MOBILE_MONEY: "mobileMoney",
  CARD: "card",
};

export default function Payments() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [page, setPage] = useState(0);

  const { data, isLoading, error } = usePayments(page, 20);
  const payments = data?.content ?? [];
  const totalPages = data?.totalPages ?? 0;

  const filteredPayments = payments.filter((payment) => {
    const matchesSearch =
      payment.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.parcelId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "ALL" || payment.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPaid = payments
    .filter((p) => p.status === "SUCCESS")
    .reduce((sum, p) => sum + p.amount, 0);
  const totalPending = payments
    .filter((p) => p.status === "PENDING")
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("payments.title")}</h1>
        <p className="text-muted-foreground">{t("payments.subtitle")}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("payments.totalPaid")}
            </CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalPaid.toLocaleString()} XAF
            </div>
            <p className="text-xs text-muted-foreground">
              {payments.filter((p) => p.status === "SUCCESS").length}{" "}
              {t("payments.successfulPayments")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("payments.pending")}
            </CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalPending.toLocaleString()} XAF
            </div>
            <p className="text-xs text-muted-foreground">
              {payments.filter((p) => p.status === "PENDING").length}{" "}
              {t("payments.pendingPayments")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("payments.totalTransactions")}
            </CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data?.totalElements ?? payments.length}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("payments.allTime")}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex-1 w-full sm:w-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder={t("payments.searchPlaceholder")}
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
                  title={t("payments.filterByStatus")}
                >
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder={t("payments.filterByStatus")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">
                    {t("payments.filters.all")}
                  </SelectItem>
                  <SelectItem value="SUCCESS">
                    {t("payments.filters.success")}
                  </SelectItem>
                  <SelectItem value="PENDING">
                    {t("payments.filters.pending")}
                  </SelectItem>
                  <SelectItem value="FAILED">
                    {t("payments.filters.failed")}
                  </SelectItem>
                  <SelectItem value="CANCELLED">
                    {t("payments.filters.cancelled")}
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
              icon={Receipt}
              title={t("payments.errorTitle")}
              description={
                error instanceof Error ? error.message : t("common.error")
              }
            />
          ) : filteredPayments.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title={t("payments.noPayments")}
              description={
                searchQuery || statusFilter !== "ALL"
                  ? t("payments.adjustFilters")
                  : t("payments.emptyDescription")
              }
            />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("payments.table.paymentId")}</TableHead>
                    <TableHead>{t("payments.table.parcel")}</TableHead>
                    <TableHead>{t("common.amount")}</TableHead>
                    <TableHead>{t("payments.table.method")}</TableHead>
                    <TableHead>{t("common.status")}</TableHead>
                    <TableHead>{t("payments.table.date")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">
                        {payment.id.slice(0, 8)}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {payment.parcelId.slice(0, 8)}
                        </span>
                      </TableCell>
                      <TableCell className="font-medium">
                        {payment.amount.toLocaleString()} {payment.currency}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {t(
                            `payments.methods.${methodLabels[payment.method]}`,
                          ) || payment.method}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            (payment.status && statusColors[payment.status]) ||
                            "bg-muted text-muted-foreground"
                          }
                        >
                          {payment.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(payment.timestamp).toLocaleDateString()}
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
                    {t("common.pageOf", { page: page + 1, totalPages })}
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
