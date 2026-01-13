import { useMemo, useState } from "react";
import { Search, Receipt } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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

const statusColors: Record<string, string> = {
  INIT: "bg-gray-100 text-gray-800",
  PENDING: "bg-yellow-100 text-yellow-800",
  SUCCESS: "bg-green-100 text-green-800",
  FAILED: "bg-red-100 text-red-800",
  CANCELLED: "bg-gray-100 text-gray-800",
};

const mock: Payment[] = [
  {
    id: "PAY001",
    parcelId: "SCP2026001",
    amount: 4000,
    currency: "XAF",
    method: "MOBILE_MONEY",
    status: "SUCCESS",
    createdAt: "2026-01-08T10:05:00Z",
  },
  {
    id: "PAY003",
    parcelId: "SCP2026005",
    amount: 2500,
    currency: "XAF",
    method: "CASH",
    status: "PENDING",
    createdAt: "2026-01-09T16:50:00Z",
  },
];

export default function ClientPayments() {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return mock;
    return mock.filter(
      (p) =>
        (p.id || "").toLowerCase().includes(s) ||
        (p.parcelId || "").toLowerCase().includes(s),
    );
  }, [q]);

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
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.id}</TableCell>
                    <TableCell>{p.parcelId || "—"}</TableCell>
                    <TableCell>
                      {(p.amount ?? 0).toLocaleString()} {p.currency || "XAF"}
                    </TableCell>
                    <TableCell>{p.method || "—"}</TableCell>
                    <TableCell>
                      <Badge
                        className={
                          statusColors[p.status || "INIT"] || statusColors.INIT
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
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
