import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import {
  Package,
  Users,
  Truck,
  AlertTriangle,
  Loader2,
  TrendingUp,
  Activity,
  Brain,
  Shield,
  DollarSign,
  UserCog,
  CheckCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useDashboardSummary } from "@/hooks";
import { getErrorMessage } from "@/lib/errorHandler";
import useScanSSE from "@/hooks/useScanSSE";
import useAiSSE from "@/hooks/useAiSSE";
import { AIInsightsWidget } from "@/components/ai/AIInsightsWidget";

/* ─── Animated Counter ─── */
function AnimatedCounter({ target, duration = 1200 }: { target: number; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<number>(0);

  useEffect(() => {
    if (target === 0) { setCount(0); return; }
    const start = ref.current;
    const diff = target - start;
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + diff * eased);
      setCount(current);
      if (progress < 1) requestAnimationFrame(animate);
      else ref.current = target;
    };
    requestAnimationFrame(animate);
  }, [target, duration]);

  return <>{count.toLocaleString()}</>;
}

/* ─── KPI Card ─── */
function KpiCard({
  icon: Icon,
  label,
  value,
  subtitle,
  color,
}: {
  icon: typeof Package;
  label: string;
  value: number;
  subtitle: string;
  color: string;
}) {
  return (
    <Card className="relative overflow-hidden transition-shadow hover:shadow-md">
      <div className={`absolute top-0 left-0 h-1 w-full ${color}`} />
      <CardContent className="pt-5 pb-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1.5">
            <p className="text-[13px] font-medium text-muted-foreground">{label}</p>
            <p className="text-3xl font-bold tracking-tight">
              <AnimatedCounter target={value} />
            </p>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>
          <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${color.replace("bg-", "bg-").replace("600", "100").replace("500", "100")} bg-opacity-10`}>
            <Icon className={`h-5 w-5 ${color.replace("bg-", "text-")}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminDashboard() {
  const { t } = useTranslation();
  const { data, isLoading, error } = useDashboardSummary();
  const metrics = data?.metrics ?? {};

  const [liveScans, setLiveScans] = useState<any[]>([]);
  const [liveAi, setLiveAi] = useState<any[]>([]);

  const onScanEvent = useCallback((evt: any) => {
    setLiveScans((prev) => [evt, ...prev].slice(0, 10));
  }, []);

  useScanSSE(onScanEvent);
  useAiSSE((evt: any) => {
    setLiveAi((prev) => [evt, ...prev].slice(0, 10));
  });

  const normalizedLiveScans = useMemo(() => {
    return liveScans.map((e) => {
      const parcelId = e?.parcelId ?? e?.parcel?.id ?? e?.parcel?.parcelId;
      const eventType = e?.eventType ?? e?.scanType ?? "SCAN";
      const timestamp = e?.timestamp ?? e?.deviceTimestamp ?? e?.syncedAt;
      const locationNote = e?.locationNote ?? e?.address ?? "";
      return { parcelId, eventType, timestamp, locationNote };
    });
  }, [liveScans]);

  return (
    <div className="space-y-6">
      {/* ─── Header ─── */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("dashboard.admin.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("dashboard.admin.systemOverview")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm">
            <Link to="/admin/finance"><DollarSign className="mr-1.5 h-4 w-4" />{t("dashboard.admin.financeDashboard")}</Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link to="/admin/users/staff"><UserCog className="mr-1.5 h-4 w-4" />{t("dashboard.admin.manageStaff", "Manage Staff")}</Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link to="/admin/risk"><Shield className="mr-1.5 h-4 w-4" />{t("dashboard.admin.riskDashboard")}</Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link to="/admin/approvals"><CheckCircle className="mr-1.5 h-4 w-4" />{t("dashboard.admin.approvals", "Approvals")}</Link>
          </Button>
        </div>
      </div>

      {/* ─── KPI Grid ─── */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <Card>
          <CardContent className="pt-6 text-center text-destructive">
            {t("dashboard.loadingError")}: {getErrorMessage(error, t)}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            icon={Package}
            label={t("dashboard.stats.totalParcels")}
            value={(metrics.totalParcels as number) ?? 0}
            subtitle={t("parcels.title")}
            color="bg-primary"
          />
          <KpiCard
            icon={Users}
            label={t("users.clients.title")}
            value={(metrics.activeUsers as number) ?? 0}
            subtitle={t("users.clients.subtitle")}
            color="bg-blue-500"
          />
          <KpiCard
            icon={Truck}
            label={t("dashboard.stats.activeCouriers")}
            value={(metrics.activeCouriers as number) ?? 0}
            subtitle={t("dashboard.stats.onDutyToday")}
            color="bg-emerald-500"
          />
          <KpiCard
            icon={AlertTriangle}
            label={t("dashboard.stats.pendingIssues")}
            value={(metrics.pendingIssues as number) ?? 0}
            subtitle={t("dashboard.stats.requireAttention")}
            color="bg-amber-500"
          />
        </div>
      )}

      <AIInsightsWidget />

      {/* ─── Live Feeds ─── */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-3">
            <Activity className="h-4 w-4 text-emerald-500" />
            <CardTitle className="text-base">{t("dashboard.admin.liveScans")}</CardTitle>
            {normalizedLiveScans.length > 0 && (
              <span className="ml-auto flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            )}
          </CardHeader>
          <CardContent>
            {normalizedLiveScans.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">{t("dashboard.admin.waitingForScans")}</p>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {normalizedLiveScans.map((e, idx) => (
                  <div
                    key={`${e.parcelId ?? ""}-${e.timestamp ?? ""}-${idx}`}
                    className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2 text-sm transition-colors hover:bg-muted"
                  >
                    <div className="flex flex-col min-w-0">
                      <span className="font-medium truncate">
                        {e.eventType}{e.parcelId ? ` · ${String(e.parcelId).slice(0, 8)}` : ""}
                      </span>
                      {e.locationNote && <span className="text-xs text-muted-foreground truncate">{e.locationNote}</span>}
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap ml-3">
                      {e.timestamp ? new Date(e.timestamp).toLocaleTimeString() : ""}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-3">
            <Brain className="h-4 w-4 text-violet-500" />
            <CardTitle className="text-base">{t("dashboard.admin.aiRuntimeEvents")}</CardTitle>
            {liveAi.length > 0 && (
              <span className="ml-auto flex h-2 w-2 rounded-full bg-violet-500 animate-pulse" />
            )}
          </CardHeader>
          <CardContent>
            {liveAi.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                {t("dashboard.admin.noAiEvents")}
              </p>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {liveAi.map((e, idx) => (
                  <div key={`${e?.type ?? "ai"}-${idx}`} className="rounded-lg bg-muted/40 px-3 py-2 text-sm">
                    <span className="font-medium">{e?.type ?? "ai"}</span>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{JSON.stringify(e?.payload ?? e)}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
