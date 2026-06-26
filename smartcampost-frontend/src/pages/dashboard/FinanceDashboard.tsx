import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { CreditCard, Receipt, TrendingUp, Wallet, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatsCard } from "@/components/StatsCard";
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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard icon={TrendingUp} label={t("financeDashboard.totalRevenue")} value={totals.totalRevenue} subtitle={t("financeDashboard.totalRevenueDesc")} accentColor="bg-emerald-500" />
        <StatsCard icon={Wallet} label={t("financeDashboard.pendingPayments")} value={totals.pending} subtitle={t("financeDashboard.pendingPaymentsDesc")} accentColor="bg-amber-500" />
        <StatsCard icon={Receipt} label={t("financeDashboard.completedTransactions")} value={totals.successCount} subtitle={t("financeDashboard.completedTransactionsDesc")} accentColor="bg-blue-500" />
        <StatsCard icon={CreditCard} label={t("common.failed")} value={totals.failedCount} subtitle={t("financeDashboard.averageValueDesc")} accentColor="bg-red-500" />
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
                error instanceof Error
                  ? error.message
                  : t("common.errorOccurred")
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
