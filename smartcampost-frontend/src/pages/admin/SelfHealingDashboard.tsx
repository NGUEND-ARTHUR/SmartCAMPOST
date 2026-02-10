import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Progress } from "../../components/ui/progress";
import {
  AlertTriangle,
  RefreshCw,
  Bell,
  Route,
  Activity,
  CheckCircle,
} from "lucide-react";
import { selfHealingService } from "../../services/ai/selfHealing.api";
import type { CongestionAlert, SelfHealingAction } from "../../types";

export default function SelfHealingDashboard() {
  const { t } = useTranslation();
  const [congestionAlerts, setCongestionAlerts] = useState<CongestionAlert[]>(
    [],
  );
  const [suggestedActions, setSuggestedActions] = useState<SelfHealingAction[]>(
    [],
  );
  const [loading, setLoading] = useState(false);
  const [executing, setExecuting] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [alerts, actions] = await Promise.all([
        selfHealingService.detectCongestion(),
        selfHealingService.getSuggestedActions(),
      ]);
      setCongestionAlerts(alerts);
      setSuggestedActions(actions);
    } catch (error) {
      console.error("Failed to fetch self-healing data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleExecuteAction = async (actionId: string) => {
    setExecuting(actionId);
    try {
      await selfHealingService.executeAction(actionId);
      // Refresh data after execution
      fetchData();
    } catch (error) {
      console.error("Failed to execute action:", error);
    } finally {
      setExecuting(null);
    }
  };

  const handleNotifyClients = async (agencyId: string, agencyName: string) => {
    try {
      const result = await selfHealingService.notifyAffectedClients(
        agencyId,
        `Due to high volume at ${agencyName}, your parcel may experience a slight delay. We apologize for any inconvenience.`,
      );
      alert(`Notified ${result.notifiedClients} clients`);
    } catch (error) {
      console.error("Failed to notify clients:", error);
    }
  };

  const getCongestionColor = (level: number) => {
    if (level >= 0.9) return "text-red-600 bg-red-100";
    if (level >= 0.7) return "text-orange-600 bg-orange-100";
    return "text-green-600 bg-green-100";
  };

  const getCongestionLabel = (level: number) => {
    if (level >= 0.9) return "Critical";
    if (level >= 0.7) return "High";
    if (level >= 0.5) return "Medium";
    return "Normal";
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {t("selfHealing.title", "Self-Healing Dashboard")}
          </h1>
          <p className="text-muted-foreground">
            {t(
              "selfHealing.description",
              "Monitor and manage system health automatically",
            )}
          </p>
        </div>
        <Button onClick={fetchData} disabled={loading}>
          <RefreshCw
            className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
          />
          {t("common.refresh", "Refresh")}
        </Button>
      </div>

      {/* Congestion Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            {t("selfHealing.congestionAlerts", "Congestion Alerts")}
          </CardTitle>
          <CardDescription>
            {t(
              "selfHealing.congestionDescription",
              "Agencies with high parcel volumes",
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {congestionAlerts.length === 0 ? (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              {t("selfHealing.noCongestion", "All agencies operating normally")}
            </div>
          ) : (
            <div className="space-y-4">
              {congestionAlerts.map((alert) => (
                <div
                  key={alert.agencyId}
                  className="border rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{alert.agencyName}</h3>
                      <p className="text-sm text-muted-foreground">
                        {alert.parcelCount} / {alert.threshold} parcels
                      </p>
                    </div>
                    <Badge
                      className={getCongestionColor(alert.congestionLevel)}
                    >
                      {getCongestionLabel(alert.congestionLevel)}
                    </Badge>
                  </div>
                  <Progress
                    value={Math.min(alert.congestionLevel * 100, 100)}
                    className="h-2"
                  />
                  <div className="flex flex-wrap gap-2">
                    {alert.suggestedActions.map((action, idx) => (
                      <span
                        key={idx}
                        className="text-xs bg-muted px-2 py-1 rounded"
                      >
                        {action}
                      </span>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      handleNotifyClients(alert.agencyId, alert.agencyName)
                    }
                  >
                    <Bell className="h-4 w-4 mr-2" />
                    {t("selfHealing.notifyClients", "Notify Affected Clients")}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Suggested Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-500" />
            {t("selfHealing.suggestedActions", "Suggested Actions")}
          </CardTitle>
          <CardDescription>
            {t(
              "selfHealing.actionsDescription",
              "AI-recommended interventions",
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {suggestedActions.length === 0 ? (
            <p className="text-muted-foreground">
              {t("selfHealing.noActions", "No actions required at this time")}
            </p>
          ) : (
            <div className="space-y-4">
              {suggestedActions.map((action) => (
                <div
                  key={action.actionId}
                  className="border rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{action.actionType}</h3>
                      <p className="text-sm text-muted-foreground">
                        {action.description}
                      </p>
                    </div>
                    <Badge
                      variant={
                        action.priority === "HIGH" ? "default" : "secondary"
                      }
                    >
                      {action.priority}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{action.status}</Badge>
                    {action.requiresConfirmation && (
                      <Button
                        size="sm"
                        onClick={() => handleExecuteAction(action.actionId)}
                        disabled={executing === action.actionId}
                      >
                        {executing === action.actionId ? (
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Route className="h-4 w-4 mr-2" />
                        )}
                        {t("selfHealing.execute", "Execute")}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
