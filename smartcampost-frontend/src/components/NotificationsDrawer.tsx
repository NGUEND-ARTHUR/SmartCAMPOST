import React, { useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  useMyNotifications,
  useUnreadCount,
  useMarkAsRead,
  useMarkAllAsRead,
} from "@/hooks/notifications/useNotifications";
import { useTranslation } from "react-i18next";

interface NotificationItem {
  id: string;
  subject?: string;
  message: string;
  createdAt: string;
  read: boolean;
}

export default function NotificationsDrawer() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const { data, isLoading } = useMyNotifications(0, 20);
  const { data: unreadCount } = useUnreadCount();
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();

  return (
    <div className="relative">
      <Button variant="ghost" onClick={() => setOpen((s) => !s)}>
        <Bell className="w-5 h-5" />
        {typeof unreadCount === "number" && unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </Button>
      {open && (
        <div className="absolute right-0 mt-2 w-96 z-50">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle>{t("notifications.title")}</CardTitle>
              {data?.content && data.content.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => markAllAsRead.mutate()}
                  disabled={markAllAsRead.isPending}
                >
                  {t("notifications.markAllAsRead")}
                </Button>
              )}
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
                    <li
                      key={n.id}
                      className={`p-2 border rounded cursor-pointer transition-colors ${
                        n.read
                          ? "bg-background"
                          : "bg-blue-50 dark:bg-blue-950"
                      }`}
                      onClick={() => {
                        if (!n.read) markAsRead.mutate(n.id);
                      }}
                    >
                      <div className="flex items-center gap-2">
                        {!n.read && (
                          <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                        )}
                        <div className="text-sm font-medium">
                          {n.subject || "Notification"}
                        </div>
                      </div>
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
