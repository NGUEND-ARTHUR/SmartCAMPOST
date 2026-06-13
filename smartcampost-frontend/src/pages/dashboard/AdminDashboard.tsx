import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Package, Users, Truck, AlertTriangle, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useDashboardSummary } from "@/hooks";
import { getErrorMessage } from "@/lib/errorHandler";
import useScanSSE from "@/hooks/useScanSSE";
import useAiSSE from "@/hooks/useAiSSE";

export default function AdminDashboard() {
  const { t } = useTranslation();
  const { data, isLoading, error } = useDashboardSummary();
  const metrics = data?.metrics ?? {};

  const [liveScans, setLiveScans] = useState<any[]>([]);
  const [liveAi, setLiveAi] = useState<any[]>([]);

  const onScanEvent = useCallback((evt: any) => {
    setLiveScans((prev) => [evt, ...prev].slice(0, 10));
  }, []);

  useScanSSE(onScanEvent);
  useAiSSE((evt: any) => {
    setLiveAi((prev) => [evt, ...prev].slice(0, 10));
  });

  const normalizedLiveScans = useMemo(() => {
    return liveScans.map((e) => {
      const parcelId = e?.parcelId ?? e?.parcel?.id ?? e?.parcel?.parcelId;
      const eventType = e?.eventType ?? e?.scanType ?? "SCAN";
      const timestamp = e?.timestamp ?? e?.deviceTimestamp ?? e?.syncedAt;
      const locationNote = e?.locationNote ?? e?.address ?? "";
      return { parcelId, eventType, timestamp, locationNote };
    });
  }, [liveScans]);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">{t("dashboard.admin.title")}</h1>
            <p className="text-muted-foreground">
              {t("dashboard.admin.systemOverview")}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button asChild variant="default">
              <Link to="/admin/finance">
                {t("dashboard.admin.financeDashboard")}
              </Link>
            </Button>
            <Button asChild className="bg-green-600 hover:bg-green-700">
              <Link to="/admin/finance/create">
                {t("dashboard.admin.createFinance")}
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/admin/users/staff">
                {t("dashboard.admin.manageStaff", "Manage Staff")}
              </Link>
            </Button>
            <Button asChild className="bg-orange-600 hover:bg-orange-700">
              <Link to="/admin/risk">{t("dashboard.admin.riskDashboard")}</Link>
            </Button>
            <Button asChild className="bg-purple-600 hover:bg-purple-700">
              <Link to="/admin/risk/create">
                {t("dashboard.admin.createRiskAlert", "Create Risk Alert")}
              </Link>
            </Button>
            <Button asChild className="bg-red-700 hover:bg-red-800">
              <Link to="/admin/risk/create-user">
                {t("dashboard.admin.createRiskUser", "Create Risk Analyst")}
              </Link>
            </Button>
            <Button asChild className="bg-blue-600 hover:bg-blue-700">
              <Link to="/admin/approvals">
                {t("dashboard.admin.approvals", "Approvals")}
              </Link>
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <Card>
            <CardContent className="pt-6 text-center text-destructive">
              {t("dashboard.loadingError")}: {getErrorMessage(error, t)}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t("dashboard.stats.totalParcels")}
                </CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(metrics.totalParcels as number) ?? 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {t("parcels.title")}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t("users.clients.title")}
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(metrics.activeUsers as number) ?? 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {t("users.clients.subtitle")}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t("dashboard.stats.activeCouriers")}
                </CardTitle>
                <Truck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(metrics.activeCouriers as number) ?? 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {t("dashboard.stats.onDutyToday")}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t("dashboard.stats.pendingIssues")}
                </CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(metrics.pendingIssues as number) ?? 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {t("dashboard.stats.requireAttention")}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.admin.liveScans")}</CardTitle>
          </CardHeader>
          <CardContent>
            {normalizedLiveScans.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                {t("dashboard.admin.waitingForScans")}
              </div>
            ) : (
              <div className="space-y-2">
                {normalizedLiveScans.map((e, idx) => (
                  <div
                    key={`${e.parcelId ?? ""}-${e.timestamp ?? ""}-${idx}`}
                    className="flex items-center justify-between text-sm"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {e.eventType}{" "}
                        {e.parcelId
                          ? `• ${String(e.parcelId).slice(0, 8)}`
                          : ""}
                      </span>
                      {e.locationNote ? (
                        <span className="text-muted-foreground truncate max-w-xl">
                          {e.locationNote}
                        </span>
                      ) : null}
                    </div>
                    <div className="text-muted-foreground">
                      {e.timestamp
                        ? new Date(e.timestamp).toLocaleTimeString()
                        : ""}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>AI Runtime Events</CardTitle>
          </CardHeader>
          <CardContent>
            {liveAi.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                No AI events yet
              </div>
            ) : (
              <div className="space-y-2">
                {liveAi.map((e, idx) => (
                  <div key={`${e?.type ?? "ai"}-${idx}`} className="text-sm">
                    <div className="font-medium">{e?.type ?? "ai"}</div>
                    <div className="text-muted-foreground truncate max-w-xl">
                      {JSON.stringify(e?.payload ?? e)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
