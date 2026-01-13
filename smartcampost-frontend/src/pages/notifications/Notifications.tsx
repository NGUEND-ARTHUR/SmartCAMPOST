import { Bell } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/EmptyState";

export default function Notifications() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Notifications</h1>
        <p className="text-muted-foreground">
          Logs and templates (UI scaffold)
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={Bell}
            title="No logs loaded"
            description="Wire to /api/notifications/** when available"
          />
        </CardContent>
      </Card>
    </div>
  );
}
