import { Bell, CheckCheck } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/EmptyState";
import { useMyNotifications, useMarkAllAsRead } from "@/hooks";
import { Button } from "@/components/ui/button";
import { LoadingIndicator } from "@/components/LoadingIndicator";
import { ErrorRetryWidget } from "@/components/ErrorRetryWidget";
import { format } from "date-fns";
import { toast } from "sonner";

export default function Notifications() {
  const { t } = useTranslation();
  const {
    data: notificationsData,
    isLoading,
    error,
    refetch,
  } = useMyNotifications();
  const markAllRead = useMarkAllAsRead();

  const notifications = notificationsData?.content ?? [];
  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAllRead = () => {
    markAllRead.mutate(undefined, {
      onSuccess: () => {
        toast.success(t("notifications.markedAllRead"));
        refetch();
      },
      onError: () => {
        toast.error(t("notifications.markAllReadError"));
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{t("notifications.title")}</h1>
          <p className="text-muted-foreground">
            {t("notifications.subtitle", { count: unreadCount })}
          </p>
        </div>
        {notifications.length > 0 && (
          <Button
            onClick={handleMarkAllRead}
            disabled={markAllRead.isPending || unreadCount === 0}
          >
            <CheckCheck className="w-4 h-4 mr-2" />
            {t("notifications.markAllRead")}
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("notifications.logs")}</CardTitle>
          <CardDescription>
            {t("notifications.logsDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <LoadingIndicator />
          ) : error ? (
            <ErrorRetryWidget
              message={t("notifications.errorLoading")}
              onRetry={refetch}
            />
          ) : notifications.length === 0 ? (
            <EmptyState
              icon={Bell}
              title={t("notifications.noLogs")}
              description={t("notifications.noLogsDescription")}
            />
          ) : (
            <ul className="space-y-4">
              {notifications.map((notification) => (
                <li
                  key={notification.id}
                  className={`flex items-start space-x-4 p-4 rounded-lg ${
<<<<<<< HEAD
                    notification.read
                      ? "bg-muted/50"
                      : "bg-primary/10"
=======
                    notification.read ? "bg-muted/50" : "bg-primary/10"
>>>>>>> ad71cf4 (Update SmartCAMPOST frontend and mobile modules)
                  }`}
                >
                  <div
                    className={`w-2 h-2 rounded-full mt-2 ${
                      notification.read ? "bg-muted-foreground" : "bg-primary"
                    }`}
                  ></div>
                  <div className="flex-1">
<<<<<<< HEAD
                    <p className="font-semibold">{notification.subject ?? notification.message}</p>
=======
                    <p className="font-semibold">
                      {notification.subject ?? notification.message}
                    </p>
>>>>>>> ad71cf4 (Update SmartCAMPOST frontend and mobile modules)
                    <p className="text-sm text-muted-foreground">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(notification.createdAt), "PPpp")}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
