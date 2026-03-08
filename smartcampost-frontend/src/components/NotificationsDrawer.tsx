import React, { useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNotifications } from "@/hooks/notifications/useNotifications";
import { useTranslation } from "react-i18next";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  createdAt: string;
}

export default function NotificationsDrawer() {
  const { t } = useTranslation();
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
              <CardTitle>{t("notifications.title")}</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-sm text-muted-foreground">
                  {t("common.loading")}
                </div>
              ) : (
                <ul className="space-y-2 max-h-64 overflow-auto">
                  {data?.content?.length === 0 && (
                    <li className="text-sm text-muted-foreground">
                      {t("notifications.noNotifications")}
                    </li>
                  )}
                  {data?.content?.map((n: NotificationItem) => (
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
