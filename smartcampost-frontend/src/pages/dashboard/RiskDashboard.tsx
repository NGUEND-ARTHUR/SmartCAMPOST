import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  Siren,
  Loader2,
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
import { useRiskAlerts } from "@/hooks";

type Severity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
type AlertState = "OPEN" | "INVESTIGATING" | "RESOLVED";

const severityStyles: Record<Severity, string> = {
  LOW: "bg-muted text-muted-foreground",
  MEDIUM:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  HIGH: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  CRITICAL: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

const stateStyles: Record<AlertState, string> = {
  OPEN: "bg-blue-100 text-blue-800",
  INVESTIGATING: "bg-purple-100 text-purple-800",
  RESOLVED: "bg-green-100 text-green-800",
};

export default function RiskDashboard() {
  const { t } = useTranslation();
  const [page, setPage] = useState(0);
  const { data, isLoading, error } = useRiskAlerts(page, 50);
  const alerts = useMemo(() => data?.content ?? [], [data]);
  const totalPages = data?.totalPages ?? 0;

  const metrics = useMemo(() => {
    const open = alerts.filter((a) => !a.resolved).length;
    const investigating = 0; // Backend doesn't have this status
    const critical = alerts.filter((a) => a.severity === "CRITICAL").length;
    const resolved = alerts.filter((a) => a.resolved).length;
    return { open, investigating, critical, resolved };
  }, [alerts]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("riskDashboard.title")}</h1>
        <p className="text-muted-foreground">
          {t("riskDashboard.overview")}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("riskDashboard.activeAlerts")}</CardTitle>
            <ShieldAlert className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.open}</div>
            <p className="text-xs text-muted-foreground">{t("riskDashboard.activeAlertsDesc")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("riskDashboard.suspiciousActivities")}</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.investigating}</div>
            <p className="text-xs text-muted-foreground">{t("riskDashboard.suspiciousActivitiesDesc")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("riskDashboard.critical")}</CardTitle>
            <Siren className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.critical}</div>
            <p className="text-xs text-muted-foreground">{t("riskDashboard.high")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("riskDashboard.noAlerts")}</CardTitle>
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.resolved}</div>
            <p className="text-xs text-muted-foreground">{t("riskDashboard.flaggedParcelsDesc")}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("riskDashboard.recentAlerts")}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <EmptyState
              icon={ShieldAlert}
              title={t("common.errorLoading")}
              description={
                error instanceof Error ? error.message : t("common.errorOccurred")
              }
            />
          ) : alerts.length === 0 ? (
            <EmptyState
              icon={ShieldAlert}
              title={t("riskDashboard.noAlerts")}
              description={t("riskDashboard.recentAlerts")}
            />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("riskDashboard.alertId")}</TableHead>
                    <TableHead>{t("riskDashboard.flaggedParcels")}</TableHead>
                    <TableHead>{t("riskDashboard.severity")}</TableHead>
                    <TableHead>{t("riskDashboard.status")}</TableHead>
                    <TableHead>{t("riskDashboard.timestamp")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {alerts.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {a.alertType ?? a.type ?? "ALERT"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {a.id.slice(0, 8)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {a.entityId?.slice(0, 8) ?? "—"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            severityStyles[a.severity as Severity] ||
                            "bg-muted text-muted-foreground"
                          }
                        >
                          {a.severity}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            a.resolved ? stateStyles.RESOLVED : stateStyles.OPEN
                          }
                        >
                          {a.resolved ? "RESOLVED" : "OPEN"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(a.createdAt).toLocaleString()}
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
