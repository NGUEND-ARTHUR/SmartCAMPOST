import { useMemo, useState } from "react";
import { Search, Receipt } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/EmptyState";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { receiptService } from "@/services/payments/receipts.api";
import { usePayments } from "@/hooks";
import { toast } from "sonner";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

const statusColors: Record<string, string> = {
  INIT: "bg-muted text-muted-foreground",
  PENDING:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  SUCCESS:
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  FAILED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  CANCELLED: "bg-muted text-muted-foreground",
};

export default function ClientPayments() {
  const [q, setQ] = useState("");
  const {
    data: paymentsResponse,
    isLoading,
    error: queryError,
  } = usePayments(0, 1000);

  const payments = useMemo(
    () => paymentsResponse?.content ?? [],
    [paymentsResponse],
  );
  const error = queryError
    ? queryError instanceof Error
      ? queryError.message
      : "Failed to load payments"
    : null;

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return payments;
    return payments.filter(
      (p) =>
        (p.id || "").toLowerCase().includes(s) ||
        (p.parcelId || "").toLowerCase().includes(s),
    );
  }, [q, payments]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Payments</h1>
        <p className="text-muted-foreground">Your payment history</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>History</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-4 bg-red-100 text-red-800 rounded-lg mb-4">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Loading payments...</p>
            </div>
          ) : (
            <>
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  className="pl-9"
                  placeholder="Search by payment or parcel ID..."
                />
              </div>

              {filtered.length === 0 ? (
                <EmptyState
                  icon={Receipt}
                  title="No payments found"
                  description="Try adjusting your search"
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Payment</TableHead>
                      <TableHead>Parcel</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.id}</TableCell>
                        <TableCell>{p.parcelId || "—"}</TableCell>
                        <TableCell>
                          {(p.amount ?? 0).toLocaleString()}{" "}
                          {p.currency || "XAF"}
                        </TableCell>
                        <TableCell>{p.method || "—"}</TableCell>
                        <TableCell>
                          <Badge
                            className={
                              statusColors[p.status || "INIT"] ||
                              statusColors.INIT
                            }
                          >
                            {p.status || "INIT"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {p.timestamp
                            ? new Date(p.timestamp).toLocaleString()
                            : "—"}
                        </TableCell>
                        <TableCell>
                          {p.status === "SUCCESS" && p.parcelId ? (
                            <Button
                              size="sm"
                              onClick={async () => {
                                try {
                                  if (!p.parcelId) {
                                    toast.error("Parcel ID missing");
                                    return;
                                  }
                                  const receipt =
                                    await receiptService.getByParcel(
                                      p.parcelId,
                                    );
                                  const w = window.open("", "_blank");
                                  if (!w) {
                                    toast.error("Unable to open print window");
                                    return;
                                  }
                                  const currency = escapeHtml(
                                    p.currency || "XAF",
                                  );
                                  const amount =
                                    receipt.totalAmount ?? p.amount ?? 0;
                                  const receiptNum = escapeHtml(
                                    String(receipt.receiptNumber ?? ""),
                                  );
                                  const trackingRef = escapeHtml(
                                    String(
                                      receipt.trackingRef ||
                                        receipt.parcelId ||
                                        "",
                                    ),
                                  );
                                  const deliveredAt = escapeHtml(
                                    String(receipt.deliveredAt || ""),
                                  );
                                  const receiverName = escapeHtml(
                                    String(receipt.receiverName || ""),
                                  );
                                  const courierName = escapeHtml(
                                    String(receipt.courierName || ""),
                                  );
                                  const paymentMethod = escapeHtml(
                                    String(receipt.paymentMethod || ""),
                                  );
                                  const generatedAt = escapeHtml(
                                    String(receipt.generatedAt || ""),
                                  );
                                  const pdfUrl =
                                    receipt.pdfUrl &&
                                    /^https?:\/\//i.test(receipt.pdfUrl)
                                      ? escapeHtml(receipt.pdfUrl)
                                      : null;
                                  const html = `
                                <html>
                                <head>
                                  <title>Receipt ${receiptNum}</title>
                                  <style>body{font-family:Arial,Helvetica,sans-serif;padding:24px}</style>
                                </head>
                                <body>
                                  <h2>Receipt ${receiptNum}</h2>
                                  <p><strong>Parcel:</strong> ${trackingRef}</p>
                                  <p><strong>Delivered At:</strong> ${deliveredAt}</p>
                                  <p><strong>Receiver:</strong> ${receiverName}</p>
                                  <p><strong>Courier:</strong> ${courierName}</p>
                                  <p><strong>Amount:</strong> ${amount} ${currency}</p>
                                  <p><strong>Payment method:</strong> ${paymentMethod}</p>
                                  <hr />
                                  <p>Generated: ${generatedAt}</p>
                                  ${pdfUrl ? `<p><a href="${pdfUrl}" target="_blank" rel="noopener noreferrer">Open PDF</a></p>` : ""}
                                </body>
                                </html>
                              `;
                                  w.document.open();
                                  w.document.write(html);
                                  w.document.close();
                                  w.focus();
                                  setTimeout(() => {
                                    try {
                                      w.print();
                                    } catch {
                                      // ignore
                                    }
                                  }, 250);
                                } catch (err) {
                                  toast.error(
                                    err instanceof Error
                                      ? err.message
                                      : "Failed to load receipt",
                                  );
                                }
                              }}
                            >
                              View / Print
                            </Button>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
