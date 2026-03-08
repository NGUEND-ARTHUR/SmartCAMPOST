import { Bell } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/EmptyState";

export default function Notifications() {
  const { t } = useTranslation();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("notifications.title")}</h1>
        <p className="text-muted-foreground">{t("notifications.subtitle")}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("notifications.logs")}</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={Bell}
            title={t("notifications.noLogs")}
            description={t("notifications.noLogsDescription")}
          />
        </CardContent>
      </Card>
    </div>
  );
}
