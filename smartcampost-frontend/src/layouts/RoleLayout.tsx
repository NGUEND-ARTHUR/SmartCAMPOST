import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { AnimatePresence } from "framer-motion";
import { PageTransition } from "@/components/PageTransition";
import {
  Menu,
  X,
  Search,
  Package,
  Moon,
  Sun,
  Monitor,
  LogOut,
  ChevronRight,
} from "lucide-react";
import type { AppRole } from "@/lib/routeByRole";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/ui/languageswitcher";
import NotificationsDrawer from "@/components/NotificationsDrawer";
import { useAuthStore } from "@/store/authStore";
import { useTheme } from "@/theme/theme";

type NavItem = { to: string; labelKey: string };

const navByRole: Record<AppRole, NavItem[]> = {
  CLIENT: [
    { to: "/client", labelKey: "nav.dashboard" },
    { to: "/client/parcels/new", labelKey: "nav.newParcel" },
    { to: "/client/parcels", labelKey: "nav.myParcels" },
    { to: "/client/map", labelKey: "nav.map" },
    { to: "/client/tracking", labelKey: "nav.tracking" },
    { to: "/client/pickups", labelKey: "nav.pickups" },
    { to: "/client/payments", labelKey: "nav.payments" },
    { to: "/client/invoices", labelKey: "nav.invoices" },
    { to: "/client/addresses", labelKey: "nav.addresses" },
    { to: "/client/support", labelKey: "nav.support" },
    { to: "/client/settings", labelKey: "nav.settings" },
  ],
  AGENT: [
    { to: "/agent", labelKey: "nav.dashboard" },
    { to: "/agent/parcels/new", labelKey: "nav.newParcel" },
    { to: "/agent/parcels", labelKey: "nav.parcels" },
    { to: "/agent/pickups", labelKey: "nav.pickups" },
    { to: "/agent/map", labelKey: "nav.map" },
    { to: "/agent/scan", labelKey: "nav.scanConsole" },
    { to: "/agent/delivery-tools", labelKey: "nav.deliveryTools" },
    { to: "/agent/profile", labelKey: "nav.profile" },
  ],
  COURIER: [
    { to: "/courier", labelKey: "nav.dashboard" },
    { to: "/courier/map", labelKey: "nav.map" },
    { to: "/courier/pickups", labelKey: "nav.myPickups" },
    { to: "/courier/deliveries", labelKey: "nav.myDeliveries" },
    { to: "/courier/deliveries/failed", labelKey: "nav.failedDelivery" },
    { to: "/courier/scan", labelKey: "nav.scanConsole" },
    { to: "/courier/profile", labelKey: "nav.profile" },
  ],
  STAFF: [
    { to: "/staff", labelKey: "nav.dashboard" },
    { to: "/staff/map", labelKey: "nav.map" },
    { to: "/staff/gps-trackers", labelKey: "nav.gpsTrackers" },
    { to: "/staff/parcels", labelKey: "nav.parcels" },
    { to: "/staff/tracking", labelKey: "nav.tracking" },
    { to: "/staff/pickups", labelKey: "nav.pickups" },
    { to: "/staff/deliveries", labelKey: "nav.deliveries" },
    { to: "/staff/payments", labelKey: "nav.payments" },
    { to: "/staff/support", labelKey: "nav.support" },
    { to: "/staff/scan", labelKey: "nav.scanConsole" },
    { to: "/staff/notifications", labelKey: "nav.notifications" },
    { to: "/staff/analytics", labelKey: "nav.analytics" },
    { to: "/staff/advanced-analytics", labelKey: "nav.advancedAnalytics" },
    { to: "/staff/operations-intelligence", labelKey: "nav.operationsIntelligence" },
    { to: "/staff/ai-discovery", labelKey: "nav.aiDiscovery" },
    { to: "/staff/integrations", labelKey: "nav.integrations" },
    { to: "/staff/profile", labelKey: "nav.profile" },
  ],
  ADMIN: [
    { to: "/admin", labelKey: "nav.dashboard" },
    { to: "/admin/map", labelKey: "nav.map" },
    { to: "/admin/gps-trackers", labelKey: "nav.gpsTrackers" },
    { to: "/admin/parcels", labelKey: "nav.parcels" },
    { to: "/admin/pickups", labelKey: "nav.pickups" },
    { to: "/admin/deliveries", labelKey: "nav.deliveries" },
    { to: "/admin/payments", labelKey: "nav.payments" },
    { to: "/admin/support", labelKey: "nav.support" },
    { to: "/admin/tracking", labelKey: "nav.tracking" },
    { to: "/admin/scan", labelKey: "nav.scanConsole" },
    { to: "/admin/staff", labelKey: "nav.staffDashboard" },
    { to: "/admin/users/staff", labelKey: "nav.staffManagement" },
    { to: "/admin/users/agents", labelKey: "nav.agentManagement" },
    { to: "/admin/users/couriers", labelKey: "nav.courierManagement" },
    { to: "/admin/users/agencies", labelKey: "nav.agencyManagement" },
    { to: "/admin/users/clients", labelKey: "nav.clientManagement" },
    { to: "/admin/tariffs", labelKey: "nav.tariffManagement" },
    { to: "/admin/integrations", labelKey: "nav.integrations" },
    { to: "/admin/accounts", labelKey: "nav.userAccounts" },
    { to: "/admin/self-healing", labelKey: "nav.selfHealing" },
    { to: "/admin/approvals", labelKey: "nav.approvals" },
    { to: "/admin/notifications", labelKey: "nav.notifications" },
    { to: "/admin/analytics", labelKey: "nav.analytics" },
    { to: "/admin/advanced-analytics", labelKey: "nav.advancedAnalytics" },
    { to: "/admin/operations-intelligence", labelKey: "nav.operationsIntelligence" },
    { to: "/admin/ai-discovery", labelKey: "nav.aiDiscovery" },
    { to: "/admin/profile", labelKey: "nav.profile" },
  ],
  FINANCE: [
    { to: "/finance", labelKey: "nav.dashboard" },
    { to: "/finance/map", labelKey: "nav.map" },
    { to: "/finance/payments", labelKey: "nav.payments" },
    { to: "/finance/refunds", labelKey: "nav.refunds" },
    { to: "/finance/invoices", labelKey: "nav.invoices" },
    { to: "/finance/exceptions", labelKey: "nav.exceptions" },
    { to: "/finance/analytics", labelKey: "nav.analytics" },
    { to: "/finance/notifications", labelKey: "nav.notifications" },
    { to: "/finance/profile", labelKey: "nav.profile" },
  ],
  RISK: [
    { to: "/risk", labelKey: "nav.dashboard" },
    { to: "/risk/map", labelKey: "nav.map" },
    { to: "/risk/alerts", labelKey: "nav.riskAlerts" },
    { to: "/risk/compliance", labelKey: "nav.compliance" },
    { to: "/risk/cases", labelKey: "nav.cases" },
    { to: "/risk/integrations", labelKey: "nav.integrations" },
    { to: "/risk/analytics", labelKey: "nav.analytics" },
    { to: "/risk/notifications", labelKey: "nav.notifications" },
    { to: "/risk/profile", labelKey: "nav.profile" },
  ],
};

const themeIcons = { system: Monitor, light: Sun, dark: Moon } as const;

export function RoleLayout({ role }: { role: AppRole }) {
  const { logout, user } = useAuthStore();
  const { t } = useTranslation();
  const { mode, setMode } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [quickTrack, setQuickTrack] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  const submitQuickTrack = () => {
    const ref = quickTrack.trim();
    if (!ref) return;
    navigate(`/tracking?ref=${encodeURIComponent(ref)}`);
    setQuickTrack("");
  };

  const initials = (user?.name || "U")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const sidebarContent = (
    <>
      {/* Brand header */}
      <div className="mb-6 flex items-center gap-3 px-1">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Package className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-base font-bold tracking-tight">SmartCAMPOST</div>
          <div className="truncate text-xs text-muted-foreground">
            {t(`users.roles.${role.toLowerCase()}`)}
          </div>
        </div>
      </div>

      {/* User card */}
      <div className="mb-4 flex items-center gap-3 rounded-xl bg-muted/50 p-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold">{user?.name || "—"}</div>
          <div className="truncate text-xs text-muted-foreground">
            {user?.email || user?.phone || "—"}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto pr-1">
        {navByRole[role].map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === `/${role.toLowerCase()}`}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `group flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-150 ${
                isActive
                  ? "bg-primary/10 text-primary border-l-[3px] border-primary pl-2"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`
            }
          >
            <ChevronRight className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-50" />
            <span className="truncate">
              {t(item.labelKey, {
                defaultValue: item.labelKey.replace("nav.", ""),
              })}
            </span>
          </NavLink>
        ))}
      </nav>

      {/* Footer controls */}
      <div className="mt-auto space-y-3 border-t border-border pt-4">
        {/* Theme switcher */}
        <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
          {(["system", "light", "dark"] as const).map((value) => {
            const Icon = themeIcons[value];
            return (
              <button
                key={value}
                onClick={() => setMode(value)}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-all ${
                  mode === value
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden min-[280px]:inline">
                  {t(`common.${value}`)}
                </span>
              </button>
            );
          })}
        </div>

        <Button
          variant="outline"
          className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive hover:border-destructive/50"
          onClick={() => logout()}
        >
          <LogOut className="h-4 w-4" />
          {t("common.logout")}
        </Button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="lg:flex">
        {/* Mobile header */}
        <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border/50 bg-background/80 px-4 backdrop-blur-xl lg:hidden">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Package className="h-4 w-4" />
            </div>
            <div>
              <div className="text-sm font-bold tracking-tight">SmartCAMPOST</div>
              <div className="text-[10px] text-muted-foreground">
                {t(`users.roles.${role.toLowerCase()}`)}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <input
              aria-label={t("tracking.quickTrackLabel")}
              className="hidden h-8 w-32 rounded-lg border border-border bg-muted/50 px-3 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 min-[430px]:block"
              value={quickTrack}
              onChange={(event) => setQuickTrack(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") submitQuickTrack();
              }}
              placeholder={t("tracking.quickTrack", "Track ref")}
            />
            <NotificationsDrawer />
            <LanguageSwitcher variant="toggle" />
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              aria-label={t("nav.openNavigation")}
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </header>

        {/* Desktop sidebar */}
        <aside className="hidden w-64 shrink-0 border-r border-border/50 bg-card text-card-foreground lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:p-4">
          {sidebarContent}
        </aside>

        {/* Mobile drawer */}
        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              aria-label={t("nav.closeNavigation")}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            <aside className="relative flex h-full w-[min(18rem,85vw)] flex-col border-r border-border/50 bg-card p-4 text-card-foreground shadow-2xl">
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-2 h-8 w-8 rounded-full"
                aria-label={t("nav.closeNavigation")}
                onClick={() => setMobileOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
              {sidebarContent}
            </aside>
          </div>
        )}

        {/* Main content area */}
        <main className="min-w-0 flex-1">
          {/* Desktop header */}
          <div className="sticky top-0 z-30 hidden h-14 items-center justify-end gap-3 border-b border-border/50 bg-background/80 px-6 backdrop-blur-xl lg:flex">
            <div className="mr-auto" />
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  aria-label={t("tracking.quickTrackLabel")}
                  className="h-9 w-72 rounded-lg border border-border bg-muted/30 pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
                  value={quickTrack}
                  onChange={(event) => setQuickTrack(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") submitQuickTrack();
                  }}
                  placeholder={t("tracking.quickTrack", "Track parcel")}
                />
              </div>
            </div>
            <NotificationsDrawer />
            <LanguageSwitcher variant="toggle" />
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
              {initials}
            </div>
          </div>

          {/* Page content */}
          <div className="p-4 sm:p-6 lg:p-8">
            <AnimatePresence mode="wait">
              <PageTransition key={location.pathname}>
                <Outlet />
              </PageTransition>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}
