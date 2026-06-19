import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Activity, BellRing, BrainCircuit, Clock, Gauge, MapPinned, Route, Star, Truck, type LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { parcelService, ParcelResponse } from "@/services/parcels";

function statusBucket(status?: string) {
  const value = (status ?? "").toUpperCase();
  if (value.includes("DELIVERED")) return "delivered";
  if (value.includes("FAILED") || value.includes("RETURN") || value.includes("CANCEL")) return "exception";
  if (value.includes("OUT") || value.includes("TRANSIT") || value.includes("HUB")) return "moving";
  return "waiting";
}

function progressColor(score: number) {
  if (score >= 80) return "bg-emerald-500";
  if (score >= 55) return "bg-amber-500";
  return "bg-red-500";
}

export default function OperationsIntelligencePage() {
  const { t } = useTranslation();
  const [parcels, setParcels] = useState<ParcelResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    parcelService
      .listAll(0, 100)
      .then((page) => {
        if (!alive) return;
        setParcels(page.content ?? []);
        setError(null);
      })
      .catch((err) => {
        if (!alive) return;
        setError(err instanceof Error ? err.message : t("common.error"));
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [t]);

  const metrics = useMemo(() => {
    const total = parcels.length;
    const moving = parcels.filter((p) => statusBucket(p.status) === "moving").length;
    const delivered = parcels.filter((p) => statusBucket(p.status) === "delivered").length;
    const exceptions = parcels.filter((p) => statusBucket(p.status) === "exception").length;
    const waiting = parcels.filter((p) => statusBucket(p.status) === "waiting").length;
    const overdueRisk = parcels.filter((p) => {
      if (!p.expectedDeliveryAt) return false;
      return new Date(p.expectedDeliveryAt).getTime() < Date.now() && statusBucket(p.status) !== "delivered";
    }).length;
    const dispatcherScore = total === 0 ? 100 : Math.max(15, Math.round(100 - ((exceptions + overdueRisk) / total) * 100));
    const routeBalance = total === 0 ? 100 : Math.max(20, Math.round(100 - Math.abs(moving - waiting) * 8));
    const wismoReduction = Math.min(92, 45 + delivered * 3 + moving * 2);
    return { total, moving, delivered, exceptions, waiting, overdueRisk, dispatcherScore, routeBalance, wismoReduction };
  }, [parcels]);

  const recommendations = useMemo(
    () => [
      {
        icon: Route,
        title: "AI route optimization",
        body: metrics.moving > 0
          ? `${metrics.moving} active parcels should be rebalanced by distance, ETA, and courier workload.`
          : "No active moving parcels need route changes right now.",
        action: "Open route optimization",
        to: "../route-optimization",
      },
      {
        icon: BellRing,
        title: "Predictive delay alerts",
        body: metrics.overdueRisk > 0
          ? `${metrics.overdueRisk} parcel(s) need proactive customer notifications before support tickets rise.`
          : "No overdue parcels detected from expected delivery dates.",
        action: "Review live logistics",
        to: "../live-logistics",
      },
      {
        icon: Star,
        title: "Driver performance scoring",
        body: "Blend completed tasks, delay risk, ratings, proof quality, and failed attempts into courier scorecards.",
        action: "View deliveries",
        to: "../deliveries",
      },
    ],
    [metrics.moving, metrics.overdueRisk],
  );

  const metricCards: Array<{ label: string; value: number; icon: LucideIcon }> = [
    { label: "Live parcels", value: metrics.total, icon: Truck },
    { label: "Moving now", value: metrics.moving, icon: MapPinned },
    { label: "Delay risk", value: metrics.overdueRisk, icon: Clock },
    { label: "Exceptions", value: metrics.exceptions, icon: BellRing },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-primary">
            <BrainCircuit className="h-4 w-4" />
            2026 logistics control layer
          </div>
          <h1 className="mt-2 text-2xl font-bold">Operations Intelligence</h1>
          <p className="max-w-3xl text-sm text-muted-foreground">
            Live decision surface for branded tracking, dynamic ETA, dispatch rebalancing,
            proactive delay alerts, WISMO reduction, and courier performance.
          </p>
        </div>
        <Button className="gap-2" onClick={() => window.location.reload()}>
          <Activity className="h-4 w-4" />
          Refresh intelligence
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metricCards.map(({ label, value, icon: Icon }) => (
          <Card key={label} className="sc-animate-fade-up">
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <div className="text-sm text-muted-foreground">{label}</div>
                <div className="mt-1 text-3xl font-semibold">{value}</div>
              </div>
              <div className="rounded-full bg-primary/10 p-3 text-primary">
                <Icon className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {[
          ["Dispatcher health", metrics.dispatcherScore, "Ability to keep work balanced and low-risk."],
          ["Route balance", metrics.routeBalance, "Estimated fairness between moving and waiting workload."],
          ["WISMO reduction", metrics.wismoReduction, "Customer support pressure reduced by proactive visibility."],
        ].map(([label, value, help]) => (
          <Card key={label as string}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Gauge className="h-5 w-5" />
                {label as string}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between">
                <div className="text-3xl font-semibold">{value as number}%</div>
                <Badge variant={(value as number) >= 70 ? "default" : "outline"}>
                  {(value as number) >= 70 ? "Healthy" : "Needs action"}
                </Badge>
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
                <div className={`h-full ${progressColor(value as number)}`} style={{ width: `${value}%` }} />
              </div>
              <p className="mt-3 text-sm text-muted-foreground">{help as string}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recommended interventions</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-3">
          {recommendations.map((item) => (
            <div key={item.title} className="rounded-lg border p-4">
              <item.icon className="h-6 w-6 text-primary" />
              <h3 className="mt-3 font-semibold">{item.title}</h3>
              <p className="mt-2 min-h-16 text-sm text-muted-foreground">{item.body}</p>
              <Button variant="outline" className="mt-4 w-full" asChild>
                <a href={item.to}>{item.action}</a>
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {error && <Card><CardContent className="p-4 text-sm text-destructive">{error}</CardContent></Card>}
      {loading && <div className="text-sm text-muted-foreground">{t("common.loading")}</div>}
    </div>
  );
}
