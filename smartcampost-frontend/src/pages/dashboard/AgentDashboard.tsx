import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
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

const mockTasks: AgentTask[] = [
  {
    id: "AT-1001",
    type: "PICKUP",
    parcelId: "SCP2026009",
    location: "Bonamoussadi, Douala",
    scheduledAt: "2026-01-12T09:30:00Z",
    status: "PENDING",
  },
  {
    id: "AT-1002",
    type: "DELIVERY",
    parcelId: "SCP2026003",
    location: "Bastos, Yaoundé",
    scheduledAt: "2026-01-12T11:00:00Z",
    status: "IN_PROGRESS",
  },
  {
    id: "AT-1003",
    type: "SCAN",
    parcelId: "SCP2026011",
    location: "Yaoundé Hub",
    scheduledAt: "2026-01-12T13:15:00Z",
    status: "DONE",
  },
];

export default function AgentDashboard() {
  const navigate = useNavigate();

  const metrics = useMemo(() => {
    const pending = mockTasks.filter((t) => t.status === "PENDING").length;
    const inProgress = mockTasks.filter(
      (t) => t.status === "IN_PROGRESS",
    ).length;
    const done = mockTasks.filter((t) => t.status === "DONE").length;
    return { pending, inProgress, done };
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Agent Dashboard</h1>
          <p className="text-muted-foreground">
            Your pickups, deliveries and scanning tasks
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate("/admin/scan")}>
            <Scan className="mr-2 h-4 w-4" />
            Open Scan Console
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.pending}</div>
            <p className="text-xs text-muted-foreground">
              Tasks awaiting start
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.inProgress}</div>
            <p className="text-xs text-muted-foreground">Active jobs</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Completed Today
            </CardTitle>
            <BadgeCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.done}</div>
            <p className="text-xs text-muted-foreground">Done tasks</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Today’s Task Queue</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task</TableHead>
                <TableHead>Parcel</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Scheduled</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockTasks.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.type}</TableCell>
                  <TableCell>{t.parcelId}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{t.location}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(t.scheduledAt).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Badge className={statusStyles[t.status]}>
                      {t.status.toString().replace(/_/g, " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => navigate(`/client/parcels/${t.parcelId}`)}
                    >
                      View Parcel
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
