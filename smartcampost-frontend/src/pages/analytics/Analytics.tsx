import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Clock,
  AlertTriangle,
  Search,
  Loader2,
  Package,
  CreditCard,
  TrendingUp,
  MapPin,
  BarChart3,
} from "lucide-react";
import { toast } from "sonner";
import { analyticsService } from "@/services";
import type { DemandForecastResponse } from "@/services/analytics/analytics.api";

interface ETAResult {
  parcelId: string;
  estimatedDelivery: string;
  currentLocation: string;
  status: string;
  confidence: number;
}

interface AnomalyResult {
  paymentId: string;
  riskScore: number;
  anomalyType: string;
  details: string;
  recommendation: string;
}

export default function Analytics() {
  const { t } = useTranslation();
  const [parcelId, setParcelId] = useState("");
  const [paymentId, setPaymentId] = useState("");
  const [etaLoading, setEtaLoading] = useState(false);
  const [anomalyLoading, setAnomalyLoading] = useState(false);
  const [etaResult, setEtaResult] = useState<ETAResult | null>(null);
  const [anomalyResult, setAnomalyResult] = useState<AnomalyResult | null>(
    null,
  );
  const [forecastRegion, setForecastRegion] = useState("");
  const [forecastDays, setForecastDays] = useState("7");
  const [forecastLoading, setForecastLoading] = useState(false);
  const [forecastResult, setForecastResult] =
    useState<DemandForecastResponse | null>(null);

  const handleEtaSearch = async () => {
    if (!parcelId.trim()) {
      toast.error(t("analytics.toasts.enterParcelId"));
      return;
    }
    setEtaLoading(true);
    setEtaResult(null);

    try {
      const resp = await analyticsService.predictEta(parcelId.trim());
      const confidence =
        Math.round(((resp.confidence ?? 0) * 100 + Number.EPSILON) * 100) / 100;
      setEtaResult({
        parcelId: resp.trackingRef || resp.parcelId || parcelId,
        estimatedDelivery: resp.predictedDeliveryAt
          ? new Date(resp.predictedDeliveryAt).toLocaleString()
          : "—",
        currentLocation: resp.lastLocationNote || "—",
        status: resp.lastEventType || "—",
        confidence: Math.max(0, Math.min(100, Math.round(confidence))),
      });
      toast.success(t("analytics.toasts.etaSuccess"));
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : t("analytics.toasts.etaFailed"),
      );
    } finally {
      setEtaLoading(false);
    }
  };

  const handleAnomalyCheck = async () => {
    if (!paymentId.trim()) {
      toast.error(t("analytics.toasts.enterPaymentId"));
      return;
    }
    setAnomalyLoading(true);
    setAnomalyResult(null);

    try {
      const resp = await analyticsService.checkPaymentAnomaly(paymentId.trim());
      const score =
        Math.round(((resp.score ?? 0) * 100 + Number.EPSILON) * 100) / 100;
      const riskScore = Math.max(0, Math.min(100, Math.round(score)));
      setAnomalyResult({
        paymentId: paymentId,
        riskScore,
        anomalyType: resp.anomalous ? "ANOMALOUS" : "NORMAL",
        details: resp.reason || t("analytics.anomaly.noDetails"),
        recommendation: resp.anomalous
          ? t("analytics.anomaly.recommendations.manualReview")
          : t("analytics.anomaly.recommendations.proceed"),
      });
      toast.success(t("analytics.toasts.anomalySuccess"));
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : t("analytics.toasts.anomalyFailed"),
      );
    } finally {
      setAnomalyLoading(false);
    }
  };

  const handleForecast = async () => {
    setForecastLoading(true);
    setForecastResult(null);
    try {
      const days = Math.max(1, Math.min(30, parseInt(forecastDays, 10) || 7));
      const resp = await analyticsService.forecastDemand({
        region: forecastRegion.trim() || undefined,
        forecastDays: days,
      });
      setForecastResult(resp);
      toast.success(
        t("analytics.toasts.forecastSuccess", "Forecast generated"),
      );
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : t("analytics.toasts.forecastFailed", "Failed to generate forecast"),
      );
    } finally {
      setForecastLoading(false);
    }
  };

  const getTrendBadge = (trend: string) => {
    if (trend === "INCREASING")
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
    if (trend === "DECREASING")
      return "bg-muted text-muted-foreground";
    return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400";
  };

  const getDemandLevelBadge = (level: string) => {
    switch (level) {
      case "PEAK":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      case "HIGH":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400";
      case "LOW":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getRiskBadge = (score: number) => {
    if (score > 70)
      return (
        <Badge className="bg-red-100 text-red-800">
          {t("analytics.anomaly.risk.high")}
        </Badge>
      );
    if (score > 40)
      return (
        <Badge className="bg-yellow-100 text-yellow-800">
          {t("analytics.anomaly.risk.medium")}
        </Badge>
      );
    return (
      <Badge className="bg-green-100 text-green-800">
        {t("analytics.anomaly.risk.low")}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("analytics.page.title")}</h1>
        <p className="text-muted-foreground">{t("analytics.page.subtitle")}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* ETA Panel */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              <CardTitle>{t("analytics.eta.title")}</CardTitle>
            </div>
            <CardDescription>{t("analytics.eta.description")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1">
                <Label htmlFor="parcelId" className="sr-only">
                  {t("analytics.eta.parcelIdLabel")}
                </Label>
                <Input
                  id="parcelId"
                  placeholder={t("analytics.eta.parcelIdPlaceholder")}
                  value={parcelId}
                  onChange={(e) => setParcelId(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleEtaSearch()}
                />
              </div>
              <Button onClick={handleEtaSearch} disabled={etaLoading}>
                {etaLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>

            {etaResult && (
              <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{etaResult.parcelId}</span>
                  </div>
                  <Badge className="bg-blue-100 text-blue-800">
                    {etaResult.status}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">
                      {t("analytics.eta.estimatedDelivery")}
                    </p>
                    <p className="font-medium">{etaResult.estimatedDelivery}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">
                      {t("analytics.eta.confidence")}
                    </p>
                    <div className="flex items-center gap-2">
                      <Progress
                        value={etaResult.confidence}
                        className="flex-1"
                      />
                      <span className="font-medium">
                        {etaResult.confidence}%
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    {t("analytics.eta.currentLocation")}
                  </span>
                  <span className="font-medium">
                    {etaResult.currentLocation}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Anomaly Detection Panel */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <CardTitle>{t("analytics.anomaly.title")}</CardTitle>
            </div>
            <CardDescription>
              {t("analytics.anomaly.description")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1">
                <Label htmlFor="paymentId" className="sr-only">
                  Payment ID
                </Label>
                <Input
                  id="paymentId"
                  placeholder="Enter Payment ID (e.g., PAY-67890)"
                  value={paymentId}
                  onChange={(e) => setPaymentId(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAnomalyCheck()}
                />
              </div>
              <Button onClick={handleAnomalyCheck} disabled={anomalyLoading}>
                {anomalyLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>

            {anomalyResult && (
              <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">
                      {anomalyResult.paymentId}
                    </span>
                  </div>
                  {getRiskBadge(anomalyResult.riskScore)}
                </div>
                <div className="space-y-2">
                  <div>
                    <p className="text-muted-foreground text-sm">Risk Score</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          style={{ width: `${anomalyResult.riskScore}%` }}
                          className={`h-2 rounded-full ${
                            anomalyResult.riskScore > 70
                              ? "bg-red-500"
                              : anomalyResult.riskScore > 40
                                ? "bg-yellow-500"
                                : "bg-green-500"
                          }`}
                        />
                      </div>
                      <span className="font-medium">
                        {anomalyResult.riskScore}%
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm">Analysis</p>
                    <p className="text-sm">{anomalyResult.details}</p>
                  </div>
                  <div className="flex items-start gap-2 p-2 rounded bg-background">
                    <TrendingUp className="h-4 w-4 mt-0.5 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium">Recommendation</p>
                      <p className="text-sm text-muted-foreground">
                        {anomalyResult.recommendation}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Demand Forecast Panel */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-violet-600" />
            <CardTitle>
              {t("analytics.forecast.title", "Demand Forecast")}
            </CardTitle>
          </div>
          <CardDescription>
            {t(
              "analytics.forecast.description",
              "Predict parcel volume for an agency or region over the coming days.",
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <div className="flex-1 min-w-[180px]">
              <Label htmlFor="forecastRegion" className="sr-only">
                {t("analytics.forecast.regionLabel", "Region")}
              </Label>
              <Input
                id="forecastRegion"
                placeholder={t(
                  "analytics.forecast.regionPlaceholder",
                  "Region (e.g., Littoral) — leave blank for all",
                )}
                value={forecastRegion}
                onChange={(e) => setForecastRegion(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleForecast()}
              />
            </div>
            <div className="w-24">
              <Label htmlFor="forecastDays" className="sr-only">
                {t("analytics.forecast.daysLabel", "Days")}
              </Label>
              <Input
                id="forecastDays"
                type="number"
                min={1}
                max={30}
                placeholder="7"
                value={forecastDays}
                onChange={(e) => setForecastDays(e.target.value)}
              />
            </div>
            <Button onClick={handleForecast} disabled={forecastLoading}>
              {forecastLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>

          {forecastResult && (
            <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="font-medium">
                  {forecastResult.agencyName ||
                    forecastResult.region ||
                    t("analytics.forecast.allAgencies", "All agencies")}
                </span>
                <Badge className={getTrendBadge(forecastResult.trend)}>
                  {forecastResult.trend}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
                <div>
                  <p className="text-muted-foreground">
                    {t("analytics.forecast.backlog", "Current Backlog")}
                  </p>
                  <p className="font-medium">
                    {forecastResult.currentBacklog}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">
                    {t("analytics.forecast.avgDaily", "Avg Daily Volume")}
                  </p>
                  <p className="font-medium">
                    {forecastResult.averageDailyVolume}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">
                    {t("analytics.forecast.confidence", "Confidence")}
                  </p>
                  <p className="font-medium">
                    {Math.round(forecastResult.confidenceScore * 100)}%
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2 p-2 rounded bg-background">
                <TrendingUp className="h-4 w-4 mt-0.5 text-blue-600" />
                <p className="text-sm text-muted-foreground">
                  {forecastResult.recommendation}
                </p>
              </div>
              <div className="space-y-1.5 max-h-64 overflow-y-auto">
                {forecastResult.forecasts.map((f) => (
                  <div
                    key={f.date}
                    className="flex items-center justify-between rounded-lg bg-background px-3 py-2 text-sm"
                  >
                    <span>{new Date(f.date).toLocaleDateString()}</span>
                    <span className="font-medium">
                      {f.predictedVolume}{" "}
                      {t("analytics.forecast.parcels", "parcels")}
                    </span>
                    <Badge className={getDemandLevelBadge(f.demandLevel)}>
                      {f.demandLevel}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
