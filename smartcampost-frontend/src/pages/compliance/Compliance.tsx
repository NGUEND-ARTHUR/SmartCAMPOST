import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FileCheck,
  Loader2,
  CheckCircle,
  XCircle,
  Download,
} from "lucide-react";
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
import {
  useComplianceAlerts,
  useResolveComplianceAlert,
  useGenerateComplianceReport,
} from "@/hooks";
import { toast } from "sonner";

const severityColors: Record<string, string> = {
  LOW: "bg-gray-100 text-gray-800",
  MEDIUM: "bg-yellow-100 text-yellow-800",
  HIGH: "bg-orange-100 text-orange-800",
  CRITICAL: "bg-red-100 text-red-800",
};

export default function Compliance() {
  const { t } = useTranslation();
  const [page, setPage] = useState(0);
  const { data, isLoading, error } = useComplianceAlerts(page, 20);
  const resolveAlert = useResolveComplianceAlert();
  const generateReport = useGenerateComplianceReport();

  const alerts = data?.content ?? [];
  const totalPages = data?.totalPages ?? 0;

  const handleResolve = (alertId: string) => {
    resolveAlert.mutate(
      {
        id: alertId,
        data: { resolution: "Resolved via compliance dashboard" },
      },
      {
        onSuccess: () => toast.success(t("compliance.toasts.alertResolved")),
        onError: (err) =>
          toast.error(
            err instanceof Error
              ? err.message
              : t("compliance.toasts.resolveFailed"),
          ),
      },
    );
  };

  const handleGenerateReport = () => {
    generateReport.mutate(
      {
        startDate: new Date(
          Date.now() - 30 * 24 * 60 * 60 * 1000,
        ).toISOString(),
        endDate: new Date().toISOString(),
      },
      {
        onSuccess: () => toast.success(t("compliance.toasts.reportStarted")),
        onError: (err) =>
          toast.error(
            err instanceof Error
              ? err.message
              : t("compliance.toasts.reportFailed"),
          ),
      },
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Compliance</h1>
          <p className="text-muted-foreground">Compliance alerts and reports</p>
        </div>
        <Button
          onClick={handleGenerateReport}
          disabled={generateReport.isPending}
        >
          <Download className="w-4 h-4 mr-2" />
          Generate Report
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Compliance Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <EmptyState
              icon={FileCheck}
              title="Error loading alerts"
              description={
                error instanceof Error ? error.message : "An error occurred"
              }
            />
          ) : alerts.length === 0 ? (
            <EmptyState
              icon={FileCheck}
              title="No compliance alerts"
              description="All clear! No compliance issues detected."
            />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Alert ID</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {alerts.map((alert) => (
                    <TableRow key={alert.id}>
                      <TableCell className="font-medium">
                        {alert.id.slice(0, 8)}
                      </TableCell>
                      <TableCell>{alert.alertType}</TableCell>
                      <TableCell>
                        <Badge
                          className={
                            severityColors[alert.severity] ||
                            "bg-gray-100 text-gray-800"
                          }
                        >
                          {alert.severity}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {alert.description}
                      </TableCell>
                      <TableCell>
                        {alert.resolved ? (
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Resolved
                          </Badge>
                        ) : (
                          <Badge className="bg-yellow-100 text-yellow-800">
                            <XCircle className="w-3 h-3 mr-1" />
                            Open
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(alert.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {!alert.resolved && (
                          <Button
                            size="sm"
                            onClick={() => handleResolve(alert.id)}
                            disabled={resolveAlert.isPending}
                          >
                            Resolve
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
