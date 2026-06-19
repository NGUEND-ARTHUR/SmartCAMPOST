import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Menu, X } from "lucide-react";
import type { AppRole } from "@/lib/routeByRole";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/ui/languageswitcher";
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
    { to: "/agent/live-logistics", labelKey: "nav.liveLogistics" },
    { to: "/agent/gps", labelKey: "nav.mobileGps" },
    { to: "/agent/route-optimization", labelKey: "nav.routeOptimization" },
    { to: "/agent/scan", labelKey: "nav.scanConsole" },
    { to: "/agent/delivery-tools", labelKey: "nav.deliveryTools" },
    { to: "/agent/profile", labelKey: "nav.profile" },
  ],
  COURIER: [
    { to: "/courier", labelKey: "nav.dashboard" },
    { to: "/courier/map", labelKey: "nav.map" },
    { to: "/courier/live-logistics", labelKey: "nav.liveLogistics" },
    { to: "/courier/gps", labelKey: "nav.mobileGps" },
    { to: "/courier/route-optimization", labelKey: "nav.routeOptimization" },
    { to: "/courier/pickups", labelKey: "nav.myPickups" },
    { to: "/courier/deliveries", labelKey: "nav.myDeliveries" },
    { to: "/courier/deliveries/failed", labelKey: "nav.failedDelivery" },
    { to: "/courier/scan", labelKey: "nav.scanConsole" },
    { to: "/courier/profile", labelKey: "nav.profile" },
  ],
  STAFF: [
    { to: "/staff", labelKey: "nav.dashboard" },
    { to: "/staff/map", labelKey: "nav.map" },
    { to: "/staff/live-logistics", labelKey: "nav.liveLogistics" },
    { to: "/staff/gps", labelKey: "nav.mobileGps" },
    { to: "/staff/gps-trackers", labelKey: "nav.gpsTrackers" },
    { to: "/staff/gps-trackers/new", labelKey: "nav.registerGpsTracker" },
    { to: "/staff/iot-gps", labelKey: "nav.iotGps" },
    { to: "/staff/route-optimization", labelKey: "nav.routeOptimization" },
    { to: "/staff/pickup-recommendations", labelKey: "nav.pickupRecommendations" },
    { to: "/staff/distance-pricing", labelKey: "nav.distancePricing" },
    { to: "/staff/parcels", labelKey: "nav.parcels" },
    { to: "/staff/tracking", labelKey: "nav.tracking" },
    { to: "/staff/pickups", labelKey: "nav.pickups" },
    { to: "/staff/deliveries", labelKey: "nav.deliveries" },
    { to: "/staff/payments", labelKey: "nav.payments" },
    { to: "/staff/support", labelKey: "nav.support" },
    { to: "/staff/scan", labelKey: "nav.scanConsole" },
    { to: "/staff/bulk-scans", labelKey: "nav.bulkScans" },
    { to: "/staff/notifications", labelKey: "nav.notifications" },
    { to: "/staff/notification-templates", labelKey: "nav.notificationTemplates" },
    { to: "/staff/otp-logs", labelKey: "nav.otpLogs" },
    { to: "/staff/analytics", labelKey: "nav.analytics" },
    { to: "/staff/advanced-analytics", labelKey: "nav.advancedAnalytics" },
    { to: "/staff/operations-intelligence", labelKey: "nav.operationsIntelligence" },
    { to: "/staff/ai-discovery", labelKey: "nav.aiDiscovery" },
    { to: "/staff/rbac-permissions", labelKey: "nav.rbacPermissions" },
    { to: "/staff/integrations", labelKey: "nav.integrations" },
    { to: "/staff/profile", labelKey: "nav.profile" },
  ],
  ADMIN: [
    { to: "/admin", labelKey: "nav.dashboard" },
    { to: "/admin/map", labelKey: "nav.map" },
    { to: "/admin/live-logistics", labelKey: "nav.liveLogistics" },
    { to: "/admin/gps", labelKey: "nav.mobileGps" },
    { to: "/admin/gps-trackers", labelKey: "nav.gpsTrackers" },
    { to: "/admin/gps-trackers/new", labelKey: "nav.registerGpsTracker" },
    { to: "/admin/iot-gps", labelKey: "nav.iotGps" },
    { to: "/admin/route-optimization", labelKey: "nav.routeOptimization" },
    { to: "/admin/pickup-recommendations", labelKey: "nav.pickupRecommendations" },
    { to: "/admin/distance-pricing", labelKey: "nav.distancePricing" },
    { to: "/admin/parcels", labelKey: "nav.parcels" },
    { to: "/admin/pickups", labelKey: "nav.pickups" },
    { to: "/admin/deliveries", labelKey: "nav.deliveries" },
    { to: "/admin/payments", labelKey: "nav.payments" },
    { to: "/admin/support", labelKey: "nav.support" },
    { to: "/admin/tracking", labelKey: "nav.tracking" },
    { to: "/admin/scan", labelKey: "nav.scanConsole" },
    { to: "/admin/bulk-scans", labelKey: "nav.bulkScans" },
    { to: "/admin/staff", labelKey: "nav.staffDashboard" },
    { to: "/admin/users/staff", labelKey: "nav.staffManagement" },
    { to: "/admin/users/agents", labelKey: "nav.agentManagement" },
    { to: "/admin/users/couriers", labelKey: "nav.courierManagement" },
    { to: "/admin/users/agencies", labelKey: "nav.agencyManagement" },
    { to: "/admin/users/clients", labelKey: "nav.clientManagement" },
    { to: "/admin/tariffs", labelKey: "nav.tariffManagement" },
    { to: "/admin/integrations", labelKey: "nav.integrations" },
    { to: "/admin/ussd", labelKey: "nav.ussd" },
    { to: "/admin/accounts", labelKey: "nav.userAccounts" },
    { to: "/admin/self-healing", labelKey: "nav.selfHealing" },
    { to: "/admin/approvals", labelKey: "nav.approvals" },
    { to: "/admin/notifications", labelKey: "nav.notifications" },
    { to: "/admin/notification-templates", labelKey: "nav.notificationTemplates" },
    { to: "/admin/otp-logs", labelKey: "nav.otpLogs" },
    { to: "/admin/analytics", labelKey: "nav.analytics" },
    { to: "/admin/advanced-analytics", labelKey: "nav.advancedAnalytics" },
    { to: "/admin/operations-intelligence", labelKey: "nav.operationsIntelligence" },
    { to: "/admin/ai-discovery", labelKey: "nav.aiDiscovery" },
    { to: "/admin/rbac-permissions", labelKey: "nav.rbacPermissions" },
    { to: "/admin/rbac-permissions/grant", labelKey: "nav.grantPermission" },
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

export function RoleLayout({ role }: { role: AppRole }) {
  const { logout, user } = useAuthStore();
  const { t } = useTranslation();
  const { mode, setMode } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [quickTrack, setQuickTrack] = useState("");
  const navigate = useNavigate();

  const submitQuickTrack = () => {
    const ref = quickTrack.trim();
    if (!ref) return;
    navigate(`/tracking?ref=${encodeURIComponent(ref)}`);
    setQuickTrack("");
  };

  const nav = (
    <>
      <div className="mb-6">
        <div className="font-bold text-lg">SmartCAMPOST</div>
        <div className="text-sm text-muted-foreground">
          {user?.name || "-"} • {t(`users.roles.${role.toLowerCase()}`)}
        </div>
      </div>

      <nav className="space-y-1 flex-1 overflow-y-auto pr-1">
        {navByRole[role].map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === `/${role.toLowerCase()}`}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `block rounded px-3 py-2 text-sm transition-colors ${isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"}`
            }
          >
            {t(item.labelKey, { defaultValue: item.labelKey.replace("nav.", "") })}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto space-y-3 pt-4">
        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground">
            {t("common.theme")}
          </div>
          <div className="grid grid-cols-3 gap-1 rounded-lg bg-muted p-1">
            {(["system", "light", "dark"] as const).map((value) => (
              <button
                key={value}
                onClick={() => setMode(value)}
                className={`px-2 py-1 text-sm font-medium rounded-md transition-colors ${
                  mode === value
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t(`common.${value}`)}
              </button>
            ))}
          </div>
        </div>
        <LanguageSwitcher variant="default" className="w-full justify-start" />
        <Button variant="outline" className="w-full" onClick={() => logout()}>
          {t("common.logout")}
        </Button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="lg:flex">
        <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b bg-background/95 px-4 backdrop-blur lg:hidden">
          <div>
            <div className="font-semibold">SmartCAMPOST</div>
            <div className="text-xs text-muted-foreground">
              {t(`users.roles.${role.toLowerCase()}`)}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              aria-label="Quick track"
              className="hidden h-9 w-36 rounded-md border bg-background px-3 text-sm min-[430px]:block"
              value={quickTrack}
              onChange={(event) => setQuickTrack(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") submitQuickTrack();
              }}
              placeholder={t("tracking.quickTrack", "Track ref")}
            />
            <LanguageSwitcher variant="toggle" />
            <Button
              variant="outline"
              size="icon"
              aria-label="Open navigation"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </header>

        <aside className="hidden w-64 shrink-0 border-r border-border bg-card text-card-foreground lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:p-4">
          {nav}
        </aside>

        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              aria-label="Close navigation"
              className="absolute inset-0 bg-black/50"
              onClick={() => setMobileOpen(false)}
            />
            <aside className="relative flex h-full w-[min(20rem,85vw)] flex-col border-r bg-card p-4 text-card-foreground shadow-xl">
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-2"
                aria-label="Close navigation"
                onClick={() => setMobileOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
              {nav}
            </aside>
          </div>
        )}

        <main className="min-w-0 flex-1">
          <div className="sticky top-0 z-30 hidden h-14 items-center justify-end gap-3 border-b bg-background/95 px-6 backdrop-blur lg:flex">
            <div className="flex items-center gap-2">
              <input
                aria-label="Quick track"
                className="h-9 w-72 rounded-md border bg-background px-3 text-sm"
                value={quickTrack}
                onChange={(event) => setQuickTrack(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") submitQuickTrack();
                }}
                placeholder={t("tracking.quickTrack", "Track parcel")}
              />
              <Button variant="outline" size="sm" onClick={submitQuickTrack}>
                {t("common.search")}
              </Button>
            </div>
            <LanguageSwitcher variant="toggle" />
          </div>
          <div className="p-4 sm:p-6">
          <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
