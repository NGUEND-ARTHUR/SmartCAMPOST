import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Receipt, Loader2 } from "lucide-react";
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
import { useFinanceRefunds, useFinanceUpdateRefundStatus } from "@/hooks";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  REQUESTED: "bg-yellow-100 text-yellow-800",
  APPROVED: "bg-blue-100 text-blue-800",
  PROCESSED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
};

export default function Refunds() {
  const { t } = useTranslation();
  const [page, setPage] = useState(0);
  const { data, isLoading, error } = useFinanceRefunds(page, 20);
  const updateStatus = useFinanceUpdateRefundStatus();

  const refunds = data?.content ?? [];
  const totalPages = data?.totalPages ?? 0;

  const handleApprove = (id: string) => {
    updateStatus.mutate(
      { refundId: id, status: "APPROVED" },
      {
        onSuccess: () => toast.success(t("refunds.toasts.approved")),
        onError: (err) =>
          toast.error(
            err instanceof Error
              ? err.message
              : t("refunds.toasts.approveFailed"),
          ),
      },
    );
  };

  const handleReject = (id: string) => {
    updateStatus.mutate(
      { refundId: id, status: "REJECTED" },
      {
        onSuccess: () => toast.success(t("refunds.toasts.rejected")),
        onError: (err) =>
          toast.error(
            err instanceof Error
              ? err.message
              : t("refunds.toasts.rejectFailed"),
          ),
      },
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("refunds.title")}</h1>
        <p className="text-muted-foreground">{t("refunds.subtitle")}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("refunds.requestsTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <EmptyState
              icon={Receipt}
              title={t("refunds.states.errorTitle")}
              description={
                error instanceof Error ? error.message : t("common.error")
              }
            />
          ) : refunds.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title={t("refunds.states.emptyTitle")}
              description={t("refunds.states.emptyDescription")}
            />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("refunds.table.refundId")}</TableHead>
                    <TableHead>{t("refunds.table.paymentId")}</TableHead>
                    <TableHead>{t("common.amount")}</TableHead>
                    <TableHead>{t("refunds.table.reason")}</TableHead>
                    <TableHead>{t("common.status")}</TableHead>
                    <TableHead>{t("refunds.table.created")}</TableHead>
                    <TableHead>{t("common.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {refunds.map((refund) => (
                    <TableRow key={refund.id}>
                      <TableCell className="font-medium">
                        {refund.id.slice(0, 8)}
                      </TableCell>
                      <TableCell>{refund.paymentId.slice(0, 8)}</TableCell>
                      <TableCell className="font-medium">
                        {refund.amount.toLocaleString()} {refund.currency}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {refund.reason || "-"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            statusColors[refund.status] ||
                            "bg-gray-100 text-gray-800"
                          }
                        >
                          {refund.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(refund.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {refund.status === "REQUESTED" && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleApprove(refund.id)}
                              disabled={updateStatus.isPending}
                            >
                              {t("refunds.actions.approve")}
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleReject(refund.id)}
                              disabled={updateStatus.isPending}
                            >
                              {t("refunds.actions.reject")}
                            </Button>
                          </div>
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
                    {t("refunds.pagination", {
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
    </div>
  );
}
