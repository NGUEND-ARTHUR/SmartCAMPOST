import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { BadgeCheck, MapPin, Package, Scan, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { agentTaskService } from "@/services/agentService";

type TaskType = "PICKUP" | "DELIVERY" | "SCAN";
type TaskStatus = "PENDING" | "IN_PROGRESS" | "DONE" | "BLOCKED";

interface AgentTask {
  id: string;
  type: TaskType;
  parcelId: string;
  location: string;
  scheduledAt: string;
  status: TaskStatus;
}

const statusStyles: Record<TaskStatus, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  IN_PROGRESS: "bg-blue-100 text-blue-800",
  DONE: "bg-green-100 text-green-800",
  BLOCKED: "bg-red-100 text-red-800",
};

export default function AgentDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<AgentTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await agentTaskService.getAgentTasks();
      setTasks(data || []);
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to load tasks";
      setError(errorMsg);
      console.error("Agent tasks error:", err);
      setTasks([]);
    } finally {
      setIsLoading(false);
    }
  };

  const metrics = useMemo(() => {
    const pending = tasks.filter((task) => task.status === "PENDING").length;
    const inProgress = tasks.filter(
      (task) => task.status === "IN_PROGRESS",
    ).length;
    const done = tasks.filter((task) => task.status === "DONE").length;
    return { pending, inProgress, done };
  }, [tasks]);

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
          <Button variant="outline" onClick={() => navigate("/agent/scan")}>
            <Scan className="mr-2 h-4 w-4" />
            {t("agentDashboard.scanParcel")}
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-100 text-red-800 rounded-lg">{error}</div>
      )}

      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">{t("common.loading")}</p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t("agentDashboard.pendingTasks")}
                </CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.pending}</div>
                <p className="text-xs text-muted-foreground">
                  {t("agentDashboard.pendingTasksDesc")}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t("common.inProgress")}
                </CardTitle>
                <Truck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.inProgress}</div>
                <p className="text-xs text-muted-foreground">
                  {t("agentDashboard.avgDeliveryTimeDesc")}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t("agentDashboard.deliveryRate")}
                </CardTitle>
                <BadgeCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.done}</div>
                <p className="text-xs text-muted-foreground">
                  {t("agentDashboard.deliveryRateDesc")}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{t("agentDashboard.recentAssignments")}</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("agentDashboard.parcelId")}</TableHead>
                    <TableHead>{t("common.parcel")}</TableHead>
                    <TableHead>{t("agentDashboard.destination")}</TableHead>
                    <TableHead>{t("agentDashboard.assignedDate")}</TableHead>
                    <TableHead>{t("agentDashboard.status")}</TableHead>
                    <TableHead>{t("common.action")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tasks.map((task) => (
                    <TableRow key={task.id}>
                      <TableCell className="font-medium">{task.type}</TableCell>
                      <TableCell>{task.parcelId}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span>{task.location}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(task.scheduledAt).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge className={statusStyles[task.status]}>
                          {task.status.toString().replace(/_/g, " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            navigate(`/staff/parcels/${task.parcelId}`)
                          }
                        >
                          {t("agentDashboard.viewAll")}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
