import { useMemo, useState, useEffect } from "react";
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
import type { Payment } from "@/types";
import { receiptService } from "@/services/payments/receipts.api";
import { paymentService } from "@/services/paymentService";

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
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await paymentService.getPayments();
      setPayments(data || []);
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to load payments";
      setError(errorMsg);
      console.error("Payment error:", err);
      setPayments([]);
    } finally {
      setIsLoading(false);
    }
  };

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
                          {p.createdAt
                            ? new Date(p.createdAt).toLocaleString()
                            : "—"}
                        </TableCell>
                        <TableCell>
                          {p.status === "SUCCESS" && p.parcelId ? (
                            <Button
                              size="sm"
                              onClick={async () => {
                                try {
                                  if (!p.parcelId)
                                    return alert("Parcel ID missing");
                                  const receipt =
                                    await receiptService.getByParcel(
                                      p.parcelId!,
                                    );
                                  const w = window.open("", "_blank");
                                  if (!w)
                                    return alert("Unable to open print window");
                                  const html = `
                                <html>
                                <head>
                                  <title>Receipt ${receipt.receiptNumber}</title>
                                  <style>body{font-family:Arial,Helvetica,sans-serif;padding:24px}</style>
                                </head>
                                <body>
                                  <h2>Receipt ${receipt.receiptNumber}</h2>
                                  <p><strong>Parcel:</strong> ${receipt.trackingRef || receipt.parcelId}</p>
                                  <p><strong>Delivered At:</strong> ${receipt.deliveredAt || ""}</p>
                                  <p><strong>Receiver:</strong> ${receipt.receiverName || ""}</p>
                                  <p><strong>Courier:</strong> ${receipt.courierName || ""}</p>
                                  <p><strong>Amount:</strong> ${receipt.totalAmount ?? 0} ${"XAF"}</p>
                                  <p><strong>Payment method:</strong> ${receipt.paymentMethod || ""}</p>
                                  <hr />
                                  <p>Generated: ${receipt.generatedAt || ""}</p>
                                  ${receipt.pdfUrl ? `<p><a href="${receipt.pdfUrl}" target="_blank">Open PDF</a></p>` : ""}
                                </body>
                                </html>
                              `;
                                  w.document.open();
                                  w.document.write(html);
                                  w.document.close();
                                  w.print();
                                } catch (err: unknown) {
                                  const msg =
                                    (err as { message?: string } | undefined)
                                      ?.message ??
                                    String(err ?? "Failed to load receipt");
                                  alert(msg);
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
