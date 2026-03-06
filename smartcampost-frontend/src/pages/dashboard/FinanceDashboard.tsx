import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { CreditCard, Receipt, TrendingUp, Wallet, Loader2 } from "lucide-react";
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
import { EmptyState } from "@/components/EmptyState";
import { usePayments } from "@/hooks";

type PaymentStatusLocal =
  | "INIT"
  | "PENDING"
  | "SUCCESS"
  | "FAILED"
  | "CANCELLED";

const statusColors: Record<PaymentStatusLocal, string> = {
  INIT: "bg-muted text-muted-foreground",
  PENDING:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  SUCCESS:
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  FAILED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  CANCELLED: "bg-muted text-muted-foreground",
};

export default function FinanceDashboard() {
  const { t } = useTranslation();
  const [page, setPage] = useState(0);
  const { data, isLoading, error } = usePayments(page, 50);
  const payments = useMemo(() => data?.content ?? [], [data]);
  const totalPages = data?.totalPages ?? 0;

  const totals = useMemo(() => {
    const totalRevenue = payments
      .filter((p) => p.status === "SUCCESS")
      .reduce((sum, p) => sum + (p.amount ?? 0), 0);
    const pending = payments
      .filter((p) => p.status === "PENDING")
      .reduce((sum, p) => sum + (p.amount ?? 0), 0);
    const successCount = payments.filter((p) => p.status === "SUCCESS").length;
    const failedCount = payments.filter((p) => p.status === "FAILED").length;
    return { totalRevenue, pending, successCount, failedCount };
  }, [payments]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("financeDashboard.title")}</h1>
        <p className="text-muted-foreground">
          {t("financeDashboard.overview")}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("financeDashboard.totalRevenue")}</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totals.totalRevenue.toLocaleString()} XAF
            </div>
            <p className="text-xs text-muted-foreground">{t("financeDashboard.totalRevenueDesc")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("financeDashboard.pendingPayments")}
            </CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totals.pending.toLocaleString()} XAF
            </div>
            <p className="text-xs text-muted-foreground">
              {t("financeDashboard.pendingPaymentsDesc")}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("financeDashboard.completedTransactions")}</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.successCount}</div>
            <p className="text-xs text-muted-foreground">{t("financeDashboard.completedTransactionsDesc")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("common.failed")}</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.failedCount}</div>
            <p className="text-xs text-muted-foreground">{t("financeDashboard.averageValueDesc")}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("financeDashboard.recentTransactions")}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <EmptyState
              icon={CreditCard}
              title={t("common.errorLoading")}
              description={
                error instanceof Error ? error.message : t("common.errorOccurred")
              }
            />
          ) : payments.length === 0 ? (
            <EmptyState
              icon={CreditCard}
              title={t("financeDashboard.recentTransactions")}
              description={t("financeDashboard.completedTransactionsDesc")}
            />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("financeDashboard.transactionId")}</TableHead>
                    <TableHead>{t("common.parcel")}</TableHead>
                    <TableHead>{t("financeDashboard.amount")}</TableHead>
                    <TableHead>{t("financeDashboard.type")}</TableHead>
                    <TableHead>{t("financeDashboard.status")}</TableHead>
                    <TableHead>{t("financeDashboard.date")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">
                        {p.id.slice(0, 8)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {(p.parcelId ?? "—").toString().slice(0, 8)}
                      </TableCell>
                      <TableCell className="font-medium">
                        {(p.amount ?? 0).toLocaleString()} {p.currency ?? ""}
                      </TableCell>
                      <TableCell className="text-sm">
                        {(p.method ?? "—").toString().replace(/_/g, " ")}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            statusColors[
                              (p.status ?? "INIT") as PaymentStatusLocal
                            ]
                          }
                        >
                          {(p.status ?? "INIT").toString()}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {p.timestamp
                          ? new Date(p.timestamp).toLocaleString()
                          : "—"}
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
