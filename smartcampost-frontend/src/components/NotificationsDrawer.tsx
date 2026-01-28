import React, { useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNotifications } from "@/hooks/notifications/useNotifications";

export default function NotificationsDrawer() {
  const [open, setOpen] = useState(false);
  const { data, isLoading } = useNotifications(0, 20);

  return (
    <div className="relative">
      <Button variant="ghost" onClick={() => setOpen((s) => !s)}>
        <Bell className="w-5 h-5" />
      </Button>
      {open && (
        <div className="absolute right-0 mt-2 w-96 z-50">
          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-sm text-muted-foreground">Loading…</div>
              ) : (
                <ul className="space-y-2 max-h-64 overflow-auto">
                  {data?.content?.length === 0 && (
                    <li className="text-sm text-muted-foreground">
                      No notifications
                    </li>
                  )}
                  {data?.content?.map((n: any) => (
                    <li key={n.id} className="p-2 border rounded">
                      <div className="text-sm font-medium">{n.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {n.message}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(n.createdAt).toLocaleString()}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
