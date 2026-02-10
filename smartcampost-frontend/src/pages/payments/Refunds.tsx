import { useState } from "react";
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
  const [page, setPage] = useState(0);
  const { data, isLoading, error } = useFinanceRefunds(page, 20);
  const updateStatus = useFinanceUpdateRefundStatus();

  const refunds = data?.content ?? [];
  const totalPages = data?.totalPages ?? 0;

  const handleApprove = (id: string) => {
    updateStatus.mutate(
      { refundId: id, status: "APPROVED" },
      {
        onSuccess: () => toast.success("Refund approved"),
        onError: (err) =>
          toast.error(err instanceof Error ? err.message : "Failed to approve"),
      },
    );
  };

  const handleReject = (id: string) => {
    updateStatus.mutate(
      { refundId: id, status: "REJECTED" },
      {
        onSuccess: () => toast.success("Refund rejected"),
        onError: (err) =>
          toast.error(err instanceof Error ? err.message : "Failed to reject"),
      },
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Refunds</h1>
        <p className="text-muted-foreground">Manage refund requests</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Refund Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <EmptyState
              icon={Receipt}
              title="Error loading refunds"
              description={
                error instanceof Error ? error.message : "An error occurred"
              }
            />
          ) : refunds.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title="No refunds"
              description="Refund requests will appear here"
            />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Refund ID</TableHead>
                    <TableHead>Payment ID</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
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
                              Approve
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleReject(refund.id)}
                              disabled={updateStatus.isPending}
                            >
                              Reject
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
