import { useTranslation } from "react-i18next";
import { Sparkles, Lightbulb, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAgentStatus } from "@/hooks/ai/useAI";

const HEALTH_STYLES: Record<string, string> = {
  HEALTHY: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  DEGRADED: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  OFFLINE: "bg-muted text-muted-foreground",
};

const PRIORITY_STYLES: Record<string, string> = {
  HIGH: "border-red-300 text-red-700 dark:border-red-700 dark:text-red-400",
  MEDIUM: "border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-400",
  LOW: "border-muted-foreground/30 text-muted-foreground",
};

/**
 * Generic AI Insights card backed by GET /api/ai/agent/status.
 * Works for any authenticated role — the backend tailors recommendations
 * (courier route insights, agency congestion, risk/finance summaries, etc.)
 * Renders nothing on error so it never disrupts a dashboard if AI agents are idle.
 */
export function AIInsightsWidget() {
  const { t } = useTranslation();
  const { data, isLoading, isError } = useAgentStatus();

  if (isError) return null;

  return (
    <Card className="border-primary/20">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="h-4 w-4 text-primary" />
          {t("aiInsights.title", "AI Insights")}
        </CardTitle>
        {data?.agentHealth && (
          <Badge className={HEALTH_STYLES[data.agentHealth] || HEALTH_STYLES.OFFLINE}>
            {data.agentHealth}
          </Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {data?.summary && (
              <p className="text-sm text-muted-foreground">{data.summary}</p>
            )}
            {(data?.recommendations ?? []).map((rec, idx) => (
              <div
                key={`${rec.title}-${idx}`}
                className="flex items-start gap-3 rounded-lg border bg-muted/30 p-3"
              >
                <Lightbulb className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">{rec.title}</span>
                    {rec.priority && (
                      <Badge variant="outline" className={PRIORITY_STYLES[rec.priority] || ""}>
                        {rec.priority}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">{rec.description}</p>
                </div>
              </div>
            ))}
            {!isLoading && (data?.recommendations ?? []).length === 0 && (
              <p className="text-sm text-muted-foreground">
                {t("aiInsights.none", "No active recommendations right now.")}
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default AIInsightsWidget;
