import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  MessageCircle,
  MapPin,
  Monitor,
  Moon,
  Package,
  Search,
  Sun,
  CheckCircle2,
  Truck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LanguageSwitcher } from "@/components/ui/languageswitcher";
import { cn } from "@/lib/utils";
import { useTheme, type ThemeMode } from "@/theme/theme";

const features = [
  {
    key: "tracking",
    icon: Package,
    tone: "bg-blue-100 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300",
  },
  {
    key: "delivery",
    icon: MapPin,
    tone:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300",
  },
  {
    key: "secure",
    icon: Truck,
    tone:
      "bg-violet-100 text-violet-700 dark:bg-violet-950/70 dark:text-violet-300",
  },
  {
    key: "support",
    icon: MessageCircle,
    tone:
      "bg-amber-100 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300",
  },
] as const;

const themeOptions: Array<{ value: ThemeMode; icon: typeof Sun }> = [
  { value: "light", icon: Sun },
  { value: "dark", icon: Moon },
  { value: "system", icon: Monitor },
];

function HeroLogisticsVisual() {
  const { t } = useTranslation();

  return (
    <div className="sc-animate-fade-up sc-delay-2 relative min-h-[26rem] overflow-hidden rounded-lg border border-border bg-card p-5 shadow-sm">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,hsl(var(--primary)/0.16),transparent_32%),radial-gradient(circle_at_82%_26%,hsl(158_64%_42%/0.15),transparent_28%),linear-gradient(135deg,hsl(var(--muted)/0.65),transparent)]" />
      <div className="relative flex h-full min-h-[23rem] flex-col justify-between">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
              {t("landing.heroVisual.liveNetwork")}
            </p>
            <p className="text-2xl font-bold text-foreground">
              {t("landing.heroVisual.route")}
            </p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-sm font-medium text-emerald-700 dark:text-emerald-300">
            <span className="sc-live-marker h-2 w-2 rounded-full bg-emerald-500 text-emerald-500" />
            {t("landing.heroVisual.gpsLive")}
          </span>
        </div>

        <div className="relative mx-auto h-56 w-full max-w-xl">
          <svg
            viewBox="0 0 520 220"
            className="absolute inset-0 h-full w-full"
            role="img"
            aria-label={t("landing.heroVisual.routeAria")}
          >
            <path
              d="M38 172 C118 72 192 124 254 82 C334 28 382 78 482 42"
              fill="none"
              stroke="hsl(var(--border))"
              strokeLinecap="round"
              strokeWidth="18"
            />
            <path
              className="sc-route-line"
              d="M38 172 C118 72 192 124 254 82 C334 28 382 78 482 42"
              fill="none"
              stroke="hsl(var(--primary))"
              strokeDasharray="10 14"
              strokeLinecap="round"
              strokeWidth="5"
            />
          </svg>

          <div className="absolute left-[5%] top-[66%] rounded-md border border-border bg-background px-3 py-2 shadow-sm">
            <p className="text-xs text-muted-foreground">
              {t("landing.heroVisual.origin")}
            </p>
            <p className="text-sm font-semibold">
              {t("landing.heroVisual.agency")}
            </p>
          </div>
          <div className="absolute left-[43%] top-[26%] rounded-md border border-border bg-background px-3 py-2 shadow-sm">
            <p className="text-xs text-muted-foreground">
              {t("landing.heroVisual.courier")}
            </p>
            <p className="text-sm font-semibold">
              {t("landing.heroVisual.eta")}
            </p>
          </div>
          <div className="absolute right-[4%] top-[4%] rounded-md border border-border bg-background px-3 py-2 shadow-sm">
            <p className="text-xs text-muted-foreground">
              {t("landing.heroVisual.destination")}
            </p>
            <p className="text-sm font-semibold">
              {t("landing.heroVisual.clientDoor")}
            </p>
          </div>

          <div className="sc-route-parcel absolute left-[7%] top-[68%] flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg">
            <Package className="h-5 w-5" />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {(["dynamicEta", "proofReady", "delayAlerts"] as const).map((key) => (
            <div
              key={key}
              className="flex items-center gap-2 rounded-md border border-border bg-background/80 px-3 py-2 text-sm font-medium"
            >
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              {t(`landing.heroVisual.${key}`)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function Landing() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { mode, setMode } = useTheme();
  const [trackingRef, setTrackingRef] = useState("");

  const trackParcel = () => {
    const trimmed = trackingRef.trim();
    if (!trimmed) return;
    navigate(`/tracking?ref=${encodeURIComponent(trimmed)}`);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="relative z-50 border-b border-border/70 bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <button
            type="button"
            className="sc-interactive flex w-fit items-center gap-2 text-left"
            onClick={() => navigate("/")}
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Package className="h-5 w-5" />
            </span>
            <span className="text-xl font-bold text-foreground sm:text-2xl">
              SmartCAMPOST
            </span>
          </button>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="grid grid-cols-3 gap-1 rounded-lg bg-muted p-1">
              {themeOptions.map(({ value, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  aria-label={t(`common.${value}`)}
                  title={t(`common.${value}`)}
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground",
                    mode === value &&
                      "bg-background text-foreground shadow-sm dark:bg-accent",
                  )}
                  onClick={() => setMode(value)}
                >
                  <Icon className="h-4 w-4" />
                </button>
              ))}
            </div>
            <LanguageSwitcher variant="default" />
            <Button variant="ghost" onClick={() => navigate("/auth/login")}>
              {t("common.login")}
            </Button>
            <Button onClick={() => navigate("/auth/register")}>
              {t("common.register")}
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden border-b border-border/70">
          <div className="absolute inset-0 -z-10 bg-linear-to-b from-primary/10 via-background to-background dark:from-primary/15" />
          <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-24">
            <div className="flex flex-col justify-center">
              <h1 className="sc-animate-fade-up max-w-4xl text-4xl font-bold leading-tight text-foreground sm:text-5xl lg:text-6xl">
                {t("landing.hero.title")}
              </h1>
              <p className="sc-animate-fade-up sc-delay-1 mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
                {t("landing.hero.subtitle")}
              </p>

              <div className="sc-animate-fade-up sc-delay-2 mt-8 max-w-xl rounded-lg border border-border bg-card p-3 shadow-sm">
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input
                    placeholder={t("parcels.trackingNumber")}
                    className="h-11 flex-1"
                    value={trackingRef}
                    onChange={(e) => setTrackingRef(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") trackParcel();
                    }}
                  />
                  <Button className="sc-interactive h-11 gap-2" onClick={trackParcel}>
                    <Search className="h-4 w-4" />
                    {t("common.search")}
                  </Button>
                </div>
              </div>

              <div className="sc-animate-fade-up sc-delay-3 mt-8 flex flex-col gap-3 sm:flex-row">
                <Button
                  size="lg"
                  className="sc-interactive h-12"
                  onClick={() => navigate("/auth/register")}
                >
                  {t("landing.hero.cta")}
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="sc-interactive h-12"
                  onClick={() => navigate("/auth/login")}
                >
                  {t("auth.signIn")}
                </Button>
              </div>
            </div>

            <HeroLogisticsVisual />
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-foreground">
            {t("landing.features.title")}
          </h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {features.map(({ key, icon: Icon, tone }) => (
              <div
                key={key}
                className="sc-interactive rounded-lg border border-border bg-card p-5"
              >
                <div
                  className={cn(
                    "mb-4 flex h-12 w-12 items-center justify-center rounded-md",
                    tone,
                  )}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-card-foreground">
                  {t(`landing.features.${key}.title`)}
                </h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {t(`landing.features.${key}.description`)}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="container mx-auto px-4 py-8 text-center text-muted-foreground">
          <p>
            &copy; {new Date().getFullYear()} SmartCAMPOST.{" "}
            {t("common.rightsReserved")}
          </p>
        </div>
      </footer>
    </div>
  );
}
