import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ShieldAlert, Loader2, AlertTriangle, User } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import EmptyState from "@/components/EmptyState";
import { useRiskAlerts, useUpdateRiskAlert, useRiskFreezeUser } from "@/hooks";
import { toast } from "sonner";

const severityColors: Record<string, string> = {
  LOW: "bg-green-100 text-green-800",
  MEDIUM: "bg-yellow-100 text-yellow-800",
  HIGH: "bg-orange-100 text-orange-800",
  CRITICAL: "bg-red-100 text-red-800",
};

export default function RiskAlerts() {
  const { t } = useTranslation();
  const [page, setPage] = useState(0);
  const { data, isLoading, error } = useRiskAlerts(page, 20);
  const freezeUser = useRiskFreezeUser();

  const alerts = data?.content ?? [];
  const totalPages = data?.totalPages ?? 0;

  const handleFreezeUser = (userId: string) => {
    freezeUser.mutate(
      { userId, frozen: true },
      {
        onSuccess: () => toast.success("User account frozen"),
        onError: (err) =>
          toast.error(
            err instanceof Error ? err.message : "Failed to freeze user",
          ),
      },
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Risk Alerts</h1>
        <p className="text-muted-foreground">
          Review suspicious activity and operational risk signals.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Alerts</CardTitle>
          <CardDescription>
            New and escalated alerts appear here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <EmptyState
              icon={ShieldAlert}
              title="Error loading alerts"
              description={
                error instanceof Error ? error.message : "An error occurred"
              }
            />
          ) : alerts.length === 0 ? (
            <EmptyState
              icon={ShieldAlert}
              title="No alerts yet"
              description="Risk alerts will appear here when detected."
            />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Severity</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Parcel</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {alerts.map((alert) => (
                    <TableRow key={alert.id}>
                      <TableCell>
                        <Badge
                          className={
                            severityColors[alert.severity] ||
                            "bg-gray-100 text-gray-800"
                          }
                        >
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          {alert.severity}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {alert.description}
                      </TableCell>
                      <TableCell>
                        {alert.entityType === "USER" && alert.entityId
                          ? alert.entityId.slice(0, 8)
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {alert.entityType === "PARCEL" && alert.entityId
                          ? alert.entityId.slice(0, 8)
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {alert.resolved ? "RESOLVED" : "OPEN"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(alert.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {alert.entityType === "USER" && alert.entityId && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleFreezeUser(alert.entityId!)}
                            disabled={freezeUser.isPending}
                          >
                            <User className="w-3 h-3 mr-1" />
                            Freeze
                          </Button>
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
