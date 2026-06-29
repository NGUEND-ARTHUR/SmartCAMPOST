import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { MapPin, Package, Scan, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDashboardSummary } from "@/hooks";
import { getErrorMessage } from "@/lib/errorHandler";
import { Loader2 } from "lucide-react";

export default function AgentDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data, isLoading, error } = useDashboardSummary();
  const metrics = data?.metrics ?? {};

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t("agentDashboard.welcome")}</h1>
          <p className="text-muted-foreground">
            {t("agentDashboard.overview")}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate("/agent/map")}>
            <MapPin className="mr-2 h-4 w-4" />
            {t("nav.map")}
          </Button>
          <Button onClick={() => navigate("/agent/scan")}>
            <Scan className="mr-2 h-4 w-4" />
            {t("agentDashboard.scanParcel")}
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
            {getErrorMessage(error, t)}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
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
                {t("agentDashboard.pendingTasksDesc", "Parcels in the system")}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t("dashboard.stats.activeUsers", "Active Users")}
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(metrics.activeUsers as number) ?? 0}
              </div>
              <p className="text-xs text-muted-foreground">
                {t("dashboard.stats.currentlyActive", "Currently active in the system")}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t("dashboard.stats.pendingIssues", "Pending Issues")}
              </CardTitle>
              <Scan className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(metrics.pendingIssues as number) ?? 0}
              </div>
              <p className="text-xs text-muted-foreground">
                {t("dashboard.stats.issuesRequiringAttention", "Issues requiring attention")}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>{t("agentDashboard.recentAssignments", "Quick Actions")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            <Button
              variant="outline"
              className="h-16 flex-col gap-1"
              onClick={() => navigate("/agent/scan")}
            >
              <Scan className="h-5 w-5" />
              <span className="text-sm">{t("agentDashboard.scanParcel")}</span>
            </Button>
            <Button
              variant="outline"
              className="h-16 flex-col gap-1"
              onClick={() => navigate("/agent/map")}
            >
              <MapPin className="h-5 w-5" />
              <span className="text-sm">{t("nav.map")}</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
